"use client";

import clsx from "clsx";
import { useCallback, useEffect, useRef, useState } from "react";
import { ButtonRecord } from "@/components/custom/button-record";
import { Timer } from "@/components/custom/timer";
import { AuroraText } from "@/components/magicui/aurora-text";
import { InteractiveGridPattern } from "@/components/magicui/interactive-grid-pattern";
import { Button } from "@/components/ui/button";
import { env } from "@/env";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";

// Define message type for the speaking test conversation
type SpeakingTestMessage = {
  role: "examiner" | "candidate";
  content: string;
  timestamp: string;
};

export default function MockTestPage() {
  // State for the speaking test
  // const [sectionName, setSectionName] = useState<string>("الأولى");
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [messages, setMessages] = useState<SpeakingTestMessage[]>([]);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [timerRunning, setTimerRunning] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [showOverlay, setShowOverlay] = useState<boolean>(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // tRPC mutations
  const textToSpeech = api.openai.textToSpeech.useMutation();
  const transcribeAudio = api.openai.transcribeAudio.useMutation();
  const getFollowUp = api.openai.getFollowUpQuestion.useMutation();

  // Initialize audio element
  useEffect(() => {
    audioRef.current = new Audio();

    // Handle audio playback end event
    audioRef.current.addEventListener("ended", handleAudioEnded);

    return () => audioRef.current?.removeEventListener("ended", handleAudioEnded);
  }, []);

  // Function to start the test with examiner introduction
  const initializeTest = async () => {
    // Initial examiner message
    const examinerIntro = {
      role: "examiner" as const,
      content:
        "Hi, I'm John Al-Sheikh, an experienced IELTS examiner. I will conduct your IELTS speaking test today. Can you please introduce yourself?",
      timestamp: new Date().toISOString(),
    };

    // Add message to state
    setMessages([examinerIntro]);

    // Speak the introduction using OpenAI TTS
    await speakExaminerMessage(examinerIntro.content);
  };

  // Start test after user interaction (to allow audio playback)
  const handleStartTest = () => {
    setShowOverlay(false);
    // Start the test after user interaction
    void initializeTest();
  };

  // Function to speak examiner messages
  const speakExaminerMessage = async (text: string) => {
    try {
      setIsProcessing(true);
      const result = await textToSpeech.mutateAsync({ text });

      if (result.success && audioRef.current) {
        // Play the audio
        audioRef.current.src = result.audio;
        await audioRef.current.play();
      }
    } catch (error) {
      console.error("Failed to speak examiner message:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Toggle recording state and handle recording logic
  const toggleRecording = async () => {
    if (isRecording) {
      // Stop recording
      mediaRecorder?.stop();
      setIsRecording(false);
      setTimerRunning(false);
    } else {
      try {
        // Start recording
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);

        // Clear previous chunks
        setAudioChunks([]);

        // Set up recording event handlers
        recorder.ondataavailable = event => {
          if (event.data.size > 0) {
            setAudioChunks(chunks => [...chunks, event.data]);
          }
        };

        recorder.onstop = async () => {
          // Convert audio chunks to blob
          const audioBlob = new Blob(audioChunks, { type: "audio/webm" });

          // Convert blob to base64
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = async () => {
            const base64Audio = reader.result as string;

            // Transcribe the audio
            await handleAudioTranscription(base64Audio);
          };

          // Stop all tracks
          stream.getTracks().forEach(track => track.stop());
        };

        // Start recording
        recorder.start();
        setMediaRecorder(recorder);
        setIsRecording(true);
        setTimerRunning(true);

        // Set timeout for automatic stop (60 seconds max)
        setTimeout(() => {
          if (recorder.state === "recording") {
            recorder.stop();
            setIsRecording(false);
            setTimerRunning(false);
          }
        }, 60000);
      } catch (error) {
        console.error("Error starting recording:", error);
      }
    }
  };

  // Handle audio transcription and get follow-up
  const handleAudioTranscription = async (audioBase64: string) => {
    try {
      setIsProcessing(true);
      // Transcribe the audio
      const transcription = await transcribeAudio.mutateAsync({
        audioBase64,
        fileType: "audio/webm",
      });

      if (transcription.success) {
        // Add candidate message
        const candidateMessage: SpeakingTestMessage = {
          role: "candidate",
          content: transcription.text || "I'm sorry, I couldn't hear what you said.",
          timestamp: new Date().toISOString(),
        };

        setMessages(prev => [...prev, candidateMessage]);

        // If we got a valid transcription, get a follow-up question
        if (transcription.text && transcription.text.length > 0) {
          await getFollowUpQuestion(transcription.text);
        } else {
          // Fallback for no speech detected
          const fallbackQuestion = "I didn't catch that. Could you please introduce yourself?";
          const examinerMessage: SpeakingTestMessage = {
            role: "examiner",
            content: fallbackQuestion,
            timestamp: new Date().toISOString(),
          };

          setMessages(prev => [...prev, examinerMessage]);
          await speakExaminerMessage(fallbackQuestion);
        }
      }
    } catch (error) {
      console.error("Error processing audio:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle when TTS audio finishes playing
  const handleAudioEnded = useCallback(() => {
    // Start recording automatically after examiner speaks
    if (messages.length > 0 && messages[messages.length - 1]?.role === "examiner") {
      // Slight delay to make it feel more natural
      setTimeout(() => {
        void toggleRecording();
      }, 500);
    }
  }, [messages]);

  // Get follow-up question based on candidate's response
  const getFollowUpQuestion = async (candidateResponse: string) => {
    try {
      setIsProcessing(true);
      const followUp = await getFollowUp.mutateAsync({
        candidateResponse,
        currentSection: "Introduction",
      });

      // Add examiner message with the follow-up question
      const examinerMessage: SpeakingTestMessage = {
        role: "examiner",
        content: followUp.question,
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, examinerMessage]);

      // Speak the follow-up question
      await speakExaminerMessage(followUp.question);
    } catch (error) {
      console.error("Error getting follow-up question:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle timer completion
  const handleTimeUp = () => {
    if (isRecording) {
      void toggleRecording();
    }
  };

  return (
    <main className="min-h-fit bg-white flex flex-col items-center">
      <AuroraText className="m-2 mt-0 sticky top-12 py-1 shadow bg-white w-full text-center z-20 text-2xl font-bold text-gray-900 select-none">
        اختبار المحادثة
      </AuroraText>

      {showOverlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white select-none rounded-lg p-8 shadow-lg max-w-md text-center">
            <h2 className="mb-6 text-2xl font-bold">اختبار المحادثة باللغة الإنجليزية</h2>
            <p className="mb-8 text-gray-600">
              سيقوم {env.NEXT_PUBLIC_APP_NAME} بتوجيه أسئلة لك باللغة الإنجليزية. يرجى الإجابة بشكل
              طبيعي كما في اختبار حقيقي.
            </p>
            <Button
              variant="pressable"
              size="lg"
              className="cursor-pointer font-black text-lg"
              onClick={handleStartTest}
            >
              إبدا الإختبار
            </Button>
          </div>
        </div>
      )}

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
            {messages.map((message, index) => (
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
            isRunning={timerRunning}
            onTimeUp={handleTimeUp}
            totalSeconds={10} // TODO: change to 60 after debugging is done
            mode={isRecording ? "recording" : "preparation"}
          />
          {/* <strong>المرحلة {sectionName}</strong> */}
          <strong>المرحلة الأولى</strong>
        </div>

        <div className="p-2 border-t border-t-gray-200">
          <div className="flex justify-center">
            <ButtonRecord
              isRecording={isRecording}
              onClick={toggleRecording}
              disabled={isProcessing || showOverlay}
              waves={false}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
