import { isValidPhoneNumber } from "libphonenumber-js";
import { z } from "zod";

export const onboardingSchema = z.object({
  displayName: z
    .string()
    .min(2, "الاسم الكامل يجب أن يكون حرفين على الأقل")
    .max(50, "الاسم الكامل طويل جداً"),
  username: z
    .string()
    .min(3, "اسم المستخدم يجب أن يكون 3 أحرف على الأقل")
    .max(20, "اسم المستخدم طويل جداً")
    .regex(/^[a-zA-Z0-9_-]{3,20}$/, "اسم المستخدم يجب أن يحتوي على أحرف إنجليزية وأرقام فقط"),
  gender: z.enum(["male", "female"], {
    invalid_type_error: "يرجى اختيار النوع",
  }),
  goalBand: z
    .number({
      message: "يرجى اختيار الدرجة التي تهدف لها بشكل صحيح",
    })
    .min(1, "يجب أن تكون الدرجة التي تهدف لها بين 1 و 9")
    .max(9, "يجب أن تكون الدرجة التي تهدف لها بين 1 و 9"),
  phone: z
    .string()
    // .optional()
    .refine(
      value => {
        // if (!value) return true; // Skip validation if value is empty/undefined
        return isValidPhoneNumber(value);
      },
      { message: "يرجى تقديم رقم هاتف صالح" },
    ),

  // age: z
  //   .number({
  //     message: "يرجى كتابة عمرك بشكل صحيح",
  //   })
  //   .min(10, "يجب أن يكون عمرك 10 عامًا على الأقل")
  //   .max(100, "يجب أن يكون عمرك 100 عامًا على الأكثر"),
  // nationality: z.string().min(1, "يرجى اختيار الجنسية"),

  hobbies: z.array(z.string()).min(1, "يرجى اختيار هواية واحدة على الأقل"),
  profileImage: z.instanceof(File).optional(),
});

export type OnboardingForm = z.infer<typeof onboardingSchema>;
