import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { Resend } from "resend";
import { z } from "zod";
import { formSchema } from "@/app/schemas/subscription-from";
import NewsletterEmailTemplate from "@/emails/newsletter-email";
import WelcomeEmailTemplate from "@/emails/welcome-email";
import { env } from "@/env";
import { generateUnsubscribeToken, verifyUnsubscribeToken } from "@/lib/unsubscribe-token";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "@/server/api/trpc";
import { subscribedEmails, users } from "@/server/db/schema";
import type { SubscribedEmail, Users } from "@/server/db/schema";

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
      // First check if user exists in users table
      const existingUser = await ctx.db.query.users.findFirst({
        where: eq(users.email, input.email),
      });

      if (existingUser) {
        // User exists, check if already subscribed to newsletter
        if (existingUser.isNewsletterSubscribed) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "لقد اشتركت مسبقاً باستخدام هذا البريد الإلكتروني",
          });
        }

        // User exists but not subscribed to newsletter, toggle the flag
        await ctx.db
          .update(users)
          .set({ isNewsletterSubscribed: true })
          .where(eq(users.email, input.email));

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
      }

      // User doesn't exist, check if email exists in subscribedEmails table
      const existingSubscription = await ctx.db.query.subscribedEmails.findFirst({
        where: eq(subscribedEmails.email, input.email),
      });

      if (existingSubscription) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "لقد اشتركت مسبقاً باستخدام هذا البريد الإلكتروني",
        });
      }

      // Insert new subscription to subscribedEmails table
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
    // Get subscribers from both tables
    const [subscribedEmailsList, subscribedUsers] = await Promise.all([
      ctx.db.query.subscribedEmails.findMany(),
      ctx.db.query.users.findMany({
        where: eq(users.isNewsletterSubscribed, true),
      }),
    ]);

    // Combine and deduplicate emails using Map
    const subscriberMap = new Map<
      string,
      {
        id: SubscribedEmail["id"];
        name: SubscribedEmail["fullname"];
        email: SubscribedEmail["email"];
        gender: Users["gender"];
        ieltsGoal: SubscribedEmail["ieltsGoal"];
        createdAt: SubscribedEmail["createdAt"];
        source: "subscribed_emails" | "users";
      }
    >();

    // Add subscribed emails first (these take priority)
    subscribedEmailsList.forEach(sub => {
      subscriberMap.set(sub.email, {
        id: sub.id,
        name: sub.fullname,
        email: sub.email,
        gender: null,
        ieltsGoal: sub.ieltsGoal,
        createdAt: sub.createdAt,
        source: "subscribed_emails" as const,
      });
    });

    // Add user emails only if they don't already exist
    subscribedUsers.forEach(user => {
      if (!subscriberMap.has(user.email)) {
        subscriberMap.set(user.email, {
          id: user.id,
          name: user.name,
          email: user.email,
          gender: user.gender,
          ieltsGoal: user.goalBand ?? 5,
          createdAt: user.createdAt,
          source: "users" as const,
        });
      }
    });

    const combinedSubscribers = Array.from(subscriberMap.values());
    const totalCount = combinedSubscribers.length;

    return { subscribers: combinedSubscribers, count: totalCount };
  }),

  sendNewsletter: protectedProcedure.input(newsletterSchema).mutation(async ({ input, ctx }) => {
    try {
      const resend = new Resend(env.AUTH_RESEND_KEY);

      // Send to each recipient
      const sendPromises = input.recipients.map(async recipient => {
        // Check both tables for unsubscribe token generation
        const [tokenResultFromSubscribed, tokenResultFromUsers] = await Promise.all([
          ctx.db.query.subscribedEmails.findFirst({
            where: eq(subscribedEmails.email, recipient.email),
          }),
          ctx.db.query.users.findFirst({
            where: eq(users.email, recipient.email),
          }),
        ]);

        let unsubscribeToken = "";

        // Generate token based on which table the email exists in
        if (tokenResultFromSubscribed) {
          unsubscribeToken = generateUnsubscribeToken(tokenResultFromSubscribed);
        } else if (tokenResultFromUsers?.isNewsletterSubscribed) {
          unsubscribeToken = generateUnsubscribeToken(tokenResultFromUsers);
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
        // Check both tables
        const [subscriberFromEmails, subscriberFromUsers] = await Promise.all([
          ctx.db.query.subscribedEmails.findFirst({
            where: eq(subscribedEmails.email, input.email),
          }),
          ctx.db.query.users.findFirst({
            where: eq(users.email, input.email),
          }),
        ]);

        let subscriber = null;
        let fullname = "";

        if (subscriberFromEmails) {
          subscriber = subscriberFromEmails;
          fullname = subscriberFromEmails.fullname;
        } else if (subscriberFromUsers?.isNewsletterSubscribed) {
          subscriber = subscriberFromUsers;
          fullname = subscriberFromUsers.name;
        }

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
            fullname,
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
        // Get all subscribers from both tables
        const [allSubscribedEmails, allSubscribedUsers] = await Promise.all([
          ctx.db.query.subscribedEmails.findMany(),
          ctx.db.query.users.findMany({
            where: eq(users.isNewsletterSubscribed, true),
          }),
        ]);

        // Combine all subscribers
        const allSubscribers = [...allSubscribedEmails, ...allSubscribedUsers];

        // Find subscriber by token
        const subscriber = verifyUnsubscribeToken(input.token, allSubscribers);

        if (!subscriber) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "رابط إلغاء الاشتراك غير صحيح أو منتهي الصلاحية",
          });
        }

        // Determine fullname based on subscriber type
        const fullname = "fullname" in subscriber ? subscriber.fullname : subscriber.name;

        return {
          subscriber: {
            id: subscriber.id,
            fullname,
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
        // Get all subscribers from both tables
        const [allSubscribedEmails, allSubscribedUsers] = await Promise.all([
          ctx.db.query.subscribedEmails.findMany(),
          ctx.db.query.users.findMany({
            where: eq(users.isNewsletterSubscribed, true),
          }),
        ]);

        // Combine all subscribers
        const allSubscribers = [...allSubscribedEmails, ...allSubscribedUsers];

        // Find subscriber by token
        const subscriber = verifyUnsubscribeToken(input.token, allSubscribers);

        if (!subscriber) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "رابط إلغاء الاشتراك غير صحيح أو منتهي الصلاحية",
          });
        }

        // Handle deletion based on subscriber type
        if ("fullname" in subscriber) {
          // This is a subscribedEmails record, delete it
          await ctx.db
            .delete(subscribedEmails)
            .where(eq(subscribedEmails.id, subscriber.id))
            .returning({ email: subscribedEmails.email });
        } else {
          // This is a users record, toggle the newsletter subscription flag
          await ctx.db
            .update(users)
            .set({ isNewsletterSubscribed: false })
            .where(eq(users.id, subscriber.id));
        }

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
        // Check both tables
        const [subscriberFromEmails, subscriberFromUsers] = await Promise.all([
          ctx.db.query.subscribedEmails.findFirst({
            where: eq(subscribedEmails.email, input.email),
          }),
          ctx.db.query.users.findFirst({
            where: eq(users.email, input.email),
          }),
        ]);

        if (subscriberFromEmails) {
          // Delete from subscribedEmails table
          await ctx.db
            .delete(subscribedEmails)
            .where(eq(subscribedEmails.email, input.email))
            .returning({ email: subscribedEmails.email });
        } else if (subscriberFromUsers?.isNewsletterSubscribed) {
          // Toggle newsletter subscription flag in users table
          await ctx.db
            .update(users)
            .set({ isNewsletterSubscribed: false })
            .where(eq(users.email, input.email));
        } else {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "البريد الإلكتروني غير موجود في قائمة المشتركين",
          });
        }

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
});
