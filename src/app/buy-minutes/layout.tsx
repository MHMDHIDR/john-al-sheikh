import { redirect } from "next/navigation";
import Footer from "@/components/custom/footer";
import { auth } from "@/server/auth";

export default async function BuyMinutesLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const user = session?.user;

  if (!user) {
    redirect("/signin?callbackUrl=/buy-minutes");
  }

  return (
    <div className="h-screen flex flex-col items-center justify-between md:mt-20 min-w-full">
      {children}
      <Footer />
    </div>
  );
}
