import { redirect } from "next/navigation";
import { QuickSpeakingTest } from "@/components/custom/quick-speaking-test";
import { env } from "@/env";
import { auth } from "@/server/auth";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: env.NEXT_PUBLIC_APP_NAME,
  description: env.NEXT_PUBLIC_APP_DESCRIPTION,
};

export default async function Home() {
  const session = await auth();
  const isProfileCompleted = session?.user?.profileCompleted;

  if (session && !isProfileCompleted) {
    redirect("/onboarding");
  }

  return <QuickSpeakingTest />;
}
