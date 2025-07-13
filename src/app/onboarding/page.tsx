import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { api } from "@/trpc/server";
import OnboardingForm from "./onboarding-form";

export default async function OnboardingPage() {
  const session = await auth();
  const profileCompleted = session?.user?.profileCompleted;
  const hasPhone = session?.user?.phone;
  const hasEmail = session?.user?.email;

  if (!session) {
    redirect("/signin?callbackUrl=/onboarding");
  }

  // For Twitter users, we need both email and phone to be complete
  // For other providers, we only need phone to be complete
  const isTwitterUser = !hasEmail;
  const isComplete = profileCompleted && hasPhone && (!isTwitterUser || hasEmail);

  if (isComplete) {
    redirect("/account");
  }

  const profileData = await api.users.checkProfileCompletion();

  return <OnboardingForm session={session} profileData={profileData} />;
}
