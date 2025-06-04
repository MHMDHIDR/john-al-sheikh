import { TRPCError } from "@trpc/server";
import { eq, sql } from "drizzle-orm";
import { Resend } from "resend";
import { z } from "zod";
import { formSchema } from "@/app/schemas/subscription-from";
import { WelcomeEmailTemplate } from "@/components/custom/welcome-email";
import { env } from "@/env";
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
        subject: `مرحباً بك في منصة ${env.NEXT_PUBLIC_APP_NAME} للايلتس`,
        react: WelcomeEmailTemplate({
          name: input.fullname,
          ieltsGoal: input.ieltsGoal.toString() ?? "5.0",
          signupUrl: `${env.NEXT_PUBLIC_APP_URL}/signin`,
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

  sendNewsletter: protectedProcedure.input(newsletterSchema).mutation(async ({ input }) => {
    try {
      const resend = new Resend(env.AUTH_RESEND_KEY);

      // Send to each recipient
      const sendPromises = input.recipients.map(recipient =>
        resend.emails.send({
          from: env.ADMIN_EMAIL,
          to: recipient.email,
          subject: input.subject,
          react: WelcomeEmailTemplate({
            name: recipient.name,
            signupUrl: `${env.NEXT_PUBLIC_APP_URL}/signin`,
            ctaButtonLabel: "زيارة المنصة",
            customContent: input.content,
          }),
        }),
      );

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

  deleteSubscriber: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        email: z.string().email(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        await ctx.db
          .delete(subscribedEmails)
          .where(eq(subscribedEmails.email, input.email))
          .returning({ email: subscribedEmails.email });
        // Optionally, you can send a confirmation email or log the deletion
        const resend = new Resend(env.AUTH_RESEND_KEY);
        await resend.emails.send({
          from: env.ADMIN_EMAIL,
          to: input.email,
          subject: "تم حذف اشتراكك",
          react: WelcomeEmailTemplate({
            name: input.name,
            customContent: `لقد تم حذف اشتراكك من القائمة البريدية من منصة ${env.NEXT_PUBLIC_APP_NAME}. إذا كنت ترغب في إعادة الاشتراك، يمكنك زيارة الرابط أدناه.`,
            signupUrl: `${env.NEXT_PUBLIC_APP_URL}/subscribe`,
            ctaButtonLabel: "إعادة الاشتراك",
          }),
        });

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
