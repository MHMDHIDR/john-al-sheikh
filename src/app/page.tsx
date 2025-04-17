import { redirect } from "next/navigation";
import { SpeakTest } from "@/components/custom/quick-speaking-test";
import { auth } from "@/server/auth";

export default async function Home() {
  const session = await auth();
  const isProfileCompleted = session?.user?.profileCompleted;

  if (session && !isProfileCompleted) {
    redirect("/onboarding");
  }

  return <SpeakTest session={session} />;
}
