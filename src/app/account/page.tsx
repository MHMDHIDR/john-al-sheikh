import { redirect } from "next/navigation";
import { env } from "@/env";
import { auth } from "@/server/auth";
import { AccountForm } from "./account-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: `الحساب | ${env.NEXT_PUBLIC_APP_NAME}`,
  description: env.NEXT_PUBLIC_APP_DESCRIPTION,
};

export default async function Account() {
  const session = await auth();
  const user = session?.user;
  const isProfileCompleted = session?.user?.profileCompleted;
  const hasPhone = session?.user?.phone;
  const hasEmail = session?.user?.email;

  if (!user) {
    redirect("/signin?callbackUrl=/account");
  }

  // For Twitter users, we need both email and phone to be complete
  // For other providers, we only need phone to be complete
  const isTwitterUser = !hasEmail;
  const isComplete = isProfileCompleted && hasPhone && (!isTwitterUser || hasEmail);

  if (session && !isComplete) redirect("/onboarding");

  return (
    <section className="container px-6 py-10 mx-auto">
      <h1 className="mb-6 text-lg md:text-3xl font-bold text-center select-none">تفاصيل الحساب</h1>
      <AccountForm user={user} />
    </section>
  );
}
