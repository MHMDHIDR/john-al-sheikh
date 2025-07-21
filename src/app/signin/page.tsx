import { AlertCircle } from "lucide-react";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { env } from "@/env";
import { translateSring } from "@/lib/translate-string";
import { auth } from "@/server/auth";
import SiginForm from "./sigin-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: `تسجيل الدخول | ${env.NEXT_PUBLIC_APP_NAME}`,
  description: env.NEXT_PUBLIC_APP_DESCRIPTION,
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const session = await auth();
  if (session) redirect("/");

  const searchParamsProp = await searchParams;
  const callbackUrl = searchParamsProp.callbackUrl;
  const callbackUrlPageName =
    callbackUrl?.split("step=")[1] ?? callbackUrl?.replace("/", "") ?? "هذه الصفحة";

  const error = searchParamsProp.error;

  return (
    <main className="flex flex-col items-center justify-center h-screen md:-mt-20">
      {callbackUrl && (
        <Card className="mb-4 mx-2 select-none flex items-center gap-x-3 rounded-lg border-l-4 border-l-red-500 bg-red-50 p-2.5 dark:bg-red-950/50">
          <AlertCircle className="size-5 text-red-500" />
          <CardHeader className="flex flex-col p-0">
            <CardTitle className="text-sm font-medium text-red-800 dark:text-red-200">
              تنبيه الوصول
            </CardTitle>
            <CardContent className="p-0">
              <p className="text-sm text-red-600 dark:text-red-300">
                الرجاء تسجيل الدخول للوصول إلى{" "}
                <strong>{translateSring(callbackUrlPageName)}</strong>
              </p>
            </CardContent>
          </CardHeader>
        </Card>
      )}

      {error && (
        <Card className="mb-4 mx-2 select-none flex items-center gap-x-3 rounded-lg border-l-4 border-l-red-500 bg-red-50 p-2.5 dark:bg-red-950/50">
          <AlertCircle className="size-5 text-red-500" />
          <CardHeader className="flex flex-col p-0">
            <CardTitle className="text-sm font-medium text-red-800 dark:text-red-200">
              خطأ في تسجيل الدخول
            </CardTitle>
            <CardContent className="p-0">
              <p className="text-sm text-red-600 dark:text-red-300">
                حدث خطأ عند التسجيل الدخول بهذا البريد الإلكتروني الرجاء المحاولة مرة أخرى
              </p>
            </CardContent>
          </CardHeader>
        </Card>
      )}

      <SiginForm />
    </main>
  );
}
