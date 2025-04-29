"use client";

import { useSession } from "next-auth/react";
import { useEffect, useRef } from "react";
import IELTSSpeakingRecorder from "@/components/custom/ielts-speaking-recorder";
import { AuroraText } from "@/components/magicui/aurora-text";
import { InteractiveGridPattern } from "@/components/magicui/interactive-grid-pattern";
import { useMockTestStore } from "@/hooks/use-mock-test-store";
import { cn } from "@/lib/utils";

export default function MockTestPage() {
  const { data: session } = useSession();
  const userId = session?.user?.id ?? "";

  const { messages } = useMockTestStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => scrollToBottom(), [messages]);

  return (
    <main className="min-h-screen grid grid-rows-[auto_1fr_auto] grid-cols-[minmax(0,1fr)] overflow-x-clip">
      <AuroraText
        className={
          "m-2 sticky mt-0 top-12 md:top-13 py-1.5 mx-0 shadow min-w-full text-center z-20 text-xl font-bold bg-white/50 backdrop-blur-md text-gray-900 select-none"
        }
      >
        اختبار المحادثة
      </AuroraText>

      <div className="relative w-full max-w-4xl">
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

        <div className="relative z-10 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 space-y-4 ltr">
            {messages.map((message, index) => (
              <div
                key={`${message.timestamp}-${index}`}
                className={`flex w-full ${
                  message.role === "examiner" ? "justify-start" : "justify-end"
                } mb-4`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-4 ${
                    message.role === "examiner"
                      ? "bg-blue-100 text-blue-900"
                      : "bg-green-100 text-green-900"
                  }`}
                >
                  <div className="font-semibold mb-1">
                    {message.role === "examiner" ? "Examiner" : "You"}
                  </div>
                  <div className="whitespace-pre-wrap break-words">{message.content}</div>
                  <div className="text-xs mt-2 opacity-70">{message.timestamp}</div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 shadow-inner z-20 w-full bg-white/50 py-2 backdrop-blur-md flex flex-col">
        <div className="flex justify-between items-center select-none px-4">
          <IELTSSpeakingRecorder userId={userId} />
        </div>
      </div>
    </main>
  );
}
