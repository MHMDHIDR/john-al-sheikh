import { redirect } from "next/navigation";
import { auth } from "@/server/auth";

export default async function MockTestPage() {
  const session = await auth();

  if (!session) {
    return redirect("/signin?callbackUrl=/mock-test");
  }

  return (
    <main className="min-h-screen bg-white">
      <h1 className="text-3xl font-bold text-gray-900">Mock Test</h1>
    </main>
  );
}
