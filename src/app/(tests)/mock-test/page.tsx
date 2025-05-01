import { notFound, redirect } from "next/navigation";
import { env } from "@/env";
import { auth } from "@/server/auth";
import { api } from "@/trpc/server";
import MockTestUI from "./mock-test-ui";
import type { UserProfile } from "@/components/custom/ielts-speaking-recorder";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: `المحادثة التدريبية | ${env.NEXT_PUBLIC_APP_NAME}`,
  description: env.NEXT_PUBLIC_APP_DESCRIPTION,
};

export default async function MockTestPage() {
  const session = await auth();
  const user = session?.user;

  if (!user) notFound();
  if (!user.profileCompleted) redirect("/onboarding");

  const stats = await api.users.getUserTestStats();
  const freeTrialEnded = stats.totalCount >= 1;

  // Check if user has enough credits AFTER verifying payment
  const { credits } = await api.payments.getUserCredits();
  console.log("User credits after verification:", credits);

  // If user doesn't have enough credits, redirect to buy-credits page
  if (credits < 1 || freeTrialEnded) redirect("/buy-credits");

  const userProfile: UserProfile = {
    id: user.id,
    name: user.name ?? "",
    age: user.age ?? 0,
    gender: user.gender as UserProfile["gender"],
    hobbies: user.hobbies ?? [],
    nationality: user.nationality ?? "",
    goalBand: user.goalBand ?? 0,
  };

  return <MockTestUI user={userProfile} />;
}
