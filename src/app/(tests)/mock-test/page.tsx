"use client";

import clsx from "clsx";
import { useState } from "react";
import { ButtonRecord } from "@/components/custom/button-record";
import { Timer } from "@/components/custom/timer";
import { AuroraText } from "@/components/magicui/aurora-text";
import { InteractiveGridPattern } from "@/components/magicui/interactive-grid-pattern";
import { cn } from "@/lib/utils";

const speakingTestMessages = [
  {
    role: "examiner",
    content:
      "Hi, I'm John Al-Sheikh, an experienced IELTS examiner. I will conduct your IELTS speaking test today. Can you please introduce yourself?",
    timestamp: new Date().toISOString(),
  },
  {
    role: "candidate",
    content: "Hello, my name is John Doe. Nice to meet you.",
    timestamp: new Date().toISOString(),
  },
  {
    role: "examiner",
    content: "Thank you for introducing yourself. Now, let's start the test.",
    timestamp: new Date().toISOString(),
  },
  {
    role: "candidate",
    content: "Thank you for introducing yourself. Now, let's start the test.",
    timestamp: new Date().toISOString(),
  },
  {
    role: "examiner",
    content: "Thank you for introducing yourself. Now, let's start the test.",
    timestamp: new Date().toISOString(),
  },
  {
    role: "candidate",
    content: "Thank you for introducing yourself. Now, let's start the test.",
    timestamp: new Date().toISOString(),
  },
  {
    role: "examiner",
    content: "Thank you for introducing yourself. Now, let's start the test.",
    timestamp: new Date().toISOString(),
  },
  {
    role: "candidate",
    content: "Thank you for introducing yourself. Now, let's start the test.",
    timestamp: new Date().toISOString(),
  },
  {
    role: "examiner",
    content: "Thank you for introducing yourself. Now, let's start the test.",
    timestamp: new Date().toISOString(),
  },
  {
    role: "candidate",
    content: "Thank you for introducing yourself. Now, let's start the test.",
    timestamp: new Date().toISOString(),
  },
  {
    role: "examiner",
    content: "Thank you for introducing yourself. Now, let's start the test.",
    timestamp: new Date().toISOString(),
  },
  {
    role: "candidate",
    content: "Thank you for introducing yourself. Now, let's start the test.",
    timestamp: new Date().toISOString(),
  },
];

export default function MockTestPage() {
  const [sectionName, setSectionName] = useState<string>("الأولى");

  return (
    <main className="min-h-fit bg-white flex flex-col items-center">
      <AuroraText className="m-2 mt-0 sticky top-12 py-1 shadow bg-white w-full text-center z-20 text-2xl font-bold text-gray-900 select-none">
        اختبار المحادثة
      </AuroraText>

      <div className="relative w-full max-w-4xl mx-auto">
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

        <div className="relative z-10 flex flex-col min-h-[600px] bg-white rounded-lg overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 space-y-4 ltr">
            {speakingTestMessages.map((message, index) => (
              <div
                key={index}
                className={clsx("flex", {
                  "justify-start": message.role === "examiner",
                  "justify-end": message.role === "candidate",
                })}
              >
                <div
                  className={clsx("max-w-[80%] rounded-lg p-3", {
                    "bg-blue-100 text-blue-900": message.role === "examiner",
                    "bg-green-100 text-green-900": message.role === "candidate",
                  })}
                >
                  <p className="text-sm ltr">{message.content}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 z-20 w-full bg-gray-50 flex flex-col">
        <div className="flex justify-between items-center select-none px-4 py-2">
          <Timer
            isRunning={false}
            onTimeUp={() => console.log("time up")}
            totalSeconds={60}
            mode="preparation"
          />
          <strong>المرحلة {sectionName}</strong>
        </div>

        <div className="p-2 border-t border-t-gray-200">
          <div className="flex justify-center">
            <ButtonRecord
              isRecording={false}
              onClick={() => console.log("clicked")}
              disabled={false}
              waves={false}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
