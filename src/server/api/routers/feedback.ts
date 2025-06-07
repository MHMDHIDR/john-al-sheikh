import { TRPCError } from "@trpc/server";
import { Resend } from "resend";
import { feedbackFormSchema, MAX_FILE_SIZE } from "@/app/schemas/feedback-form";
import { FeedbackEmailTemplate } from "@/components/custom/feedback-email";
import { env } from "@/env";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import type { CreateEmailOptions } from "resend";

type EmailOptionsType = {
  from: CreateEmailOptions["from"];
  to: CreateEmailOptions["to"];
  cc: CreateEmailOptions["cc"];
  subject: CreateEmailOptions["subject"];
  react: CreateEmailOptions["react"];
  text: CreateEmailOptions["text"];
  attachments?: CreateEmailOptions["attachments"];
};

export const feedbackRouter = createTRPCRouter({
  submit: publicProcedure.input(feedbackFormSchema).mutation(async ({ input }) => {
    try {
      // Process attachment if present
      let attachmentBuffer: Buffer | undefined;
      let attachmentName: string | undefined;
      let attachmentType: string | undefined;

      if (input.attachment) {
        try {
          // Convert base64 to buffer
          attachmentBuffer = Buffer.from(input.attachment.base64, "base64");
          attachmentName = input.attachment.name;
          attachmentType = input.attachment.type;

          // Validate file size again on server side
          if (attachmentBuffer.length > MAX_FILE_SIZE) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "المرفق يجب أن يكون أصغر من 5MB",
            });
          }
        } catch (error) {
          console.error("Error processing attachment:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "فشل تحميل المرفق",
          });
        }
      }

      // Send feedback email
      const resend = new Resend(env.AUTH_RESEND_KEY);

      const emailOptions: EmailOptionsType = {
        from: env.ADMIN_EMAIL,
        to: "ahmed.elsir.khalfalla@gmail.com",
        cc: "mr.hamood277@gmail.com",
        text: "",
        subject: `${env.NEXT_PUBLIC_APP_NAME} Feedback: ${input.subject}`,
        react: FeedbackEmailTemplate({
          name: input.name,
          email: input.email,
          subject: input.subject,
          message: input.message,
        }),
      };

      // Add attachment if provided
      if (attachmentBuffer && attachmentName && attachmentType) {
        emailOptions.attachments = [
          {
            filename: attachmentName,
            content: attachmentBuffer,
            contentType: attachmentType,
          },
        ];
      }

      const { data, error } = await resend.emails.send(emailOptions);

      if (error) {
        console.error("Resend API error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "فشل إرسال البريد",
        });
      }

      return {
        success: true,
        messageId: data?.id,
      };
    } catch (error) {
      // If it's already a TRPCError, rethrow it
      if (error instanceof TRPCError) {
        throw error;
      }

      console.error("Feedback submission error:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "حدث خطأ أثناء إرسال الرسالة",
      });
    }
  }),
});
