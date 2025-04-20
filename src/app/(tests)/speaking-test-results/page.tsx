import { redirect } from "next/navigation";
import { auth } from "@/server/auth";

export default async function SpeakingTestResults() {
  const session = await auth();

  if (!session) {
    return redirect("/signin?callbackUrl=/speaking-test-results");
  }

  return <div>Speaking Test Results</div>;
}
