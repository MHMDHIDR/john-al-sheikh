"use client";

import clsx from "clsx";
import { Calendar, ExternalLink, GitCommitHorizontal, Medal, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect } from "react";
import AudioPlayer from "@/components/custom/audio-player";
import {
  GrammarImprovementChart,
  InteractiveTranscript,
  InteractiveTranscriptView,
  VocabularyProgressChart,
  WordCloud,
} from "@/components/custom/feedback";
import TestActionWrapper from "@/components/custom/test-action-wrapper";
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
import type {
  EnhancedFeedback,
  FeedbackType,
  LegacyFeedback,
  LegacyFeedbackWithProgress,
} from "@/server/db/schema";
import type { inferRouterOutputs } from "@trpc/server";

type TestDetailsProps = {
  details: inferRouterOutputs<AppRouter>["users"]["getTestById"];
  recordingUrl?: string | null;
};

const FeedbackSection: React.FC<{
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, icon, children }) => (
  <div>
    <h3 className="text-lg font-semibold mb-2 flex items-center">
      {icon}
      <span className="ml-2">{title}</span>
    </h3>
    <div className="space-y-4">{children}</div>
  </div>
);

function isEnhancedFeedback(feedback: FeedbackType): feedback is EnhancedFeedback {
  return (
    "grammarAnalysis" in feedback &&
    "vocabularyAnalysis" in feedback &&
    "nativenessAnalysis" in feedback &&
    "progressionMetrics" in feedback &&
    "overallFeedback" in feedback
  );
}

function isLegacyFeedbackWithProgress(
  feedback: LegacyFeedback,
): feedback is LegacyFeedbackWithProgress {
  return feedback.progressionDataPoints !== undefined;
}

function renderEnhancedMetrics(feedback: EnhancedFeedback) {
  return (
    <FeedbackSection title="مؤشرات التقدم" icon={<TrendingUp className="text-yellow-500 mx-1" />}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <p className="text-2xl font-bold">
            {feedback.vocabularyAnalysis.diversityScore.toString()}
          </p>
          <p className="text-sm text-gray-600">تنوع المفردات</p>
        </div>
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <p className="text-2xl font-bold">
            {feedback.progressionMetrics.grammarAccuracy.toString()}
          </p>
          <p className="text-sm text-gray-600">دقة القواعد</p>
        </div>
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <p className="text-2xl font-bold">
            {feedback.nativenessAnalysis.overallNativenessScore.toString()}
          </p>
          <p className="text-sm text-gray-600">مستوى التحدث كالبريطانيين</p>
        </div>
      </div>
    </FeedbackSection>
  );
}

function renderLegacyMetrics(feedback: LegacyFeedbackWithProgress) {
  const { uniqueWordsUsed, newWordsLearned, grammaticalErrorRate } = feedback.progressionDataPoints;
  return (
    <FeedbackSection title="مؤشرات التقدم" icon={<TrendingUp className="text-yellow-500 mx-1" />}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <p className="text-2xl font-bold">{uniqueWordsUsed}</p>
          <p className="text-sm text-gray-600">كلمة فريدة</p>
        </div>
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <p className="text-2xl font-bold">{newWordsLearned}</p>
          <p className="text-sm text-gray-600">كلمة جديدة</p>
        </div>
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <p className="text-2xl font-bold">{grammaticalErrorRate}%</p>
          <p className="text-sm text-gray-600">معدل الأخطاء</p>
        </div>
      </div>
    </FeedbackSection>
  );
}

function renderProgressMetrics(feedback: FeedbackType) {
  if (isEnhancedFeedback(feedback)) {
    return renderEnhancedMetrics(feedback);
  }
  const legacyFeedback = feedback;
  if (isLegacyFeedbackWithProgress(legacyFeedback)) {
    return renderLegacyMetrics(legacyFeedback);
  }
  return null;
}

