import { isValidPhoneNumber } from "libphonenumber-js";
import { z } from "zod";

export const accountFormSchema = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
  email: z.string().email("البريد الإلكتروني غير صالح").readonly().nullable().optional(),
  goalBand: z
    .number({
      message: "يرجى اختيار الدرجة التي تهدف لها بشكل صحيح",
    })
    .min(1, "يجب أن تكون الدرجة التي تهدف لها بين 1 و 9")
    .max(9, "يجب أن تكون الدرجة التي تهدف لها بين 1 و 9")
    .optional(),
  phone: z
    .string()
    .optional()
    .refine(
      value => {
        if (!value) return true; // Skip validation if value is empty/undefined
        return isValidPhoneNumber(value);
      },
      { message: "يرجى تقديم رقم هاتف صالح" },
    ),
  theme: z.enum(["light", "dark"]).optional(),
  image: z.string().optional(),
  status: z.enum(["PENDING", "ACTIVE", "SUSPENDED"]).optional(),
  deletedAt: z.date().optional(),
});

export type AccountFormValues = z.infer<typeof accountFormSchema>;
