import { redirect } from "next/navigation";
import { auth } from "@/server/auth";

export default async function BuyCreditsLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const user = session?.user;

  if (!user) {
    redirect("/signin?callbackUrl=/buy-minutes");
  }

  return <>{children}</>;
}
