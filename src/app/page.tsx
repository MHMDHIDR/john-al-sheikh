import dynamic from "next/dynamic";
import { redirect } from "next/navigation";
import { QuickSpeakingTest } from "@/components/custom/quick-speaking-test";
import { env } from "@/env";
import { auth } from "@/server/auth";

export default async function Home() {
  const session = await auth();
  const isProfileCompleted = session?.user?.profileCompleted;

  if (session && !isProfileCompleted) {
    redirect("/onboarding");
  }

  const HomepagePagesOptions = dynamic(() => import("@/components/custom/homepage-options"));

  return (
    <main className="relative select-none max-xs:-my-10 -my-20 flex h-screen px-3 flex-col items-center justify-center overflow-hidden">
      {session && (
        <div className="flex flex-col justify-center items-center mt-10">
          <h1 className="text-lg md:text-2xl text-center text-gray-500">
            جرّب واحد من التحديات المصممة خصيصاً لك
          </h1>
          <strong>في {env.NEXT_PUBLIC_APP_NAME}</strong>
        </div>
      )}

      {!session ? <QuickSpeakingTest /> : <HomepagePagesOptions />}
    </main>
  );
}
