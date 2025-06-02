import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import OnboardingForm from "./onboarding-form";

export default async function OnboardingPage() {
  const session = await auth();
  const profileCompleted = session?.user?.profileCompleted;

  if (!session) {
    redirect("/signin?callbackUrl=/onboarding");
  }

  if (profileCompleted) {
    redirect("/account");
  }

  return <OnboardingForm session={session} />;
}
