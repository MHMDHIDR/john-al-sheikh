import { redirect } from "next/navigation";
import { auth } from "@/server/auth";

export default async function TestsLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session) {
    redirect("/signin");
  }

  return <>{children}</>;
}
