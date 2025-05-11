"use client";

import { IconLoader, IconMail } from "@tabler/icons-react";
import clsx from "clsx";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState } from "react";
import { GoogleIcon } from "@/components/custom/icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import Divider from "@/components/ui/divider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { env } from "@/env";
import { handleSignin } from "./actions/handle-signin";
import type { SignInType } from "./actions/handle-signin";

export default function SiginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";

  const [state, handleSigninAction, isPending] = useActionState(
    async (prevState: SignInType, formData: FormData) => {
      return handleSignin({ ...prevState, callbackUrl }, formData);
    },
    {
      message: undefined,
      success: true,
      callbackUrl,
    },
  );

  const handleGoogleSignIn = async () => {
    await signIn("google", { callbackUrl });
  };

  return (
    <div className="flex flex-col items-center gap-y-2">
      <Card className="w-96 md:min-w-110 border-gray-300 select-none">
        <CardHeader className="md:px-10">
          <h1 className="mb-6 text-2xl font-bold text-center">تسجيل الدخول إلى حسابك</h1>
          <CardDescription className="text-center">
            تسجيل الدخول للاستمرار في {env.NEXT_PUBLIC_APP_NAME}
          </CardDescription>
        </CardHeader>
        <CardContent className="md:px-10">
          <Button
            onClick={handleGoogleSignIn}
            variant={"outline"}
            className="w-full cursor-pointer h-10"
          >
            <GoogleIcon className="inline-block mx-1" />
            المتابعة عن طريق حساب Google
          </Button>

          <Divider className="my-5" textClassName="bg-card!">
            أو
          </Divider>

          <form action={handleSigninAction} className="space-y-3">
            <div className="items-center w-full grid gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="email">
                  <strong>البريد الإلكتروني</strong>
                </Label>
                {!state.success && <span className="text-red-700">{state.message}</span>}
                {state.success && <span className="text-green-700">{state.message}</span>}
                <Input type="email" name="email" id="email" placeholder="البريد الإلكتروني" />
                <Button
                  className={clsx(
                    "w-full h-10 cursor-pointer bg-gray-200 dark:bg-gray-800 text-black dark:text-white hover:bg-gray-300 dark:hover:bg-gray-700",
                    {
                      "pointer-events-none cursor-not-allowed": isPending,
                    },
                  )}
                  disabled={isPending}
                >
                  {isPending ? (
                    <IconLoader className="size-6 mr-2 animate-spin" />
                  ) : (
                    <IconMail className="inline-block size-6 mx-1" />
                  )}
                  تسجيل الدخول بالبريد الإلكتروني
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
      <p className="text-sm text-gray-500">
        بالمتابعة، أنت توافق على
        <Link href="/terms" className="text-blue-500 inline-flex px-1 hover:underline">
          شروط الخدمة
        </Link>
        و
        <Link href="/privacy" className="text-blue-500 inline-flex px-1 hover:underline">
          سياسة الخصوصية
        </Link>
      </p>
    </div>
  );
}
