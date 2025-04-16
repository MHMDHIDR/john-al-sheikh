import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import SiginForm from "./sigin-form";

export default async function SignInPage() {
  const session = await auth();
  if (session) redirect("/");

  return (
    <main className="flex flex-col items-center justify-center h-screen -mt-20">
      <h1 className="mb-6 text-2xl font-bold text-center">تسجيل الدخول إلى حسابك</h1>
      <SiginForm />
    </main>
  );
}
