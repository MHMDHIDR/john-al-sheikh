"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef } from "react";
import { useGlobalVapiConversation } from "@/app/providers/vapi-conversation-provider";
import FullSpeakingRecorderButton from "@/components/custom/full-speaking-recorder-button";
import FullSpeakingRecorderWaves from "@/components/custom/full-speaking-recorder-waves";
import { AuroraText } from "@/components/magicui/aurora-text";
import { InteractiveGridPattern } from "@/components/magicui/interactive-grid-pattern";
import { useMockTestStore } from "@/hooks/use-mock-test-store";
import { CallStatus } from "@/hooks/use-vapi-conversation";
import { cn } from "@/lib/utils";
import type {
  FullSpeakingRecorderButtonRef,
  UserProfile,
} from "@/components/custom/full-speaking-recorder-button";

export type ConversationModeType = "mock-test" | "general-english";

type ConversationUIProps = {
  user: UserProfile;
  isFreeTrialEnded: boolean;
  mode: ConversationModeType;
  title?: string;
};

const LatestMessage = dynamic(() => import("@/components/custom/latest-message"), {
  ssr: false,
});

export default function ConversationUI({
  user,
  isFreeTrialEnded,
  mode,
  title = "اختبار المحادثة",
}: ConversationUIProps) {
  const { messages, clearTest } = useMockTestStore();
  const { callStatus } = useGlobalVapiConversation();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recorderRef = useRef<FullSpeakingRecorderButtonRef>(null);
  const clearTestRef = useRef(clearTest);

  // Update the ref when clearTest changes
  useEffect(() => {
    clearTestRef.current = clearTest;
  }, [clearTest]);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

  // Run clearTest only once when the component mounts
  useEffect(() => {
    // Use the ref instead of the actual function
    clearTestRef.current();

    return () => {
      clearTestRef.current();
    };
  }, []);

  useEffect(() => scrollToBottom(), [messages]);

  const isConnected = callStatus === CallStatus.ACTIVE;

  // Get the latest message
  const latestMessage = messages.length > 0 ? messages[messages.length - 1] : undefined;

  return (
    <main className="min-h-screen grid grid-rows-[auto_1fr_auto] grid-cols-[minmax(0,1fr)] overflow-x-clip">
      <AuroraText
        className={
          "m-2 sticky mt-0 top-12 md:top-13 py-1.5 mx-0 shadow min-w-full text-center z-20 text-xl font-bold bg-white/50 dark:bg-black/50 backdrop-blur-md text-gray-900 select-none"
        }
      >
        {title}
      </AuroraText>

      <div className="relative w-full max-w-5xl mx-auto flex items-center justify-center">
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

        <FullSpeakingRecorderWaves isConnected={isConnected} />
      </div>

      <div className="sticky bottom-0 shadow-inner z-20 w-full bg-white/50 dark:bg-black/50 py-2 backdrop-blur-md flex flex-col">
        <LatestMessage message={latestMessage} />
        <div className="flex flex-col items-center gap-4 select-none px-4">
          <FullSpeakingRecorderButton
            ref={recorderRef}
            user={user}
            isFreeTrialEnded={isFreeTrialEnded}
            mode={mode}
          />
        </div>
      </div>
    </main>
  );
}
