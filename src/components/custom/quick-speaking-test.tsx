"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ButtonRecord } from "@/components/custom/button-record";
import { Timer } from "@/components/custom/timer";
import { InteractiveGridPattern } from "@/components/magicui/interactive-grid-pattern";
import { useToast } from "@/hooks/use-toast";
import { isActualEnglishSpeech } from "@/lib/check-is-actual-english-speech";
import { MAX_RECORDING_TIME } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";
import { AuroraText } from "../magicui/aurora-text";

const prompts = [
  "صِف وقتاً ساعدت فيه شخصاً ما.",
  "تحدث عن هواية تستمتع بها.",
  "صِف مكاناً زرته وأعجبك كثيراً.",
  "تحدث عن شخص له تأثير إيجابي في حياتك.",
  "صِف عملاً تطوعياً قمت به.",
  "تحدث عن إنجاز تفتخر به.",
  "صِف أحد التقاليد المهمة في ثقافتك.",
  "تحدث عن تجربة تعلمت منها درساً قيماً.",
  "صِف كتاباً أو فيلماً أثر فيك.",
  "تحدث عن تغيير مهم حدث في حياتك.",
];

// Constants for timeouts (in milliseconds)
const INITIAL_CHECK_DELAY = 3000; // Check for English at 3 seconds
const FINAL_CHECK_DELAY = 10000; // Final check at 10 seconds

