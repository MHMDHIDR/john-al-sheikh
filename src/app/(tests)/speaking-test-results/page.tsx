"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AuroraText } from "@/components/magicui/aurora-text";
import { InteractiveGridPattern } from "@/components/magicui/interactive-grid-pattern";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type Results = {
  fluencyAndCoherence: number;
  lexicalResource: number;
  grammaticalRangeAndAccuracy: number;
  pronunciation: number;
  overallBand: number;
  feedback: {
    overall: string;
    fluencyAndCoherence: string;
    lexicalResource: string;
    grammaticalRangeAndAccuracy: string;
    pronunciation: string;
  };
};

export default function SpeakingTestResults() {
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
      router.push("/mock-test");
    }
  }, [loading, results, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!results) return null;

  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
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
          <AuroraText className="mx-2 text-3xl font-bold text-gray-900">
            Speaking Test Results
          </AuroraText>
          <div className="mt-4 text-5xl font-bold text-blue-600">
            {results.overallBand.toFixed(1)}
          </div>
          <p className="mt-2 text-gray-600">Overall Band Score</p>
        </div>

        <Card className="p-6 shadow-sm">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Detailed Assessment</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">Fluency & Coherence:</span>
                <span className="text-blue-600 font-bold">
                  {results.fluencyAndCoherence.toFixed(1)}
                </span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">Lexical Resource:</span>
                <span className="text-blue-600 font-bold">
                  {results.lexicalResource.toFixed(1)}
                </span>
              </div>
            </div>
            <div className="flex flex-col">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">Grammatical Range:</span>
                <span className="text-blue-600 font-bold">
                  {results.grammaticalRangeAndAccuracy.toFixed(1)}
                </span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">Pronunciation:</span>
                <span className="text-blue-600 font-bold">{results.pronunciation.toFixed(1)}</span>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid gap-6 md:grid-cols-1">
          {/* Overall Feedback */}
          <Card className="p-6 shadow-sm">
            <h3 className="mb-4 text-xl font-semibold text-gray-900">Overall Assessment</h3>
            <p className="text-gray-700">{results.feedback.overall}</p>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Fluency & Coherence */}
          <Card className="p-6 shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold text-gray-900">Fluency & Coherence</h3>
              <span className="text-blue-600 font-bold">
                {results.fluencyAndCoherence.toFixed(1)}
              </span>
            </div>
            <Separator className="my-2" />
            <p className="text-gray-700">{results.feedback.fluencyAndCoherence}</p>
          </Card>

          {/* Lexical Resource */}
          <Card className="p-6 shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold text-gray-900">Lexical Resource</h3>
              <span className="text-blue-600 font-bold">{results.lexicalResource.toFixed(1)}</span>
            </div>
            <Separator className="my-2" />
            <p className="text-gray-700">{results.feedback.lexicalResource}</p>
          </Card>

          {/* Grammatical Range */}
          <Card className="p-6 shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold text-gray-900">Grammatical Range</h3>
              <span className="text-blue-600 font-bold">
                {results.grammaticalRangeAndAccuracy.toFixed(1)}
              </span>
            </div>
            <Separator className="my-2" />
            <p className="text-gray-700">{results.feedback.grammaticalRangeAndAccuracy}</p>
          </Card>

          {/* Pronunciation */}
          <Card className="p-6 shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold text-gray-900">Pronunciation</h3>
              <span className="text-blue-600 font-bold">{results.pronunciation.toFixed(1)}</span>
            </div>
            <Separator className="my-2" />
            <p className="text-gray-700">{results.feedback.pronunciation}</p>
          </Card>
        </div>

        <div className="text-center">
          <Link
            href="/mock-test"
            className="rounded-md bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Take Another Test
          </Link>
        </div>
      </div>
    </main>
  );
}
