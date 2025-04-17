"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";
import { FeedbackSection } from "@/components/custom/feedback-section";
import { Button } from "@/components/ui/button";

type IELTSResult = {
  band: number;
  strengths: {
    summary: string;
    points: string[];
  };
  areasToImprove: {
    errors: Array<{
      mistake: string;
      correction: string;
    }>;
  };
  improvementTips: string[];
  transcription: string;
  prompt: string;
};

export default function ResultsPage() {
  const { data: session } = useSession();

  // if user is not logged in, redirect to signin page
  if (session === null) {
    redirect("/signin");
  }

  const [result, setResult] = useState<IELTSResult | null>(null);

  useEffect(() => {
    try {
      const savedResult = sessionStorage.getItem("ieltsResult");
      if (savedResult) {
        setResult(JSON.parse(savedResult) as IELTSResult);
      }
    } catch (error) {
      console.error("Error loading results:", error);
    }
  }, []);

  if (!result) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-white p-8">
        <div className="w-full max-w-2xl space-y-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900">جاري تحميل النتائج...</h2>
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-solid border-gray-400 border-t-primary"></div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-white p-8">
      <div className="w-full max-w-2xl space-y-8 text-right">
        <div className="text-center">
          <h1 className="mb-4 text-6xl font-bold text-gray-900">{result.band}</h1>
          <p className="mb-8 text-2xl text-gray-600">نطاق IELTS الخاص بك</p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 mb-8">
          <h3 className="mb-2 text-lg font-medium text-gray-900">الموضوع:</h3>
          <p className="text-gray-700">{result.prompt}</p>

          <h3 className="mt-4 mb-2 text-lg font-medium text-gray-900">إجابتك:</h3>
          <p className="text-gray-700 bg-white p-4 text-justify ltr rounded border border-gray-200">
            {result.transcription}
          </p>
        </div>

        <FeedbackSection title="نقاط القوة">
          <p className="mb-4">{result.strengths.summary}</p>
          <ul className="list-disc space-y-2">
            {result.strengths.points.map((point, index) => (
              <li key={index}>{point}</li>
            ))}
          </ul>
        </FeedbackSection>

        <FeedbackSection title="مجالات التحسين">
          <div className="space-y-4">
            {result.areasToImprove.errors.map((error, index) => (
              <div key={index}>
                <p className="mb-2 text-red-600">✗ {error.mistake}</p>
                <p className="text-green-600">✓ {error.correction}</p>
              </div>
            ))}
          </div>
        </FeedbackSection>

        <FeedbackSection title="نصائح للتحسين">
          <ul className="list-disc space-y-2">
            {result.improvementTips.map((tip, index) => (
              <li key={index}>{tip}</li>
            ))}
          </ul>
        </FeedbackSection>

        <div className="mt-8 text-center">
          <Button asChild variant="pressable">
            <Link href="/signin">سجل للحصول على المزيد من الاختبارات</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
