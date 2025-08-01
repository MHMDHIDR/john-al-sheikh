import clsx from "clsx";
import Image from "next/image";
import TestActionWrapper from "@/components/custom/test-action-wrapper";
import { InteractiveGridPattern } from "@/components/magicui/interactive-grid-pattern";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { auth } from "@/server/auth";

export default async function HomepagePagesOptions() {
  const session = await auth();

  return (
    <div
      className={clsx("grid gap-3 md:mx-14 mx-3 place-items-center", {
        "grid-cols-1": !session,
        "grid-cols-1 md:grid-cols-2": session,
      })}
    >
      <InteractiveGridPattern
        className={cn(
          "[mask-image:radial-gradient(600px_circle_at_center,white,transparent)]",
          "absolute inset-x-0 inset-y-0 h-full w-full z-0 opacity-30",
        )}
        width={40}
        height={40}
        squares={[30, 30]}
        squaresClassName="hover:fill-blue-200"
      />

      <TestActionWrapper testType="general-english">
        <Card className="z-10 w-full border min-h-56 md:min-h-68 md:mt-40 bg-gradient-to-br from-purple-50 to-purple-100 transition-all dark:from-purple-900 dark:to-purple-800 hover:from-purple-100 hover:to-purple-200 hover:dark:from-purple-800 hover:dark:to-purple-700">
          <CardHeader className="relative pb-2">
            <Image
              src="/john-al-shiekh-character.png"
              alt="English Speaking"
              width={48}
              height={48}
              className="size-12 mx-auto"
              loading="lazy"
            />
            <CardTitle className="text-xl font-bold text-center">إتحدى نفسك!</CardTitle>
            <CardDescription className="text-sm text-purple-700 dark:text-purple-300 text-center">
              قم بتجربة المحادثة العامة باللغة الإنجليزية مع مساعد لتحسين مهاراتك
            </CardDescription>
          </CardHeader>
          <CardContent className="relative flex h-14 md:min-h-32 items-center justify-center">
            <Button
              className="pointer-events-none text-center text-xl font-medium text-purple-800 dark:text-purple-200"
              variant={"secondary"}
            >
              جرب الآن
            </Button>
          </CardContent>
        </Card>
      </TestActionWrapper>
      <TestActionWrapper testType="mock-test">
        <Card className="z-10 w-full border min-h-56 md:min-h-68 md:mt-40 bg-gradient-to-br from-blue-50 to-blue-100 transition-all dark:from-blue-900 dark:to-blue-800 hover:from-blue-100 hover:to-blue-200 hover:dark:from-blue-800 hover:dark:to-blue-700">
          <CardHeader className="relative pb-2">
            <CardTitle className="text-xl font-bold text-center">
              <Image
                src="/ielts-logo.png"
                alt="IELTS Speaking"
                width={60}
                height={48}
                className="w-fit mx-auto"
                loading="lazy"
              />
              جرِب المحادثة مع مدرب الـ IELTS
            </CardTitle>
            <CardDescription className="text-sm text-blue-700 dark:text-blue-300 text-center">
              قم بإختبار نفسك في مهارة المحادثة وتعلم المزيد عن الـ IELTS
            </CardDescription>
          </CardHeader>
          <CardContent className="relative flex h-14 md:min-h-32 items-center justify-center">
            <Button
              className="pointer-events-none text-center text-xl font-medium text-blue-800 dark:text-blue-200"
              variant={"outline"}
            >
              إختبر نفسك
            </Button>
          </CardContent>
        </Card>
      </TestActionWrapper>
    </div>
  );
}
