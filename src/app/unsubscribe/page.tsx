import { redirect } from "next/navigation";
import { Logo } from "@/components/custom/icons";
import { InteractiveGridPattern } from "@/components/magicui/interactive-grid-pattern";
import { env } from "@/env";
import { cn } from "@/lib/utils";
import { UnsubscribeForm } from "./unsubscribe-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: `إلغاء الاشتراك | ${env.NEXT_PUBLIC_APP_NAME}`,
  description: "إلغاء الاشتراك في النشرة البريدية",
};

type UnsubscribePageProps = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default async function UnsubscribePage({ searchParams }: UnsubscribePageProps) {
  const search = await searchParams;
  const token = search.token;

  if (!token) redirect("/");

  return (
    <main className="relative select-none flex h-screen md:-mt-20 flex-col items-center justify-center p-3.5 overflow-hidden">
      <InteractiveGridPattern
        className={cn(
          "[mask-image:radial-gradient(600px_circle_at_center,white,transparent)]",
          "absolute inset-x-0 inset-y-0 h-full w-full z-0 opacity-50",
        )}
        width={70}
        height={70}
        squares={[30, 30]}
        squaresClassName="hover:fill-red-200"
      />

      <div className="z-10 flex flex-col items-center justify-center max-w-5xl w-full mx-auto text-center gap-8">
        <div className="flex flex-col items-center space-y-6 min-w-full">
          <Logo className="animate-in fade-in duration-700 size-16" />
          <div className="flex flex-col items-center space-y-2">
            <h1 className="text-4xl sm:text-5xl md:text-5xl font-bold tracking-tight text-gray-900 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <span className="block">إلغاء الاشتراك</span>
            </h1>

            <p className="text-lg sm:text-xl text-gray-700 max-w-lg mt-2 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
              نأسف لرؤيتك تغادرنا
            </p>
          </div>
        </div>

        <div className="w-full max-w-md bg-white/40 backdrop-blur-md rounded-lg border border-gray-100 shadow-sm p-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
          <UnsubscribeForm token={token} />
        </div>

        <p className="text-sm text-gray-500 animate-in fade-in duration-700 delay-500">
          يمكنك العودة إلينا في أي وقت
        </p>
      </div>
    </main>
  );
}