export function SpeakTest() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState(prompts[0]);

  const audioChunks = useRef<Blob[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const router = useRouter();
  const { success, error: errorToast, warning } = useToast();
  const transcribeAudioMutation = api.openai.transcribeAudio.useMutation();
  const analyzeIELTSSpeakingMutation = api.openai.analyzeIELTSSpeaking.useMutation();

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

  // Check for English speech in audio
  const checkForEnglishSpeech = async (): Promise<{
    hasEnglish: boolean;
    transcription?: string;
  }> => {
    if (audioChunks.current.length === 0) return { hasEnglish: false };

    try {
      const audioBlob = new Blob(audioChunks.current, { type: "audio/webm" });
      if (audioBlob.size < 1000) return { hasEnglish: false };

      const reader = new FileReader();
      const base64Audio = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(audioBlob);
      });

      const transcriptionResult = await transcribeAudioMutation.mutateAsync({
        audioBase64: base64Audio,
        fileType: "audio/webm",
      });

      if (!transcriptionResult.success || !transcriptionResult.text) {
        return { hasEnglish: false };
      }

      const { isValid, cleanText } = isActualEnglishSpeech(transcriptionResult.text);

      return {
        hasEnglish: isValid,
        transcription: isValid ? cleanText : undefined,
      };
    } catch (error) {
      console.error(error);
      return { hasEnglish: false };
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
            // Store audio chunks before clearing resources
            const finalAudioChunks = [...audioChunks.current];

            // Clear resources and update state
            clearResources();
            setIsRecording(false);

            if (finalAudioChunks.length === 0) {
              errorToast("لم يتم تسجيل أي كلام");
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

              const transcriptionResult = await transcribeAudioMutation.mutateAsync({
                audioBase64: base64Audio,
                fileType: "audio/webm",
              });

              if (!transcriptionResult.success || !transcriptionResult.text) {
                // console.warn("لم يتم اكتشاف كلام باللغة الإنجليزية");
                setIsProcessing(false);
                return;
              }

              const { isValid, cleanText } = isActualEnglishSpeech(transcriptionResult.text);
              if (!isValid) {
                errorToast("لم يتم اكتشاف كلام باللغة الإنجليزية");
                setIsProcessing(false);
                return;
              }

              // If we have English speech, analyze it
              const analysisResult = await analyzeIELTSSpeakingMutation.mutateAsync({
                transcription: cleanText,
                prompt: currentPrompt ?? "صِف وقتاً ساعدت فيه شخصاً ما.",
              });

              if (!analysisResult.success) {
                errorToast(analysisResult.error ?? "فشل في تحليل الإجابة");
                setIsProcessing(false);
                return;
              }

              if (!analysisResult.feedback) {
                errorToast("فشل في تحليل الإجابة");
                setIsProcessing(false);
                return;
              }

              // Store results and navigate
              sessionStorage.setItem(
                "ieltsResult",
                JSON.stringify({
                  band: analysisResult.feedback.band,
                  strengths: analysisResult.feedback.strengths,
                  areasToImprove: analysisResult.feedback.areasToImprove,
                  improvementTips: analysisResult.feedback.improvementTips,
                  transcription: transcriptionResult.text,
                  prompt: currentPrompt,
                }),
              );

              router.replace("/results");
            } catch (err) {
              console.error(err);
              errorToast("حدث خطأ أثناء معالجة التسجيل");
              setIsProcessing(false);
            }
          })();
        });

        // Check for English at 3 seconds
        const initialCheckTimeout = setTimeout(() => {
          void (async () => {
            if (recorder.state === "recording") {
              const { hasEnglish } = await checkForEnglishSpeech();
              if (!hasEnglish) {
                warning("يرجى التحدث بصوت أعلى وباللغة الإنجليزية");
              }
            }
          })();
        }, INITIAL_CHECK_DELAY);
        timeoutsRef.current.push(initialCheckTimeout);

        // Check for English at 10 seconds and STOP if no English detected
        const finalCheckTimeout = setTimeout(() => {
          void (async () => {
            if (recorder.state === "recording") {
              const { hasEnglish } = await checkForEnglishSpeech();
              if (!hasEnglish) {
                recorder.stop();
                errorToast("توقف التسجيل - لم يتم اكتشاف كلام باللغة الإنجليزية");
              }
            }
          })();
        }, FINAL_CHECK_DELAY);

        timeoutsRef.current.push(finalCheckTimeout);

        // Auto-stop at MAX_RECORDING_TIME
        const maxTimeTimeout = setTimeout(() => {
          if (recorder.state === "recording") {
            recorder.stop();
            success("انتهى التسجيل");
          }
        }, MAX_RECORDING_TIME * 1000);
        timeoutsRef.current.push(maxTimeTimeout);

        recorder.start(500);
      } catch (err) {
        errorToast("لا يمكن الوصول إلى الميكروفون");
        clearResources();
        setIsRecording(false);
        console.error(err);
      }
    }
  };

  // Timer complete handler
  const handleTimeUp = () => {
    if (isRecording && mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      success("انتهى التسجيل");
    }
  };

  // Initialize with random prompt
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * prompts.length);
    setCurrentPrompt(prompts[randomIndex]);

    return () => {
      clearResources();
    };
  }, []);

  return (
    <main className="relative select-none flex min-h-screen flex-col items-center justify-center bg-white p-4 overflow-hidden">
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
          <h1 className="mb-5 text-2xl font-bold text-gray-900">
            اختبار المحادثة
            <span className="text-black mx-2">IELTS</span>
          </h1>
          <p className="mb-2 font-black text-3xl text-blue-600">
            <AuroraText className="mx-2">
              <span className="font-normal mx-2">موضوع المحادثة</span>&quot;{currentPrompt}&quot;
            </AuroraText>
          </p>
          <p className="mb-8 text-gray-500">يجب أن تتحدث لمدة {MAX_RECORDING_TIME} ثانية. </p>

          {isRecording && (
            <div className="my-6 flex flex-col items-center">
              <Timer
                isRunning={isRecording}
                onTimeUp={handleTimeUp}
                totalSeconds={MAX_RECORDING_TIME}
              />
            </div>
          )}

          {isProcessing && (
            <div className="my-8 flex flex-col items-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-gray-400 border-t-primary"></div>
              <p className="mt-2 font-medium text-gray-600">جاري تحليل إجابتك...</p>
            </div>
          )}

          <div className="my-5 flex justify-center">
            <ButtonRecord
              isRecording={isRecording}
              onClick={handleToggleRecording}
              disabled={
                isProcessing ||
                transcribeAudioMutation.isPending ||
                analyzeIELTSSpeakingMutation.isPending
              }
            />
          </div>

          {!isRecording && !isProcessing && (
            <label className="block text-gray-500 cursor-pointer" htmlFor="recording-button">
              إضغط لبدأ المحادثة
            </label>
          )}
        </div>

        <div className="rounded-xl border border-white/20 bg-white/10 backdrop-blur-md py-4 px-8 shadow-md ring-1 ring-white/30">
          <h3 className="mb-2 text-lg font-medium text-gray-900 drop-shadow-sm">التعليمات:</h3>
          <ul className="list-disc space-y-2 text-gray-700 drop-shadow-sm">
            <li>تحدث بوضوح في الميكروفون</li>
            <li>حاول استخدام مجموعة متنوعة من المفردات والتراكيب النحوية</li>
            <li>قم بهيكلة إجابتك مع مقدمة وصلب الموضوع وخاتمة</li>
            <li>استخدم أمثلة محددة لدعم إجابتك</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
