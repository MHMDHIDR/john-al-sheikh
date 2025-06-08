"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { JohnAlSheikhLoadingPage } from "@/components/custom/loading";
import { AuroraText } from "@/components/magicui/aurora-text";
import { InteractiveGridPattern } from "@/components/magicui/interactive-grid-pattern";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type Results = {
  testId: string;
  fluencyAndCoherence: number;
  lexicalResource: number;
  grammaticalRangeAndAccuracy: number;
  pronunciation: number;
  overallBand: number;
  testType?: "mock-test" | "general-english";
  feedback: {
    overall: string;
    fluencyAndCoherence: string;
    lexicalResource: string;
    grammaticalRangeAndAccuracy: string;
    pronunciation: string;
  };
  strengths?: {
    summary: string;
    points: string[];
  };
  areasToImprove?: {
    errors: Array<{
      mistake: string;
      correction: string;
    }>;
  };
  improvementTips?: string[];
};

export default function SpeakingTestResults({ credits }: { credits: number }) {
  const [results, setResults] = useState<Results | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedResults = sessionStorage.getItem("ieltsResult");
    if (storedResults) {
      try {
        setResults(JSON.parse(storedResults) as Results);
      } catch (error) {
        console.error("Error parsing results:", error);
      }
    }
    setLoading(false);
  }, []);

  // Redirect if no results found after checking
  useEffect(() => {
    if (!loading && !results) {
      router.replace("/mock-test");
    }
  }, [loading, results, router]);

  if (loading) {
    return <JohnAlSheikhLoadingPage />;
  }

  if (!results) return null;

  // Determine the title and redirect link based on test type
  const isGeneralEnglish = results.testType === "general-english";
  const pageTitle = isGeneralEnglish
    ? "نتائج محادثة اللغة الإنجليزية العامة"
    : "نتائج اختبار المحادثة";
  const returnLink =
    credits <= 0 ? "/buy-credits" : isGeneralEnglish ? "/general-english" : "/mock-test";

  return (
    <main
      className="min-h-screen bg-white flex flex-col select-none items-center justify-center p-4"
      dir="rtl"
    >
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

      <div className="relative z-10 w-full max-w-4xl space-y-8">
        <div className="text-center">
          <AuroraText className="mx-2 text-3xl font-bold">{pageTitle}</AuroraText>
          <div className="mt-4 text-5xl font-bold text-blue-600">
            {results.overallBand.toFixed(1)}
          </div>
          <p className="mt-2 text-gray-600">الدرجة الكلية</p>
        </div>

        <Card className="p-6 shadow-sm">
          <h3 className="text-xl font-semibold mb-4">التقييم التفصيلي</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">الطلاقة والتماسك:</span>
                <span className="text-blue-600 dark:text-blue-300 font-bold">
                  {results.fluencyAndCoherence.toFixed(1)}
                </span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">الثروة اللغوية:</span>
                <span className="text-blue-600 dark:text-blue-300 font-bold">
                  {results.lexicalResource.toFixed(1)}
                </span>
              </div>
            </div>
            <div className="flex flex-col">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">المدى والدقة النحوية:</span>
                <span className="text-blue-600 dark:text-blue-300 font-bold">
                  {results.grammaticalRangeAndAccuracy.toFixed(1)}
                </span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">النطق:</span>
                <span className="text-blue-600 dark:text-blue-300 font-bold">
                  {results.pronunciation.toFixed(1)}
                </span>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid gap-6 md:grid-cols-1">
          {/* Overall Feedback */}
          <Card className="p-6 shadow-sm space-y-2">
            <h3 className="text-xl font-semibold">التقييم العام</h3>
            <p className="">{results.feedback.overall}</p>

            <Link href={`/dashboard/${results.testId}`}>
              <Button variant="active">عرض النتيجة الكاملة</Button>
            </Link>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Fluency & Coherence */}
          <Card className="p-6 shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold">الطلاقة والتماسك</h3>
              <span className="text-blue-600 dark:text-blue-300 font-bold">
                {results.fluencyAndCoherence.toFixed(1)}
              </span>
            </div>
            <Separator className="my-2" />
            <p className="">{results.feedback.fluencyAndCoherence}</p>
          </Card>

          {/* Lexical Resource */}
          <Card className="p-6 shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold">الثروة اللغوية</h3>
              <span className="text-blue-600 dark:text-blue-300 font-bold">
                {results.lexicalResource.toFixed(1)}
              </span>
            </div>
            <Separator className="my-2" />
            <p className="">{results.feedback.lexicalResource}</p>
          </Card>

          {/* Grammatical Range */}
          <Card className="p-6 shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold">المدى والدقة النحوية</h3>
              <span className="text-blue-600 dark:text-blue-300 font-bold">
                {results.grammaticalRangeAndAccuracy.toFixed(1)}
              </span>
            </div>
            <Separator className="my-2" />
            <p className="">{results.feedback.grammaticalRangeAndAccuracy}</p>
          </Card>

          {/* Pronunciation */}
          <Card className="p-6 shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold">النطق</h3>
              <span className="text-blue-600 dark:text-blue-300 font-bold">
                {results.pronunciation.toFixed(1)}
              </span>
            </div>
            <Separator className="my-2" />
            <p className="">{results.feedback.pronunciation}</p>
          </Card>
        </div>

        {/* Strengths */}
        {results.strengths && results.strengths.points.length > 0 && (
          <Card className="p-6 shadow-sm">
            <h3 className="mb-4 text-xl font-semibold">نقاط القوة</h3>
            <div className="space-y-2">
              {results.strengths.points.map((point, index) => (
                <div key={index} className="flex items-start">
                  <div className="mr-2 mt-1 text-green-500 shrink-0">✓</div>
                  <p className="">{point}</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Areas to Improve */}
        {results.areasToImprove && results.areasToImprove.errors.length > 0 && (
          <Card className="p-6 shadow-sm">
            <h3 className="mb-4 text-xl font-semibold">مجالات التحسين</h3>
            <div className="space-y-4">
              {results.areasToImprove.errors.map((error, index) => (
                <div key={index} className="border-r-4 border-yellow-500 pr-4">
                  <p className="font-medium text-red-600 mb-1">{error.mistake}</p>
                  <p className="text-green-600">{error.correction}</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Improvement Tips */}
        {results.improvementTips && results.improvementTips.length > 0 && (
          <Card className="p-6 shadow-sm">
            <h3 className="mb-4 text-xl font-semibold">نصائح للتحسين</h3>
            <div className="space-y-2">
              {results.improvementTips.map((tip, index) => (
                <div key={index} className="flex items-start">
                  <div className="ml-2 mt-1 text-blue-500 shrink-0">●</div>
                  <p className="">{tip}</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        <div className="text-center">
          <Link
            href={returnLink}
            className="rounded-md bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            محادثة جديدة
          </Link>
        </div>
      </div>
    </main>
  );
}
