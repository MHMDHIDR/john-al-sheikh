import { AlertCircle } from "lucide-react";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { translateSring } from "@/lib/translate-string";
import { auth } from "@/server/auth";
import SiginForm from "./sigin-form";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await auth();
  if (session) redirect("/");

  const searchParamsProp = await searchParams;
  const callbackUrl = searchParamsProp.callbackUrl;
  const callbackUrlPageName =
    callbackUrl?.split("step=")[1] ?? callbackUrl?.replace("/", "") ?? "هذه الصفحة";

  return (
    <main className="flex flex-col items-center justify-center h-screen -mt-20">
      {callbackUrl && (
        <Card className="mb-4 select-none flex items-center gap-x-3 rounded-lg border-l-4 border-l-red-500 bg-red-50 p-2.5 dark:bg-red-950/50">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <CardHeader className="flex flex-col p-0">
            <CardTitle className="text-sm font-medium text-red-800 dark:text-red-200">
              تنبيه الوصول
            </CardTitle>
            <CardContent className="p-0">
              <p className="text-sm text-red-600 dark:text-red-300">
                يجب عليك تسجيل الدخول للوصول إلى {translateSring(callbackUrlPageName)}
              </p>
            </CardContent>
          </CardHeader>
        </Card>
      )}

      <h1 className="mb-6 text-2xl font-bold text-center">تسجيل الدخول إلى حسابك</h1>
      <SiginForm />
    </main>
  );
}
