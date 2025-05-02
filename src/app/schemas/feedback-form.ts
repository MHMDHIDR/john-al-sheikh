import { z } from "zod";

export const MAX_MESSAGE_LENGTH = 700;
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Schema for serializable file attachment
export const fileAttachmentSchema = z
  .object({
    name: z.string(),
    type: z.string(),
    size: z.number(),
    base64: z.string(),
  })
  .optional();

export const feedbackFormSchema = z.object({
  name: z.string().min(2, { message: "اسمك يجب أن يكون على حرفين على الأقل." }),
  email: z.string().email({ message: "يرجى إدخال عنوان بريد إلكتروني صالح." }),
  subject: z.string().min(2, { message: "الموضوع يجب أن يكون على حرفين على الأقل." }),
  message: z.string().min(10, { message: "الرسالة يجب أن تكون على الأقل 10 أحرف." }),
  attachment: fileAttachmentSchema,
});

export type FeedbackFormValues = z.infer<typeof feedbackFormSchema>;
