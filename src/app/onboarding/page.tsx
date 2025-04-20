import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import OnboardingForm from "./onboarding-form";

export default async function OnboardingPage() {
  const session = await auth();
  if (!session) {
    redirect("/signin?callbackUrl=/onboarding");
  }

  if (session.user.profileCompleted) {
    redirect("/account");
  }

  return <OnboardingForm session={session} />;
}
