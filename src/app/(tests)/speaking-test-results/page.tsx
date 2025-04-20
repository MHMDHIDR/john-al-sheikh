"use client";

import { redirect } from "next/navigation";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { auth } from "@/server/auth";

type TestFeedback = {
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

export default async function SpeakingTestResults() {
  const session = await auth();

  if (!session) {
    return redirect("/signin?callbackUrl=/speaking-test-results");
  }

  return <ResultsDisplay />;
}

function ResultsDisplay() {
  const [feedback, setFeedback] = useState<TestFeedback | null>(null);

  useEffect(() => {
    const storedResult = sessionStorage.getItem("ieltsResult");
    if (storedResult) {
      setFeedback(JSON.parse(storedResult));
    }
  }, []);

  if (!feedback) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg text-gray-600">No test results found.</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Speaking Test Results</h1>
          <p className="mt-2 text-lg text-gray-600">
            Overall Band Score: {feedback.band.toFixed(1)}
          </p>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Strengths</h2>
            <p className="text-gray-700 mb-4">{feedback.strengths.summary}</p>
            <ul className="list-disc list-inside space-y-2">
              {feedback.strengths.points.map((point, index) => (
                <li key={index} className="text-gray-600">
                  {point}
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Areas to Improve</h2>
            <div className="space-y-4">
              {feedback.areasToImprove.errors.map((error, index) => (
                <div key={index} className="space-y-2">
                  <p className="text-red-600">{error.mistake}</p>
                  <p className="text-green-600">Correction: {error.correction}</p>
                  <Separator className="my-2" />
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Improvement Tips</h2>
            <ul className="list-disc list-inside space-y-2">
              {feedback.improvementTips.map((tip, index) => (
                <li key={index} className="text-gray-600">
                  {tip}
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Test Transcript</h2>
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Topic</h3>
                <p className="text-gray-700">{feedback.prompt}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Your Response</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{feedback.transcription}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}
