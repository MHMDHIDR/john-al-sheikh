"use client";

import { Loader2 } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { useGlobalVapiConversation } from "@/app/providers/vapi-conversation-provider";
import FullSpeakingRecorderButton from "@/components/custom/full-speaking-recorder-button";
import { Timer } from "@/components/custom/timer";
import { AuroraText } from "@/components/magicui/aurora-text";
import { InteractiveGridPattern } from "@/components/magicui/interactive-grid-pattern";
import { useMockTestStore } from "@/hooks/use-mock-test-store";
import { CallStatus, useVapiConversation } from "@/hooks/use-vapi-conversation";
import { GENERAL_ENGLISH_CONVERSATION_TIME } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type {
  FullSpeakingRecorderButtonRef,
  UserProfile,
} from "@/components/custom/full-speaking-recorder-button";

export type ConversationModeType = "mock-test" | "general-english";

type ConversationUIProps = {
  user: UserProfile;
  mode: ConversationModeType;
  title?: string;
};

const LatestMessage = dynamic(() => import("@/components/custom/latest-message"), {
  ssr: false,
});

export default function ConversationUI({
  user,
  mode,
  title = "اختبار المحادثة",
}: ConversationUIProps) {
  const { messages, clearTest } = useMockTestStore();
  const { callStatus, isSpeaking } = useGlobalVapiConversation();
  const { isMuted, setVolume } = useVapiConversation();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recorderRef = useRef<FullSpeakingRecorderButtonRef>(null);
  const clearTestRef = useRef(clearTest);
  const sessionStartTimeRef = useRef<number | null>(null);
  const [showConnectingOverlay, setShowConnectingOverlay] = useState(false);

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
  const isConnecting =
    callStatus === CallStatus.CONNECTING || callStatus === CallStatus.CONNECTING_PROGRESS;

  // Show overlay when connecting and hide when AI starts talking (when we get the first message or speech starts)
  useEffect(() => {
    if (isConnecting) {
      setShowConnectingOverlay(true);
    } else if (isConnected && (messages.length > 0 || isSpeaking)) {
      // Hide overlay when we get the first message OR when speech starts (AI starts talking)
      setShowConnectingOverlay(false);
    } else if (!isConnecting && !isConnected) {
      // Hide overlay when not connecting and not connected
      setShowConnectingOverlay(false);
    }
  }, [isConnecting, isConnected, messages.length, isSpeaking]);

  // Update session start time when connected
  useEffect(() => {
    if (isConnected && recorderRef.current) {
      const startTime = recorderRef.current.getSessionStartTime();
      if (startTime) {
        sessionStartTimeRef.current = startTime;
      }
    } else if (!isConnected) {
      sessionStartTimeRef.current = null;
    }
  }, [isConnected]);

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
            "absolute inset-x-0 inset-y-0 h-full w-full z-0 opacity-20",
          )}
          width={70}
          height={70}
          squares={[30, 30]}
          squaresClassName="hover:fill-blue-200"
        />

        <Timer
          isRunning={isConnected}
          onTimeUp={() => {
            if (recorderRef.current) {
              // Stop the test when time is up (only for general-english mode)
              if (mode === "general-english") {
                recorderRef.current.stopTest();
              }
            }
          }}
          startTime={sessionStartTimeRef.current}
          duration={mode === "general-english" ? GENERAL_ENGLISH_CONVERSATION_TIME : 0}
          mode={mode}
          isMuted={isMuted}
          onToggleMute={() => setVolume(isMuted ? 1 : 0)}
          isConnected={isConnected}
        />
      </div>

      <div className="sticky bottom-0 shadow-inner z-20 w-full bg-white/50 dark:bg-black/50 py-2 backdrop-blur-md flex flex-col">
        <LatestMessage message={latestMessage} />
        <div className="flex flex-col items-center gap-4 select-none px-4">
          <FullSpeakingRecorderButton ref={recorderRef} user={user} mode={mode} />
        </div>
      </div>

      {/* Connecting overlay - full screen */}
      {showConnectingOverlay && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80">
          <div className="flex flex-col items-center gap-4 p-8 rounded-lg bg-white/10 backdrop-blur-sm">
            <Loader2 className="size-12 animate-spin text-white" />
            <div className="text-center">
              <h3 className="text-lg font-semibold text-white">جاري بدأ المحادثة</h3>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
