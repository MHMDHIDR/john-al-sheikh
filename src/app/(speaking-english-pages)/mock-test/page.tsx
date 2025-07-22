import { redirect } from "next/navigation";
import ConversationUI from "@/components/custom/conversation-ui";
import { env } from "@/env";
import { isEnoughMinutesForMockTest } from "@/lib/is-enough-minutes";
import { auth } from "@/server/auth";
import { api } from "@/trpc/server";
import type { UserProfile } from "@/components/custom/full-speaking-recorder-button";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: `المحادثة التدريبية | ${env.NEXT_PUBLIC_APP_NAME}`,
  description: env.NEXT_PUBLIC_APP_DESCRIPTION,
};

export default async function MockTestPage() {
  const session = await auth();
  const user = session?.user;
  const hasPhone = session?.user?.phone;
  const hasEmail = session?.user?.email;
  const isProfileCompleted = session?.user?.profileCompleted;

  if (!user) {
    redirect("/signin?callbackUrl=/mock-test");
  }

  // Check if user has enough credits to proceed with the mock test
  const minutes = await api.payments.getUserMinutes();

  // For Twitter users, we need both email and phone to be complete
  // For other providers, we only need phone to be complete
  const isTwitterUser = !hasEmail;
  const isComplete = isProfileCompleted && hasPhone && (!isTwitterUser || hasEmail);

  if (session && !isComplete) {
    redirect("/onboarding");
  }

  // If user doesn't have enough minutes, redirect to buy-minutes page
  if (!isEnoughMinutesForMockTest(minutes)) {
    redirect("/buy-minutes");
  }

  const userProfile: UserProfile = {
    id: user.id,
    name: user.name ?? "",
    age: user.age ?? 0,
    gender: user.gender as UserProfile["gender"],
    hobbies: user.hobbies ?? [],
    nationality: user.nationality ?? "",
    goalBand: user.goalBand ?? 0,
  };

  return <ConversationUI user={userProfile} mode="mock-test" title="اختبار المحادثة التدريبي" />;
}
