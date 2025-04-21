import { redirect } from "next/navigation";
import { auth } from "@/server/auth";

export default async function SpeakingTestResults() {
  const session = await auth();

  if (!session) {
    return redirect("/signin?callbackUrl=/speaking-test-results");
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <h1 className="text-3xl font-bold text-gray-900">Speaking Test Results</h1>
    </div>
  );
}
