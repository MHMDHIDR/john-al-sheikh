"use client";

import { Calendar, ExternalLink, Medal } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect } from "react";
import AudioPlayer from "@/components/custom/audio-player";
import EmptyState from "@/components/custom/empty-state";
import { ShareTestDialog } from "@/components/dialog-share-test";
import { AuroraText } from "@/components/magicui/aurora-text";
import { InteractiveGridPattern } from "@/components/magicui/interactive-grid-pattern";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Divider from "@/components/ui/divider";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { env } from "@/env";
import { useIsMobile } from "@/hooks/use-mobile";
import { formatDate } from "@/lib/format-date";
import { formatTestType } from "@/lib/format-test-type";
import { cn } from "@/lib/utils";
import type { AppRouter } from "@/server/api/root";
import type { inferRouterOutputs } from "@trpc/server";

type TestDetailsProps = {
  details: inferRouterOutputs<AppRouter>["users"]["getTestById"];
  credits: inferRouterOutputs<AppRouter>["payments"]["getUserCredits"];
  recordingUrl?: string | null;
};

export default function TestDetails({ details, credits, recordingUrl }: TestDetailsProps) {
  const searchParams = useSearchParams();
  const isMobile = useIsMobile();

  // Get the active tab from the URL or default to "results"
  const activeTab = searchParams.get("view") ?? "results";

  const isEnoughCredits = credits > 0;

  // Handle tab change by updating URL without navigation
  const handleTabChange = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("view", value);
      window.history.pushState(null, "", `?${params.toString()}`);
    },
    [searchParams],
  );

  // Sync URL with tab view
  useEffect(() => {
    if (searchParams.get("view") !== activeTab) {
      handleTabChange(activeTab);
    }
  }, [activeTab, searchParams, handleTabChange]);

  return (
    <main className="min-h-screen p-4 md:p-8" dir="rtl">
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

      <div className="mx-auto max-w-4xl relative z-10">
        <div className="mb-4">
          <div className="flex mb-4 md:mb-8 flex-col md:flex-row gap-2.5 md:justify-between justify-center">
            <Link href="/dashboard">
              <Button className="w-full" variant={"default"}>
                <ExternalLink className="size-4" />
                العودة إلى لوحة المعلومات
              </Button>
            </Link>
            <ShareTestDialog
              testId={details.id}
              username={details.user.username ?? env.NEXT_PUBLIC_APP_NAME}
              band={details.band ?? 0}
              size="default"
              type={details.type}
            />
          </div>

          <div className="flex flex-col justify-between items-start flex-wrap">
            <AuroraText className="text-xl md:text-2xl font-bold text-center ltr w-full">
              {details.topic}
            </AuroraText>
            <div className="flex items-center text-gray-500 mt-2 flex-wrap gap-x-2 text-xs sm:text-base">
              <div
                className="flex items-center"
                title={formatDate(details.createdAt.toISOString(), true, false)}
                aria-label={formatDate(details.createdAt.toISOString(), true, false)}
              >
                <Calendar className="ml-1 size-4" />
                <span>{formatDate(details.createdAt.toISOString(), true, false)}</span>
              </div>
              <Separator orientation="vertical" className="h-4 bg-blue-400" />
              <div>
                <span>{formatTestType(details.type)}</span>
              </div>

              <Badge variant={"outline"} className="flex items-center gap-2">
                <Medal className="size-4 text-yellow-500" />
                <span className="text-blue-500">{details.band?.toString() ?? "0.0"}</span>
              </Badge>
            </div>
          </div>
        </div>

        <Tabs
          defaultValue={activeTab}
          value={activeTab}
          onValueChange={handleTabChange}
          className="mt-8"
        >
          <TabsList className="grid w-full md:w-auto rtl grid-cols-3 md:grid-cols-3 gap-0 md:gap-2.5">
            <TabsTrigger value="results">
              {isMobile ? "ملخص النتيجة" : "ملخص عام للنتيجة"}
            </TabsTrigger>
            <TabsTrigger value="feedback">{isMobile ? "نصائح" : "التعليقات والنصائح"}</TabsTrigger>
            <TabsTrigger value="transcript">المحادثـــة</TabsTrigger>
          </TabsList>

          <TabsContent value="results" className="rtl">
            <Card>
              <CardHeader>
                <CardTitle>المستوى (Band)</CardTitle>
                <CardDescription className="sr-only">
                  تفاصيل الدرجات حسب معايير IELTS
                </CardDescription>
              </CardHeader>
              <CardContent className="max-sm:p-2">
                {details.feedback ? (
                  <>
                    <div className="flex justify-center mb-8 select-none">
                      <div className="inline-flex items-center justify-center h-32 w-32 rounded-full bg-blue-50 border-4 border-blue-500">
                        <span className="text-4xl md:text-5xl font-bold text-blue-600">
                          {Number(details.band)}
                          <sub className="text-xs text-blue-600">
                            {details.type === "MOCK" ? "/9" : "/10"}
                          </sub>
                        </span>
                      </div>
                    </div>

                    <div className="space-y-6">
                      {details.feedback.strengths.points &&
                        details.feedback.strengths.points.length > 0 && (
                          <div>
                            <h3 className="text-lg font-semibold mb-2">التقييم العام</h3>
                            <div className="space-y-2">
                              {details.feedback.strengths.points.map((point, index) => (
                                <div key={index} className="flex items-start">
                                  <div className="ml-2 mt-1 text-green-500 shrink-0">✓</div>
                                  <p>{point}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                      {details.feedback.areasToImprove?.errors &&
                        details.feedback.areasToImprove.errors.length > 0 && (
                          <div>
                            <h3 className="text-lg font-semibold mb-2">مجالات التحسين</h3>
                            <div className="space-y-4">
                              {details.feedback.areasToImprove.errors.map((error, index) => (
                                <div key={index} className="border-r-4 border-yellow-500 pr-4">
                                  <p className="font-medium text-red-600 mb-1">{error.mistake}</p>
                                  <p className="text-green-600">{error.correction}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                      {details.feedback.improvementTips &&
                        details.feedback.improvementTips.length > 0 && (
                          <div>
                            <h3 className="text-lg font-semibold mb-2">نصائح للتحسين</h3>
                            <div className="space-y-2">
                              {details.feedback.improvementTips.map((tip, index) => (
                                <div key={index} className="flex items-center">
                                  <div className="ml-2 mt-1 text-blue-500 shrink-0">●</div>
                                  <p>{tip}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-10">
                    <p>لا تتوفر نتائج تفصيلية لهذا الاختبار</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="feedback" className="rtl">
            <Card>
              <CardHeader>
                <CardTitle>التعليقات والملاحظات</CardTitle>
                <CardDescription className="text-primary">
                  تحليل مفصل لأدائك في الاختبار
                </CardDescription>
              </CardHeader>
              <CardContent className="max-sm:p-2">
                {details.feedback ? (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">ملخص نقاط القوة</h3>
                      <ul>
                        {details.feedback.strengths.summary &&
                          details.feedback.strengths.points.map((line, index) => (
                            <li key={index}>{line}</li>
                          ))}
                      </ul>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="text-lg font-semibold mb-4">مجالات التحسين</h3>
                      {details.feedback.areasToImprove?.errors &&
                      details.feedback.areasToImprove.errors.length > 0 ? (
                        <div className="space-y-6">
                          {details.feedback.areasToImprove.errors.map((error, index) => (
                            <div key={index}>
                              <div className="bg-red-50 dark:bg-red-100 border-r-4 border-red-500 p-4 mb-2">
                                <p className="font-medium dark:text-red-700">{error.mistake}</p>
                              </div>
                              <div className="bg-green-50 dark:bg-green-100 border-r-4 border-green-500 p-4">
                                <p className="font-medium text-green-700">التصحيح:</p>
                                <p className="dark:text-green-700">{error.correction}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p>لا توجد مجالات محددة للتحسين</p>
                      )}
                    </div>

                    <Separator />

                    <div>
                      <h3 className="text-lg font-semibold mb-2">نصائح للتحسين</h3>
                      {details.feedback.improvementTips &&
                      details.feedback.improvementTips.length > 0 ? (
                        <div className="bg-blue-50 dark:bg-blue-100 dark:text-blue-800 p-4 rounded-md">
                          <ul className="space-y-2 list-disc list-inside">
                            {details.feedback.improvementTips.map((tip, index) => (
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
          </TabsContent>

          <TabsContent value="transcript" className="rtl">
            <Card>
              <CardHeader>
                <CardTitle className="sr-only">المحادثة</CardTitle>
                <CardDescription className="sr-only">
                  نص كامل للمحادثة خلال الاختبار
                </CardDescription>
              </CardHeader>
              <CardContent className="max-sm:p-2">
                {recordingUrl ? (
                  <AudioPlayer audioUrl={recordingUrl} title="تسجيل المحادثة" />
                ) : (
                  <EmptyState>
                    <p className="mt-4 text-lg text-gray-500 select-none dark:text-gray-400">
                      لا يوجد تسجيل صوتي لهذه المحادثة
                    </p>
                  </EmptyState>
                )}

                {details.transcription?.messages && details.transcription.messages.length > 0 ? (
                  <div className="space-y-2 mt-6">
                    {details.transcription.messages.map((message, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-lg flex gap-1.5 ${
                          message.role === "examiner"
                            ? "bg-blue-100 text-blue-900"
                            : "bg-green-100 text-green-900"
                        }`}
                      >
                        <div className="flex-shrink-0">
                          <Badge
                            variant={message.role === "user" ? "default" : "secondary"}
                            className="flex-col "
                          >
                            {message.role === "user" ? "المستخدم" : "الممتحن"}
                            <span className="text-xs text-muted-foreground mt-1">
                              {message.timestamp}
                            </span>
                          </Badge>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm ltr">{message.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState>
                    <p className="mt-4 text-lg text-gray-500 select-none dark:text-gray-400">
                      لا يوجد تسجيل نصي لهذه المحادثة
                    </p>
                  </EmptyState>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-8 text-center">
          <Link href={isEnoughCredits ? "/mock-test" : "/buy-credits"}>
            <Button variant="outline" className="w-full max-w-xs">
              ابدأ اختبار محادثة جديد
            </Button>
          </Link>
          <Divider className="my-5">أو</Divider>
          <Link href={isEnoughCredits ? "/general-english" : "/buy-credits"}>
            <Button variant="outline" className="w-full max-w-xs">
              محادثة عامة بالإنجليزي
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
