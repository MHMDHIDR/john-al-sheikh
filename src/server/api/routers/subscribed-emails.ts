import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { Resend } from "resend";
import { formSchema } from "@/app/schemas/subscription-from";
import { WelcomeEmailTemplate } from "@/components/custom/welcome-email";
import { env } from "@/env";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { subscribedEmails } from "@/server/db/schema";

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
        subject: "مرحباً بك في نشرة جون آل-شيخ للايلتس",
        react: WelcomeEmailTemplate({
          name: input.fullname,
          ieltsGoal: input.ieltsGoal.toString() ?? "5.0",
          signupUrl: `${env.NEXT_PUBLIC_APP_URL}/signup`,
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
});
