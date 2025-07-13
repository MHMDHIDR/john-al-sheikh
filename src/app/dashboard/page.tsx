import { clsx } from "clsx";
import { CalendarClock, LineChart, ListChecks, Trophy } from "lucide-react";
import Link from "next/link";
import { ShareTestDialog } from "@/components/dialog-share-test";
import { AuroraText } from "@/components/magicui/aurora-text";
import { InteractiveGridPattern } from "@/components/magicui/interactive-grid-pattern";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Divider from "@/components/ui/divider";
import { env } from "@/env";
import { creditsLabel } from "@/lib/credits-label";
import { formatDate } from "@/lib/format-date";
import { formatTestType } from "@/lib/format-test-type";
import { cn } from "@/lib/utils";
import { auth } from "@/server/auth";
import { api } from "@/trpc/server";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ payment_success?: string; session_id?: string }>;
}) {
  const session = await auth();
  const username = session?.user?.username ?? session?.user.name ?? env.NEXT_PUBLIC_APP_NAME;

  const { payment_success, session_id } = await searchParams;

  // If returning from successful payment, verify the session
  if (payment_success === "true" && session_id) {
    try {
      await api.payments.verifySession({ sessionId: session_id });
    } catch (error) {
      console.error("Failed to verify payment session on dashboard:", error);
    }
  }

  const stats = await api.users.getUserTestStats();
  const testHistory = await api.users.getUserTestHistory();
  const credits = await api.payments.getUserCredits();
  const isEnoughCredits = credits > 0;

  // Get trend indicator (up, down, or neutral)
  const getTrendIndicator = () => {
    if (!stats) return null;

    if (stats.trend > 0) {
      return <span className="text-green-500 mr-1">↑</span>;
    } else if (stats.trend < 0) {
      return <span className="text-red-500 mr-1">↓</span>;
    }
    return <span className="text-gray-500 mr-1">−</span>;
  };

  return (
    <main className="min-h-screen px-2 py-4 md:p-8" dir="rtl">
      <InteractiveGridPattern
        className={cn(
          "[mask-image:radial-gradient(600px_circle_at_center,white,transparent)]",
          "absolute inset-x-0 inset-y-0 h-full w-full z-0 opacity-50",
        )}
        width={70}
        height={70}
        squares={[30, 30]}
        squaresClassName="hover:fill-blue-200"
      />

      <div className="mx-auto max-w-6xl relative z-10">
        <div className="mb-8 text-center select-none">
          <AuroraText className="text-3xl font-bold mb-2">لوحة المعلومات</AuroraText>
          <p className="text-gray-600">تابع تقدمك في اختبارات المحادثة IELTS</p>
        </div>

        {payment_success === "true" && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 text-center text-green-800">
            تم إضافة الرصيد بنجاح إلى حسابك
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-0 select-none">
              <CardTitle className="max-sm:text-center">إبدا المحادثة</CardTitle>
            </CardHeader>
            <CardContent />
            <CardFooter className="flex gap-2 flex-col">
              <Link href={isEnoughCredits ? "/mock-test" : "/buy-credits"} className="w-full">
                <Button variant="outline" className="w-full">
                  ابدأ اختبار محادثة جديد
                </Button>
              </Link>
              <Divider className="my-1" textClassName="bg-card!">
                أو
              </Divider>
              <Link href={isEnoughCredits ? "/general-english" : "/buy-credits"} className="w-full">
                <Button variant="outline" className="w-full">
                  محادثة عامة بالإنجليزي
                </Button>
              </Link>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader className="pb-1.5 select-none">
              <CardTitle>رصيدك</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {credits} <strong>{creditsLabel({ credits })}</strong>
              </div>
            </CardContent>
            <CardFooter>
              <Link href="/buy-credits" className="w-full">
                <Button variant={"pressable"} className="w-full font-black text-lg">
                  شراء رصيد
                </Button>
              </Link>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader className="pb-2 select-none">
              <CardTitle className="text-lg flex items-center">
                <ListChecks className="ml-2 size-5 text-blue-500" />
                إجمالي الاختبارات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalCount || 0}</div>
              <p className="text-sm text-gray-500 dark:text-gray-300 mt-3">اختبار محادثة مكتمل</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 select-none">
              <CardTitle className="text-lg flex items-center">
                <Trophy className="ml-2 size-5 text-yellow-500" />
                أعلى درجة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.highestScore.toString()}</div>
              <p className="text-sm text-gray-500 dark:text-gray-300 mt-1">من أصل 9.0</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 select-none">
              <CardTitle className="text-lg flex items-center">
                <LineChart className="ml-2 size-5 text-green-500" />
                معدل التحسن
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold flex items-center">
                {getTrendIndicator()}
                {Math.abs(stats.trend || 0).toFixed(1)}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-300 mt-1">في آخر 5 اختبارات</p>
            </CardContent>
          </Card>
        </div>

        {stats.averageScores && stats.averageScores.length > 0 && (
          <Card className="mb-8">
            <CardHeader className="select-none">
              <CardTitle>متوسط الدرجات حسب نوع الاختبار</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {stats.averageScores.map((score, index) => (
                  <div key={index} className="flex flex-col">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{formatTestType(score.type)}</span>
                      <span className="text-blue-600 font-bold">
                        {Number(score.average).toFixed(1)}
                      </span>
                    </div>
                    <div className="mt-2 h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${(Number(score.average) / 9) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="mb-12">
          <CardHeader className="select-none">
            <CardTitle>سجل المحادثات</CardTitle>
            <CardDescription>قائمة بجميع المحادثات والإختبارات التي أكملتها</CardDescription>
          </CardHeader>
          <CardContent className="max-sm:px-2">
            {testHistory && testHistory.length > 0 ? (
              <div className="space-y-4">
                {testHistory.map(test => (
                  <div
                    key={test.id}
                    className="flex select-none flex-col md:flex-row border justify-between items-end md:items-center bg-gray-50 hover:bg-gray-100 dark:bg-gray-950 dark:hover:bg-gray-800 rounded py-1 px-1.5"
                  >
                    <Link href={`/dashboard/${test.id}`} className="w-full">
                      <section className="max-sm:self-start max-sm:w-full">
                        <h3 className="sm:font-medium max-sm:text-sm ltr max-sm:text-left text-right">
                          {test.topic || "اختبار محادثة"}
                        </h3>
                        <div className="hidden md:flex items-center max-sm:text-xs text-sm text-gray-500">
                          <CalendarClock className="ml-1 size-4" />
                          {formatDate(test.createdAt.toISOString(), true, true)}
                          <span className="mx-2 inline-flex">•</span>
                          <span
                            className={clsx("inline-flex", {
                              "text-green-600 dark:text-green-400": test.type === "MOCK",
                              "text-yellow-600 dark:text-yellow-400": test.type === "PRACTICE",
                              "text-blue-600 dark:text-blue-400": test.type === "OFFICIAL",
                            })}
                          >
                            {formatTestType(test.type)}
                          </span>
                        </div>
                      </section>
                    </Link>
                    <section className="flex items-center max-md:justify-between max-md:min-w-full gap-x-2">
                      <div className="flex md:hidden items-center max-sm:text-xs text-sm text-gray-500">
                        <CalendarClock className="ml-1 size-4" />
                        {formatDate(test.createdAt.toISOString(), true, true)}
                        <span className="mx-2 inline-flex">•</span>
                        <span
                          className={clsx("inline-flex", {
                            "text-green-600 dark:text-green-400": test.type === "MOCK",
                            "text-yellow-600 dark:text-yellow-400": test.type === "PRACTICE",
                            "text-blue-600 dark:text-blue-400": test.type === "OFFICIAL",
                          })}
                        >
                          {formatTestType(test.type)}
                        </span>
                      </div>

                      <div className="flex items-center">
                        <span className="text-base sm:text-2xl font-bold text-blue-600">
                          {Number(test.band)}
                        </span>
                        <ShareTestDialog
                          testId={test.id}
                          username={username}
                          band={test.band ?? 0}
                          size="icon"
                          type={test.type}
                        />
                      </div>
                    </section>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-gray-500 mb-4">لم تقم بإجراء أي اختبارات محادثة بعد</p>
                <Link href={isEnoughCredits ? "/mock-test" : "/buy-credits"} className="w-full">
                  <Button variant="outline" className="w-full">
                    ابدأ اختبار محادثة جديد
                  </Button>
                </Link>
                <Divider className="my-5" textClassName="bg-card!">
                  أو
                </Divider>
                <Link
                  href={isEnoughCredits ? "/general-english" : "/buy-credits"}
                  className="w-full"
                >
                  <Button variant="outline" className="w-full">
                    محادثة عامة بالإنجليزي
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
          {testHistory && testHistory.length > 0 && (
            <CardFooter className="flex max-sm:px-2 gap-2 flex-col md:flex-row">
              <Link href={isEnoughCredits ? "/mock-test" : "/buy-credits"} className="w-full">
                <Button variant="outline" className="w-full">
                  ابدأ اختبار محادثة جديد
                </Button>
              </Link>
              <Divider className="my-5" textClassName="bg-card!">
                أو
              </Divider>
              <Link href={isEnoughCredits ? "/general-english" : "/buy-credits"} className="w-full">
                <Button variant="outline" className="w-full">
                  محادثة عامة بالإنجليزي
                </Button>
              </Link>
            </CardFooter>
          )}
        </Card>
      </div>
    </main>
  );
}
