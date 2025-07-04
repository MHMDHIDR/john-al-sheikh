import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { api } from "@/trpc/server";
import SpeakingTestResultsDisplay from "./speaking-test-results-display";

export default async function SpeakingTestResults() {
  const session = await auth();
  const user = session?.user;

  if (!user) {
    redirect("/signin?callbackUrl=/speaking-test-results");
  }

  const credits = await api.payments.getUserCredits();

  return <SpeakingTestResultsDisplay credits={credits} />;
}
