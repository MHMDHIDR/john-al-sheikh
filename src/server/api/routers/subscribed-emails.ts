import { TRPCError } from "@trpc/server";
import { eq, sql } from "drizzle-orm";
import { Resend } from "resend";
import { z } from "zod";
import { formSchema } from "@/app/schemas/subscription-from";
import NewsletterEmailTemplate from "@/emails/newsletter-email";
import WelcomeEmailTemplate from "@/emails/welcome-email";
import { env } from "@/env";
import { generateUnsubscribeToken, verifyUnsubscribeToken } from "@/lib/unsubscribe-token";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "@/server/api/trpc";
import { subscribedEmails } from "@/server/db/schema";

const newsletterSchema = z.object({
  subject: z.string().min(1, "عنوان البريد الإلكتروني مطلوب"),
  content: z.string().min(1, "محتوى البريد الإلكتروني مطلوب"),
  recipients: z.array(
    z.object({
      email: z.string().email(),
      name: z.string().nullable(),
    }),
  ),
  ctaButtonLabel: z.string().optional(),
  ctaUrl: z.string().optional(),
});

export const subscribedEmailsRouter = createTRPCRouter({
  subscribe: publicProcedure.input(formSchema).mutation(async ({ ctx, input }) => {
    try {
      // Check if email already exists
      const existingSubscription = await ctx.db.query.subscribedEmails.findFirst({
        where: eq(subscribedEmails.email, input.email),
      });

      if (existingSubscription) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "لقد اشتركت مسبقاً باستخدام هذا البريد الإلكتروني",
        });
      }

      // Insert new subscription
      await ctx.db.insert(subscribedEmails).values({
        fullname: input.fullname,
        email: input.email,
        ieltsGoal: input.ieltsGoal ?? 5,
      });

      // Send welcome email
      const resend = new Resend(env.AUTH_RESEND_KEY);
      await resend.emails.send({
        from: env.ADMIN_EMAIL,
        to: input.email,
        subject: `مرحباً بك في منصة ${env.NEXT_PUBLIC_APP_NAME}`,
        react: WelcomeEmailTemplate({
          name: input.fullname,
          customContent: `<p>أهلاً ${input.fullname}،<br/>شكرًا لاشتراكك في نشرتنا البريدية! سنرسل لك كل جديد حول تعلم الإنجليزية ونجاحك في اختبار الايلتس.</p>`,
          ctaUrl: `${env.NEXT_PUBLIC_APP_URL}/signin`,
        }),
      });

      return { success: true };
    } catch (error) {
      if (error instanceof TRPCError) throw error;

      console.error("Subscription error:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "حدث خطأ أثناء عملية الاشتراك",
      });
    }
  }),

  getSubscribers: protectedProcedure.query(async ({ ctx }) => {
    const subscribersList = await ctx.db.query.subscribedEmails.findMany();
    const [{ count = 0 } = { count: 0 }] = await ctx.db
      .select({ count: sql<number>`count(*)::int` })
      .from(subscribedEmails);

    return { subscribers: subscribersList, count };
  }),

  sendNewsletter: protectedProcedure.input(newsletterSchema).mutation(async ({ input, ctx }) => {
    try {
      const resend = new Resend(env.AUTH_RESEND_KEY);

      // Send to each recipient
      const sendPromises = input.recipients.map(async recipient => {
        // Generate unsubscribe token for this recipient
        const tokenResult = await ctx.db.query.subscribedEmails.findFirst({
          where: eq(subscribedEmails.email, recipient.email),
        });

        let unsubscribeToken = "";
        if (tokenResult) {
          unsubscribeToken = generateUnsubscribeToken(tokenResult);
        }

        return resend.emails.send({
          from: env.ADMIN_EMAIL,
          to: recipient.email,
          subject: input.subject,
          react: NewsletterEmailTemplate({
            senderName: ctx.session?.user?.name ?? "فريق المنصة",
            name: recipient.name,
            subject: input.subject,
            customContent: input.content,
            ctaUrl: input.ctaUrl ?? `${env.NEXT_PUBLIC_APP_URL}/signin`,
            ctaButtonLabel: input.ctaButtonLabel ?? "زيارة المنصة",
            unsubscribeToken,
          }),
        });
      });

      const [data] = await Promise.all(sendPromises);

      return { success: data?.data?.id ? true : false };
    } catch (error) {
      console.error("Newsletter sending error:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "حدث خطأ أثناء إرسال النشرة البريدية",
      });
    }
  }),

  generateUnsubscribeToken: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .query(async ({ ctx, input }) => {
      try {
        const subscriber = await ctx.db.query.subscribedEmails.findFirst({
          where: eq(subscribedEmails.email, input.email),
        });

        if (!subscriber) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "البريد الإلكتروني غير موجود في قائمة المشتركين",
          });
        }

        // Generate a secure token using subscriber ID and email
        const token = generateUnsubscribeToken(subscriber);

        return {
          token,
          subscriber: {
            id: subscriber.id,
            fullname: subscriber.fullname,
            email: subscriber.email,
          },
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;

        console.error("Generate unsubscribe token error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "حدث خطأ أثناء إنشاء رابط إلغاء الاشتراك",
        });
      }
    }),

  verifyUnsubscribeToken: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        // Get all subscribers to verify token
        const allSubscribers = await ctx.db.query.subscribedEmails.findMany();

        // Find subscriber by token
        const subscriber = verifyUnsubscribeToken(input.token, allSubscribers);

        if (!subscriber) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "رابط إلغاء الاشتراك غير صحيح أو منتهي الصلاحية",
          });
        }

        return {
          subscriber: {
            id: subscriber.id,
            fullname: subscriber.fullname,
            email: subscriber.email,
          },
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;

        console.error("Verify unsubscribe token error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "حدث خطأ أثناء التحقق من رابط إلغاء الاشتراك",
        });
      }
    }),

  deleteSubscriber: publicProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Get all subscribers to verify token
        const allSubscribers = await ctx.db.query.subscribedEmails.findMany();

        // Find subscriber by token
        const subscriber = verifyUnsubscribeToken(input.token, allSubscribers);

        if (!subscriber) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "رابط إلغاء الاشتراك غير صحيح أو منتهي الصلاحية",
          });
        }

        // Delete the subscriber
        await ctx.db
          .delete(subscribedEmails)
          .where(eq(subscribedEmails.id, subscriber.id))
          .returning({ email: subscribedEmails.email });

        return { success: true };
      } catch (error) {
        if (error instanceof TRPCError) throw error;

        console.error("Delete subscriber error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "حدث خطأ أثناء حذف المشترك",
        });
      }
    }),

  // Keep the old method for admin panel compatibility
  deleteSubscriberByEmail: protectedProcedure
    .input(z.object({ name: z.string(), email: z.string().email() }))
    .mutation(async ({ ctx, input }) => {
      try {
        await ctx.db
          .delete(subscribedEmails)
          .where(eq(subscribedEmails.email, input.email))
          .returning({ email: subscribedEmails.email });

        return { success: true };
      } catch (error) {
        console.error("Delete subscriber error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "حدث خطأ أثناء حذف المشترك",
        });
      }
    }),
});
