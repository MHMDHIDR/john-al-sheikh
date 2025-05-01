import { redirect } from "next/navigation";
import { env } from "@/env";
import { auth } from "@/server/auth";
import { ResultsDisplay } from "./results-display";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: `نتيجة اختبار التحدث السريع | ${env.NEXT_PUBLIC_APP_NAME}`,
  description: env.NEXT_PUBLIC_APP_DESCRIPTION,
};

export default async function ResultsPage() {
  const session = await auth();
  const user = session?.user;

  if (!user) {
    redirect("/signin?callbackUrl=/results");
  }

  return <ResultsDisplay session={session} />;
}