export default function TestDetails({ details, recordingUrl }: TestDetailsProps) {
  const searchParams = useSearchParams();
  const isMobile = useIsMobile();

  const activeTab = searchParams.get("view") ?? "results";

  const handleTabChange = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("view", value);
      window.history.pushState(null, "", `?${params.toString()}`);
    },
    [searchParams],
  );

  useEffect(() => {
    if (searchParams.get("view") !== activeTab) {
      handleTabChange(activeTab);
    }
  }, [activeTab, searchParams, handleTabChange]);

  const feedback = details.feedback;

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
            <TestActionWrapper testType="mock-test">
              <Button variant="outline" className="min-w-full max-w-xs">
                ابدأ اختبار محادثة جديد
              </Button>
            </TestActionWrapper>
            <TestActionWrapper testType="general-english">
              <Button variant="outline" className="min-w-full max-w-xs">
                محادثة عامة بالإنجليزي
              </Button>
            </TestActionWrapper>
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
          <TabsList
            className={clsx("grid w-full md:w-auto rtl gap-0 md:gap-2.5", {
              "grid-cols-2": !isLegacyFeedbackWithProgress(feedback as LegacyFeedback),
              "grid-cols-3": isLegacyFeedbackWithProgress(feedback as LegacyFeedback),
            })}
          >
            <TabsTrigger value="results">
              {isMobile ? "ملخص النتيجة" : "ملخص عام للنتيجة"}
            </TabsTrigger>
            {isLegacyFeedbackWithProgress(feedback as LegacyFeedback) && (
              <TabsTrigger value="feedback">
                {isMobile ? "نصائح" : "التعليقات والنصائح"}
              </TabsTrigger>
            )}
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
                {feedback ? (
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

                    {isEnhancedFeedback(feedback) ? (
                      <div className="space-y-4">
                        <Card>
                          <CardHeader className="p-3 pb-0 text-center">
                            <CardTitle>تحليل النص</CardTitle>
                            {/* Legend */}
                            <div className="mt-4 flex flex-wrap gap-4 text-sm">
                              <div className="flex items-center gap-2">
                                <div className="w-4 h-1 bg-red-400 border-dotted border-b-2"></div>
                                <span>أخطاء نحوية</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-4 h-1 bg-blue-400 border-dotted border-b-2"></div>
                                <span>مفردات</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-4 h-1 bg-yellow-400 border-dotted border-b-2"></div>
                                <span>طبيعية التعبير</span>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="p-3">
                            <InteractiveTranscript feedback={feedback} />
                          </CardContent>
                        </Card>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <Card>
                            <CardHeader className="p-3 pb-0 text-center">
                              <CardTitle>تطور المفردات</CardTitle>
                            </CardHeader>
                            <CardContent className="p-3">
                              <VocabularyProgressChart metrics={feedback.progressionMetrics} />
                            </CardContent>
                          </Card>
                          <Card>
                            <CardHeader className="p-3 pb-0 text-center">
                              <CardTitle>تحسن القواعد</CardTitle>
                            </CardHeader>
                            <CardContent className="p-3">
                              <GrammarImprovementChart metrics={feedback.progressionMetrics} />
                            </CardContent>
                          </Card>
                        </div>

                        <Card>
                          <CardHeader className="p-3 pb-0 text-center">
                            <CardTitle>المفردات المستخدمة</CardTitle>
                          </CardHeader>
                          <CardContent className="p-3">
                            <WordCloud wordUsage={feedback.vocabularyAnalysis.wordUsage} />
                          </CardContent>
                        </Card>

                        <div className="space-y-4">
                          <FeedbackSection
                            title="التقييم العام"
                            icon={<TrendingUp className="text-green-500 mx-1" />}
                          >
                            {feedback.overallFeedback.strengths.map((strength, index) => (
                              <div key={index} className="flex items-start">
                                <div className="ml-2 mt-1 text-green-500 shrink-0">✓</div>
                                <p>{strength}</p>
                              </div>
                            ))}
                          </FeedbackSection>

                          <FeedbackSection
                            title="مجالات التحسين"
                            icon={<GitCommitHorizontal className="text-red-500 mx-1" />}
                          >
                            {feedback.overallFeedback.areasToImprove.map((area, index) => (
                              <div key={index} className="flex items-start">
                                <div className="ml-2 mt-1 text-red-500 shrink-0">•</div>
                                <p>{area}</p>
                              </div>
                            ))}
                          </FeedbackSection>

                          <FeedbackSection
                            title="الخطوات القادمة"
                            icon={<TrendingUp className="text-blue-500 mx-1" />}
                          >
                            {feedback.overallFeedback.nextSteps.map((step, index) => (
                              <div key={index} className="flex items-start">
                                <div className="ml-2 mt-1 text-blue-500 shrink-0">→</div>
                                <p>{step}</p>
                              </div>
                            ))}
                          </FeedbackSection>
                        </div>
                      </div>
                    ) : (
                      // Legacy feedback display
                      <div className="space-y-4">
                        {feedback.strengths && (
                          <FeedbackSection
                            title="التقييم العام"
                            icon={<TrendingUp className="text-green-500 mx-1" />}
                          >
                            {feedback.strengths.points.map((point, index) => (
                              <div key={index} className="flex items-start">
                                <div className="ml-2 mt-1 text-green-500 shrink-0">✓</div>
                                <p>{point}</p>
                              </div>
                            ))}
                          </FeedbackSection>
                        )}

                        {feedback.areasToImprove && (
                          <FeedbackSection
                            title="مجالات التحسين"
                            icon={<GitCommitHorizontal className="text-red-500 mx-1" />}
                          >
                            {feedback.areasToImprove.errors.map((error, index) => (
                              <div key={index} className="border-r-4 border-yellow-500 pr-4">
                                <p className="font-medium text-red-600 mb-1">{error.mistake}</p>
                                <p className="text-green-600">{error.correction}</p>
                              </div>
                            ))}
                          </FeedbackSection>
                        )}

                        {feedback.improvementTips && (
                          <FeedbackSection
                            title="نصائح للتحسين"
                            icon={<TrendingUp className="text-blue-500 mx-1" />}
                          >
                            {feedback.improvementTips.map((tip, index) => (
                              <div key={index} className="flex items-center">
                                <div className="ml-2 mt-1 text-blue-500 shrink-0">•</div>
                                <p>{tip}</p>
                              </div>
                            ))}
                          </FeedbackSection>
                        )}
                      </div>
                    )}
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
                {feedback ? (
                  <div className="space-y-6">{renderProgressMetrics(feedback)}</div>
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
              <CardHeader className="p-0">
                <CardTitle className="sr-only">المحادثة</CardTitle>
                <CardDescription className="sr-only">
                  نص كامل للمحادثة خلال الاختبار
                </CardDescription>
              </CardHeader>
              <CardContent className="max-sm:p-2">
                {recordingUrl && <AudioPlayer audioUrl={recordingUrl} title="تسجيل المحادثة" />}
                <InteractiveTranscriptView
                  transcription={details.transcription}
                  feedback={feedback && isEnhancedFeedback(feedback) ? feedback : undefined}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-8 flex justify-center items-center">
          <TestActionWrapper testType="mock-test">
            <Button variant="outline" className="w-full max-w-xs">
              ابدأ اختبار محادثة جديد
            </Button>
          </TestActionWrapper>
          <Divider className="my-5">أو</Divider>
          <TestActionWrapper testType="general-english">
            <Button variant="outline" className="w-full max-w-xs">
              محادثة عامة بالإنجليزي
            </Button>
          </TestActionWrapper>
        </div>
      </div>
    </main>
  );
}
