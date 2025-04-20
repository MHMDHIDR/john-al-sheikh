"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AudioControls } from "@/components/custom/audio-controls";
import { ChatMessage } from "@/components/custom/chat-message";
import { Timer } from "@/components/custom/timer";
import { InteractiveGridPattern } from "@/components/magicui/interactive-grid-pattern";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";

type Message = {
  role: "examiner" | "user";
  content: string;
  timestamp: string;
};

type SpeakingTestProps = {
  userId: string;
};

export function SpeakingTest({ userId }: SpeakingTestProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentSection, setCurrentSection] = useState(1);
  const [messages, setMessages] = useState<Message[]>([]);
  const [testId, setTestId] = useState<string>("");
  const [currentTopic, setCurrentTopic] = useState("Introduction");

  const audioChunks = useRef<Blob[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const router = useRouter();
  const { success, error: errorToast, warning } = useToast();

  const startTestMutation = api.openai.startSpeakingTest.useMutation();
  const continueTestMutation = api.openai.continueSpeakingTest.useMutation();
  const finalizeTestMutation = api.openai.finalizeSpeakingTest.useMutation();

  // Clear resources
  const clearResources = () => {
    timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    timeoutsRef.current = [];

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    audioChunks.current = [];
  };

  // Play audio response
  const playAudioResponse = (base64Audio: string) => {
    if (audioRef.current) {
      audioRef.current.src = `data:audio/mp3;base64,${base64Audio}`;
      void audioRef.current.play();
    }
  };

  // Handle recording toggle
  const handleToggleRecording = async () => {
    if (isRecording) {
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      clearResources();
      setIsRecording(false);
    } else {
      try {
        audioChunks.current = [];
        setIsRecording(true);

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });

        streamRef.current = stream;
        const recorder = new MediaRecorder(stream, {
          mimeType: "audio/webm;codecs=opus",
          audioBitsPerSecond: 128000,
        });

        mediaRecorderRef.current = recorder;

        // Handle audio data
        recorder.addEventListener("dataavailable", event => {
          if (event.data.size > 0) {
            audioChunks.current.push(event.data);
          }
        });

        // Handle recording stop
        recorder.addEventListener("stop", () => {
          void (async () => {
            const finalAudioChunks = [...audioChunks.current];
            clearResources();
            setIsRecording(false);

            if (finalAudioChunks.length === 0) {
              errorToast("No audio recorded");
              return;
            }

            try {
              setIsProcessing(true);

              // Create blob from stored chunks
              const audioBlob = new Blob(finalAudioChunks, { type: "audio/webm" });
              const reader = new FileReader();
              const base64Audio = await new Promise<string>((resolve, reject) => {
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(audioBlob);
              });

              // Continue the test with user's response
              const response = await continueTestMutation.mutateAsync({
                testId: testId!,
                audioBase64: base64Audio.split(",")[1] ?? "",
                currentTopic,
                section: currentSection,
              });

              if (!response.success) {
                errorToast("Failed to process response");
                setIsProcessing(false);
                return;
              }

              // Add examiner's response to messages
              setMessages(prev => [
                ...prev,
                {
                  role: "examiner",
                  content: response.examinerResponse,
                  timestamp: new Date().toISOString(),
                },
              ]);

              // Play examiner's audio response
              playAudioResponse(response.audioBase64);

              // Move to next section if needed
              if (currentSection === 3) {
                // Finalize test
                const results = await finalizeTestMutation.mutateAsync({
                  testId: testId,
                  messages: messages,
                });

                if (results.success) {
                  router.push("/speaking-test-results");
                }
              } else {
                setCurrentSection(prev => prev + 1);
              }

              setIsProcessing(false);
            } catch (err) {
              console.error(err);
              errorToast("Error processing response");
              setIsProcessing(false);
            }
          })();
        });

        // Auto-stop based on section
        const maxTime = currentSection === 2 ? 120 : 60; // 2 minutes for section 2, 1 minute for others
        const maxTimeTimeout = setTimeout(() => {
          if (recorder.state === "recording") {
            recorder.stop();
            success("Recording finished");
          }
        }, maxTime * 1000);
        timeoutsRef.current.push(maxTimeTimeout);

        // Warning 10 seconds before end
        const warningTimeout = setTimeout(
          () => {
            if (recorder.state === "recording") {
              warning("Please wrap up your response");
            }
          },
          (maxTime - 10) * 1000,
        );
        timeoutsRef.current.push(warningTimeout);

        recorder.start(500);
      } catch (err) {
        errorToast("Could not access microphone");
        clearResources();
        setIsRecording(false);
        console.error(err);
      }
    }
  };

  // Start test on mount
  useEffect(() => {
    const startTest = async () => {
      try {
        const response = await startTestMutation.mutateAsync({
          userId,
          type: "MOCK",
        });

        if (response.success) {
          setTestId(response.testId);
          setMessages([
            {
              role: "examiner",
              content: response.examinerResponse,
              timestamp: new Date().toISOString(),
            },
          ]);
          playAudioResponse(response.audioBase64);
        }
      } catch (error) {
        console.error(error);
        errorToast("Failed to start test");
      }
    };

    void startTest();

    return () => {
      clearResources();
    };
  }, [userId]);

  return (
    <div className="relative select-none flex min-h-screen flex-col items-center justify-center bg-white p-4 overflow-hidden">
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

      <div className="w-full max-w-2xl space-y-8 text-right z-10 relative">
        <div className="text-center">
          <h1 className="mb-5 text-2xl font-bold text-gray-900">اختبار IELTS للمحادثة</h1>
          <p className="mb-2 text-gray-600">القسم {currentSection} من 3</p>

          {isRecording && (
            <div className="my-6 flex flex-col items-center">
              <Timer
                isRunning={isRecording}
                onTimeUp={() => {
                  if (mediaRecorderRef.current?.state === "recording") {
                    mediaRecorderRef.current.stop();
                  }
                }}
                totalSeconds={currentSection === 2 ? 120 : 60}
              />
            </div>
          )}

          {isProcessing && (
            <div className="my-8 flex flex-col items-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-gray-400 border-t-primary"></div>
              <p className="mt-2 font-medium text-gray-600">جاري تحليل الإجابة...</p>
            </div>
          )}
        </div>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {messages.map((msg, idx) => (
            <ChatMessage
              key={idx}
              message={msg.content}
              timestamp={msg.timestamp}
              isReply={msg.role === "user"}
            />
          ))}
        </div>

        <div className="sticky bottom-0 bg-white py-4">
          <AudioControls
            isRecording={isRecording}
            onToggleRecording={handleToggleRecording}
            disabled={isProcessing || !testId}
          />
        </div>
      </div>

      <audio ref={audioRef} className="hidden" />
    </div>
  );
}
