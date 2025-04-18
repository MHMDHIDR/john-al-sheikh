"use client";

import { IconBrandGoogle, IconLoader, IconMail } from "@tabler/icons-react";
import clsx from "clsx";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState } from "react";
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
    <Card className="min-w-96 border-gray-300">
      <CardHeader>
        <CardDescription className="text-center">
          تسجيل الدخول للاستمرار في {env.NEXT_PUBLIC_APP_NAME}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          onClick={handleGoogleSignIn}
          className="w-full text-white cursor-pointer bg-blue-500 hover:bg-blue-600"
        >
          <IconBrandGoogle className="inline-block w-6 h-6 mx-1" />
          المتابعة عن طريق حساب Google
        </Button>

        <Divider className="my-10" />

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
                className={clsx("w-full cursor-pointer bg-gray-200 text-black hover:bg-gray-300", {
                  "pointer-events-none cursor-not-allowed": isPending,
                })}
                disabled={isPending}
              >
                {isPending ? (
                  <IconLoader className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <IconMail className="inline-block w-6 h-6 mx-1" />
                )}
                تسجيل الدخول بالبريد الإلكتروني
              </Button>

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
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
