"use client";

import { Calendar, Clock, ExternalLink, Medal } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect } from "react";
import { AuroraText } from "@/components/magicui/aurora-text";
import { InteractiveGridPattern } from "@/components/magicui/interactive-grid-pattern";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate } from "@/lib/format-date";
import { formatTestType } from "@/lib/format-test-type";
import { cn } from "@/lib/utils";
import type { AppRouter } from "@/server/api/root";
import type { inferRouterOutputs } from "@trpc/server";

type GetTestByIdOutput = inferRouterOutputs<AppRouter>["users"]["getTestById"];

export default function TestDetails({ details }: { details: GetTestByIdOutput }) {
  const searchParams = useSearchParams();

  // Get the active tab from the URL or default to "results"
  const activeTab = searchParams.get("view") ?? "results";

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
          <Link href="/dashboard">
            <Button className="w-full mb-4 dark:bg-slate-600 dark:text-accent-foreground dark:hover:bg-slate-700">
              <ExternalLink className="size-4 mr-2" />
              العودة إلى لوحة المعلومات
            </Button>
          </Link>

          <div className="flex flex-col justify-between items-start flex-wrap">
            <AuroraText className="text-xl md:text-2xl font-bold">{details.topic}</AuroraText>
            <div className="flex items-center text-gray-500 mt-2 flex-wrap gap-x-2">
              <div className="flex items-center">
                <Calendar className="ml-1 h-4 w-4" />
                <span>{formatDate(details.createdAt.toISOString(), true, false)}</span>
              </div>
              <Separator orientation="vertical" className="h-4 bg-blue-400" />
              <div className="flex items-center">
                <Clock className="ml-1 h-4 w-4" />
                <span>{formatDate(details.createdAt.toISOString(), false, true)}</span>
              </div>
              <Separator orientation="vertical" className="h-4 bg-blue-400" />
              <div>
                <span>{formatTestType(details.type)}</span>
              </div>

              <Medal className="ml-2 h-6 w-6 text-yellow-500" />
              <div className="text-lg md:text-3xl font-bold text-blue-600">
                {details.band?.toString() ?? "0.0"}
              </div>
            </div>
          </div>
        </div>

        <Tabs
          defaultValue={activeTab}
          value={activeTab}
          onValueChange={handleTabChange}
          className="mt-8"
        >
          <TabsList className="grid w-full md:w-auto grid-cols-2 md:grid-cols-3 gap-2.5">
            <TabsTrigger value="results">النتائج التفصيلية</TabsTrigger>
            <TabsTrigger value="feedback">التعليقات والملاحظات</TabsTrigger>
            <TabsTrigger value="transcript">نص المحادثة</TabsTrigger>
          </TabsList>

          <TabsContent value="results" className="mt-10 rtl">
            <Card>
              <CardHeader>
                <CardTitle>النتائج التفصيلية</CardTitle>
                <CardDescription>تفاصيل الدرجات حسب معايير IELTS</CardDescription>
              </CardHeader>
              <CardContent>
                {details.feedback ? (
                  <>
                    <div className="flex justify-center mb-8 select-none">
                      <div className="inline-flex items-center justify-center h-32 w-32 rounded-full bg-blue-50 border-4 border-blue-500">
                        <span className="text-4xl font-bold text-blue-600">
                          {details.band?.toString() ?? "0.0"}
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

          <TabsContent value="feedback" className="mt-6 rtl">
            <Card>
              <CardHeader>
                <CardTitle>التعليقات والملاحظات</CardTitle>
                <CardDescription className="text-primary">
                  تحليل مفصل لأدائك في الاختبار
                </CardDescription>
              </CardHeader>
              <CardContent>
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

          <TabsContent value="transcript" className="mt-6 rtl">
            <Card>
              <CardHeader>
                <CardTitle>نص المحادثة</CardTitle>
                <CardDescription>نص كامل للمحادثة خلال الاختبار</CardDescription>
              </CardHeader>
              <CardContent>
                {details.transcription?.messages && details.transcription.messages.length > 0 ? (
                  <div className="space-y-4">
                    {details.transcription.messages.map((message, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-lg ${
                          message.role === "examiner"
                            ? "bg-blue-100 text-blue-900"
                            : "bg-green-100 text-green-900"
                        }`}
                      >
                        <div className="font-semibold mb-1">
                          {message.role === "examiner" ? "الممتحن" : "أنت"}
                        </div>
                        <div className="whitespace-pre-wrap ltr">{message.content}</div>
                        <div className="text-xs mt-2 opacity-70">{message.timestamp}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <p className="text-gray-500">لا يتوفر نص المحادثة لهذا الاختبار</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-8 text-center">
          <Link href="/mock-test">
            <Button variant="outline" className="w-full max-w-xs">
              ابدأ اختبار محادثة جديد
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
