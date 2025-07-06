import { ArrowRight, ExternalLink } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { env } from "@/env";
import { formatDate } from "@/lib/format-date";
import { api } from "@/trpc/server";
import type { Metadata } from "next";

export type TestResultProps = {
  params: Promise<{ username: string; testId: string }>;
};

type FeedbackAreasToImprove = {
  mistake: string;
  correction: string;
};

export async function generateMetadata({ params }: TestResultProps): Promise<Metadata> {
  const { username, testId } = await params;

  try {
    const testData = await api.users.getPublicTestById({ testId });

    const siteUrl = env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
    const user = testData?.user?.displayName ?? username;
    const band = testData?.band;
    const title = `نتيجة اختبار اللغة الإنجليزية | ${user}`;
    const description = testData
      ? `نتائج اختبار المحادثة باللغة الإنجليزية - تم الحصول على درجة ${band}`
      : `نتائج اختبار المحادثة باللغة الإنجليزية | ${env.NEXT_PUBLIC_APP_NAME}`;
    // Build the dynamic OpenGraph image URL
    const ogImage = `${siteUrl}/@${encodeURIComponent(username)}/english-test-results/${testId}/opengraph-image`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: "website",
        url: `${siteUrl}/@${encodeURIComponent(username)}/english-test-results/${testId}`,
        images: [
          {
            url: ogImage,
            width: 1200,
            height: 630,
            alt: "نتيجة اختبار اللغة الإنجليزية",
            type: "image/png",
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [ogImage],
      },
    };
  } catch (error) {
    console.error("Error generating metadata for test result page =>  ", error);
    return {
      title: "نتيجة اختبار اللغة الإنجليزية",
      description: "مشاركة نتائج اختبار اللغة الإنجليزية",
    };
  }
}

export const dynamic = "force-static";
export const revalidate = 86400;

export default async function TestResultPage({ params }: TestResultProps) {
  const { username, testId } = await params;

  const testData = await api.users.getPublicTestById({ testId });

  if (!testData) return notFound();

  const userName = testData.user.displayName ?? `@${username}`;
  const testDate = formatDate(testData.createdAt.toISOString(), true, false);

  return (
    <main className="container mx-auto select-none max-w-4xl py-8 px-2">
      <div className="mb-8">
        <Link
          href="/"
          className="flex items-center justify-start gap-2 text-lg hover:underline underline-offset-6"
        >
          <ArrowRight />
          العودة للرئيسية
        </Link>
      </div>

      <div className="space-y-6">
        <div className="flex flex-col items-center gap-2 md:justify-between">
          <Badge
            className="rounded-full size-22 justify-center"
            variant={testData.band >= 6 ? "success" : "default"}
          >
            <span className="text-4xl font-bold text-white">{testData.band}</span>
          </Badge>
          <h1 className="text-3xl font-bold">نتيجة اختبار المحادثة</h1>
          <p className="text-muted-foreground mt-1">
            تم الاختبار بواسطة
            <strong className="mx-1">{userName}</strong> في {testDate}
          </p>
        </div>

        <Card>
          <CardHeader className="sr-only pt-2">
            <CardTitle>التعليقات والملاحظات</CardTitle>
            <CardDescription className="text-primary">تحليل مفصل لأداء الاختبار</CardDescription>
          </CardHeader>
          <CardContent className="max-sm:p-1.5 pt-4">
            {testData.feedback ? (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">ملخص نقاط القوة</h3>
                  <ul>
                    {testData.feedback.strengths.summary &&
                      testData.feedback.strengths.points.map((line: string, index: number) => (
                        <li key={index}>{line}</li>
                      ))}
                  </ul>
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-semibold mb-4">مجالات التحسين</h3>
                  {testData.feedback.areasToImprove?.errors &&
                  testData.feedback.areasToImprove.errors.length > 0 ? (
                    <div className="space-y-6">
                      {testData.feedback.areasToImprove.errors.map(
                        (error: FeedbackAreasToImprove, index: number) => (
                          <div key={index}>
                            <div className="bg-red-50 dark:bg-red-100 border-r-4 border-red-500 p-4 mb-2">
                              <p className="font-medium dark:text-red-700">{error.mistake}</p>
                            </div>
                            <div className="bg-green-50 dark:bg-green-100 border-r-4 border-green-500 p-4">
                              <p className="font-medium text-green-700">التصحيح:</p>
                              <p className="dark:text-green-700">{error.correction}</p>
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  ) : (
                    <p>لا توجد مجالات محددة للتحسين</p>
                  )}
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-semibold mb-2">نصائح للتحسين</h3>
                  {testData.feedback.improvementTips &&
                  testData.feedback.improvementTips.length > 0 ? (
                    <div className="bg-blue-50 dark:bg-blue-100 dark:text-blue-800 p-4 rounded-md">
                      <ul className="space-y-2 list-disc list-inside">
                        {testData.feedback.improvementTips.map((tip: string, index: number) => (
                          <li key={index}>{tip}</li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <p>لا توجد نصائح محددة للتحسين</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-10">
                <p>لا تتوفر تعليقات أو ملاحظات لهذا الاختبار</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="bg-muted p-6 rounded-lg text-center">
          <h2 className="text-xl font-semibold mb-2">هل تريد تحسين مهاراتك في اللغة الإنجليزية؟</h2>
          <p className="mb-4">سجل الآن واحصل على اختبارات محادثة وتحليل أداء مفصل لتحسين مهاراتك</p>
          <div className="flex justify-center gap-3">
            <Button asChild>
              <Link href="/signin">إنشاء حساب جديد</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/signin">
                <ExternalLink className="size-4" />
                تسجيل الدخول
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
