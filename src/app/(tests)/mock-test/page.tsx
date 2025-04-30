import { notFound, redirect } from "next/navigation";
import { auth } from "@/server/auth";
import MockTestUI from "./mock-test-ui";
import type { UserProfile } from "@/components/custom/ielts-speaking-recorder";

export default async function MockTestPage() {
  const session = await auth();
  const user = session?.user;

  if (!user) notFound();
  if (!user.profileCompleted) redirect("/onboarding");

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
