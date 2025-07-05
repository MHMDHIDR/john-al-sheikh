import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { api } from "@/trpc/server";
import OnboardingForm from "./onboarding-form";

export default async function OnboardingPage() {
  const session = await auth();
  const profileCompleted = session?.user?.profileCompleted;
  const hasPhone = session?.user?.phone;

  if (!session) {
    redirect("/signin?callbackUrl=/onboarding");
  }

  if (profileCompleted && hasPhone) {
    redirect("/account");
  }

  const profileData = await api.users.checkProfileCompletion();

  return <OnboardingForm session={session} profileData={profileData} />;
}
