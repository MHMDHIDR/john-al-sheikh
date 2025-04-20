import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { SpeechChat } from "./speech-chat";

export default async function MockTestPage() {
  const session = await auth();

  if (!session) {
    return redirect("/signin?callbackUrl=/mock-test");
  }

  return (
    <main className="min-h-screen bg-white">
      <SpeechChat userId={session.user.id} />
    </main>
  );
}
