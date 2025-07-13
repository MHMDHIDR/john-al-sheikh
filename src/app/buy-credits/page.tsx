import { env } from "@/env";
import { creditPackages } from "@/lib/stripe-client";
import { api } from "@/trpc/server";
import CreditPackages from "./credit-packages";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: `شراء رصيد نقاط  | ${env.NEXT_PUBLIC_APP_NAME}`,
  description: env.NEXT_PUBLIC_APP_DESCRIPTION,
};

export default async function BuyCreditsPage({
  searchParams,
}: {
  searchParams: Promise<{ cancelled?: string }>;
}) {
  const { cancelled } = await searchParams;
  const isCancelled = cancelled === "true";

  const checkoutSessions: Record<string, string> = {};

  for (const packageId of Object.keys(creditPackages)) {
    try {
      const { checkoutUrl } = await api.payments.createCheckoutSession({
        packageId: packageId as keyof typeof creditPackages,
      });

      if (checkoutUrl) {
        checkoutSessions[packageId] = checkoutUrl;
      }
    } catch (error) {
      console.error(`Error creating checkout session for package ${packageId}:`, error);
    }
  }

  return (
    <div className="container max-w-7xl py-10 px-4 mx-auto">
      <div className="mb-8 space-y-6 text-center">
        <h1 className="text-xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
          قوي مستواك في محادثات اللغة الإنجليزية
        </h1>
        <p className="mx-auto max-w-2xl text-gray-500 dark:text-gray-400 md:text-xl text-balance">
          شراء رصيد نقاط للوصول إلى اختبارات المحادثة التدريبية بالتفصيل مع تحديثات وملاحظات عن
          مستواك
        </p>
      </div>

      {isCancelled && (
        <div className="mb-8 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-center text-lg select-none text-yellow-800 dark:border-yellow-900 dark:bg-yellow-950 dark:text-yellow-200">
          لقد تم إلغاء الدفع أو لم يتم الانتهاء منه. يرجى المحاولة مرة أخرى.
        </div>
      )}

      <div className="flex items-center justify-center w-full">
        <CreditPackages checkoutSessions={checkoutSessions} />
      </div>
    </div>
  );
}
