import clsx from "clsx";
import { HomePageInteractiveGridPattern } from "@/components/custom/quick-speaking-test";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/server/auth";
import { api } from "@/trpc/server";

export default async function HomepagePagesOptions() {
  const session = await auth();

  const credits = await api.payments.getUserCredits();
  const isEnoughCredits = credits > 0;

  return (
    <div
      className={clsx("grid gap-3 place-items-center", {
        "grid-cols-1": !session,
        "grid-cols-1 md:grid-cols-2": session,
      })}
    >
      <HomePageInteractiveGridPattern />
      <Card
        className="z-10 w-full border m-4 md:mt-40 bg-gradient-to-br from-blue-50 to-blue-100 transition-all dark:from-blue-900 dark:to-blue-800 hover:from-blue-100 hover:to-blue-200 hover:dark:from-blue-800 hover:dark:to-blue-700"
        href={isEnoughCredits ? "/mock-test" : "/buy-credits"}
        asLink
      >
        <CardHeader className="relative pb-2">
          <CardTitle className="text-xl font-bold text-center">
            جرِب المحادثة مع مدرب الـ IELTS
          </CardTitle>
          <CardDescription className="text-sm text-blue-700 dark:text-blue-300">
            قم بإختبار نفسك في مهارة المحادثة وتعلم المزيد عن الـ IELTS
          </CardDescription>
        </CardHeader>
        <CardContent className="relative flex h-40 items-center justify-center">
          <Button
            className="pointer-events-none text-center text-xl font-medium text-blue-800 dark:text-blue-200"
            variant={"outline"}
          >
            إختبر نفسك
          </Button>
        </CardContent>
      </Card>

      <Card
        className="z-10 w-full border m-4 md:mt-40 bg-gradient-to-br from-purple-50 to-purple-100 transition-all dark:from-purple-900 dark:to-purple-800 hover:from-purple-100 hover:to-purple-200 hover:dark:from-purple-800 hover:dark:to-purple-700"
        href={isEnoughCredits ? "/general-english" : "/buy-credits"}
        asLink
      >
        <CardHeader className="relative pb-2">
          <CardTitle className="text-xl font-bold text-center">إتحدى نفسك!</CardTitle>
          <CardDescription className="text-sm text-purple-700 dark:text-purple-300">
            قم بتجربة المحادثة العامة باللغة الإنجليزية مع مساعد لتحسين مهاراتك
          </CardDescription>
        </CardHeader>
        <CardContent className="relative flex h-40 items-center justify-center">
          <Button
            className="pointer-events-none text-center text-xl font-medium text-purple-800 dark:text-purple-200"
            variant={"secondary"}
          >
            جرب الآن
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
