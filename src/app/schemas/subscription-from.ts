import { z } from "zod";

export const formSchema = z.object({
  fullname: z.string().min(3, { message: "الاسم يجب ان يكون على الاقل 3 حروف." }),
  email: z.string().email({ message: "الرجاء ادخال بريد إلكتروني صالح." }),
});

export type FormValues = z.infer<typeof formSchema>;
