import dynamic from "next/dynamic";
import { redirect } from "next/navigation";
import LandingPage from "@/components/(landing)/landing";
import { env } from "@/env";
import { auth } from "@/server/auth";

export default async function Home() {
  const session = await auth();
  const hasPhone = session?.user?.phone;
  const hasEmail = session?.user?.email;
  const isProfileCompleted = session?.user?.profileCompleted;

  // For Twitter users, we need both email and phone to be complete
  // For other providers, we only need phone to be complete
  const isTwitterUser = !hasEmail;
  const isComplete = isProfileCompleted && hasPhone && (!isTwitterUser || hasEmail);

  if (session && !isComplete) {
    redirect("/onboarding");
  }

  const HomepagePagesOptions = dynamic(() => import("@/components/custom/homepage-options"));

  return (
    <main className="relative select-none">
      {session && (
        <div className="flex flex-col justify-center items-center my-10">
          <h1 className="text-lg md:text-2xl text-center text-gray-500">
            جرّب واحد من التحديات المصممة خصيصاً لك
          </h1>
          <strong>في {env.NEXT_PUBLIC_APP_NAME}</strong>
        </div>
      )}

      {!session ? <LandingPage /> : <HomepagePagesOptions />}
    </main>
  );
}
