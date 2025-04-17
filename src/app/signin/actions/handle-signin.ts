"use server";

import { eq } from "drizzle-orm";
import { signInSchema } from "@/app/schemas/auth";
import { signIn } from "@/server/auth";
import { db } from "@/server/db";
import { UserRole, users } from "@/server/db/schema";

export type SignInType = {
  message?: string | string[];
  success?: boolean;
  callbackUrl?: string;
};

export async function handleSignin(state: SignInType, formData: FormData): Promise<SignInType> {
  const validatedFields = signInSchema.safeParse({
    email: formData.get("email"),
  });

  if (!validatedFields.success) {
    return {
      message: validatedFields.error.flatten().fieldErrors.email ?? "Invalid email",
      success: false,
      callbackUrl: state.callbackUrl,
    };
  }

  const { email } = validatedFields.data;

  try {
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    const redirectTo = user?.role === UserRole.ADMIN ? "/admin" : (state.callbackUrl ?? "/");

    await signIn("resend", { email, redirect: false, redirectTo });

    return {
      success: true,
      message: "يرجى التحقق من بريدك الإلكتروني للدخول.",
      callbackUrl: redirectTo,
    };
  } catch (error) {
    return {
      message: error instanceof Error ? error.message : "حدث خطأ غير معروف",
      success: false,
      callbackUrl: state.callbackUrl,
    };
  }
}
