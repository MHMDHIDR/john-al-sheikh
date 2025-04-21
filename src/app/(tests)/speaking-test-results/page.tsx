"use client";

import { useEffect, useState } from "react";
import { AuroraText } from "@/components/magicui/aurora-text";
import { InteractiveGridPattern } from "@/components/magicui/interactive-grid-pattern";
import { cn } from "@/lib/utils";

type Results = {
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
};

export default function SpeakingTestResults() {
  const [results, setResults] = useState<Results | null>(null);

  useEffect(() => {
    const storedResults = sessionStorage.getItem("ieltsResult");
    if (storedResults) {
      setResults(JSON.parse(storedResults) as Results);
    } else {
      // Redirect if no results found
      window.location.href = "/mock-test";
    }
  }, []);

  if (!results) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

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
          <div className="mt-4 text-5xl font-bold text-blue-600">{results.band}</div>
          <p className="mt-2 text-gray-600">Overall Band Score</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Strengths */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-xl font-semibold text-gray-900">Strengths</h3>
            <p className="mb-4 text-gray-600">{results.strengths.summary}</p>
            <ul className="space-y-2">
              {results.strengths.points.map((point, index) => (
                <li key={index} className="flex items-start">
                  <span className="mr-2 text-green-500">✓</span>
                  <span className="text-gray-700">{point}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Areas to Improve */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-xl font-semibold text-gray-900">Areas to Improve</h3>
            <ul className="space-y-4">
              {results.areasToImprove.errors.map((error, index) => (
                <li key={index} className="space-y-2">
                  <div className="flex items-start">
                    <span className="mr-2 text-red-500">✗</span>
                    <span className="text-gray-700">{error.mistake}</span>
                  </div>
                  <div className="ml-6 text-sm text-gray-600">
                    <span className="font-medium">Suggestion: </span>
                    {error.correction}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Improvement Tips */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-xl font-semibold text-gray-900">Improvement Tips</h3>
          <ul className="grid gap-4 sm:grid-cols-2">
            {results.improvementTips.map((tip, index) => (
              <li key={index} className="flex items-start">
                <span className="mr-2 text-blue-500">•</span>
                <span className="text-gray-700">{tip}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="text-center">
          <button
            onClick={() => (window.location.href = "/mock-test")}
            className="rounded-md bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Take Another Test
          </button>
        </div>
      </div>
    </main>
  );
}
