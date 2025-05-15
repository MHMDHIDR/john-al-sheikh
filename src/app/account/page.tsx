import { notFound, redirect } from "next/navigation";
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

  if (!user) {
    redirect("/signin?callbackUrl=/account");
  }

  return (
    <section className="container px-6 py-10 mx-auto">
      <h1 className="mb-6 text-lg md:text-3xl font-bold text-center select-none">تفاصيل الحساب</h1>
      <AccountForm user={user} />
    </section>
  );
}
