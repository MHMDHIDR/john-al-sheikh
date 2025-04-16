"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ButtonRecord } from "@/components/custom/button-record";
import { Timer } from "@/components/custom/timer";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/trpc/react";

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

// Max recording time in seconds
const MAX_RECORDING_TIME = 60;

// Helper function to make sure we have valid audio data
function isValidAudio(data: string): boolean {
  const parts = data.split(",");
  return parts.length > 1 && typeof parts[1] === "string" && parts[1].length > 100;
}

export function SpeakTest() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [currentPrompt, setCurrentPrompt] = useState(prompts[0]);
  const router = useRouter();
  const { success, error } = useToast();

  // tRPC mutations
  const transcribeAudioMutation = api.openai.transcribeAudio.useMutation();
  const analyzeIELTSSpeakingMutation = api.openai.analyzeIELTSSpeaking.useMutation();

  const handleToggleRecording = async () => {
    if (isRecording) {
      mediaRecorder?.stop();
      setIsRecording(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

        // Ensure WebM audio format with good quality
        const recorder = new MediaRecorder(stream, {
          mimeType: "audio/webm;codecs=opus",
          audioBitsPerSecond: 128000,
        });

        setAudioChunks([]);

        recorder.addEventListener("dataavailable", event => {
          if (event.data.size > 0) {
            setAudioChunks(chunks => [...chunks, event.data]);
          }
        });

        recorder.addEventListener("stop", () => {
          void (async () => {
            if (audioChunks.length === 0) {
              error("لم يتم تسجيل أي صوت");
              return;
            }

            try {
              setIsProcessing(true);
              success("جاري تحليل إجابتك...");

              // Combine audio chunks into a single blob
              const audioBlob = new Blob(audioChunks, { type: "audio/webm" });

              // Check audio duration and size
              if (audioBlob.size < 1000) {
                error("التسجيل الصوتي قصير جداً");
                setIsProcessing(false);
                return;
              }

              console.log("Audio size:", audioBlob.size, "bytes");

              // Convert blob to base64
              const reader = new FileReader();
              reader.readAsDataURL(audioBlob);

              reader.onloadend = async () => {
                try {
                  const base64Audio = reader.result as string;

                  if (!isValidAudio(base64Audio)) {
                    error("التسجيل الصوتي غير صالح");
                    setIsProcessing(false);
                    return;
                  }

                  // Transcribe audio using tRPC endpoint
                  const transcriptionResult = await transcribeAudioMutation.mutateAsync({
                    audioBase64: base64Audio,
                    fileType: "audio/webm",
                  });

                  // If transcription failed, show the error message
                  if (!transcriptionResult.success) {
                    error("فشل في تحويل الصوت إلى نص");
                    setIsProcessing(false);
                    return;
                  }

                  const transcribedText = transcriptionResult.text;

                  if (!transcribedText || transcribedText.trim() === "") {
                    error("لم يتم التعرف على أي كلام في التسجيل");
                    setIsProcessing(false);
                    return;
                  }

                  // Get the current prompt for analysis - ensure it's always a string
                  const defaultPrompt = "تحدث عن أي موضوع تختاره"; // Fallback prompt
                  const promptForAnalysis = currentPrompt ?? prompts[0] ?? defaultPrompt;

                  console.log("Transcription==>", transcribedText);

                  // Analyze transcription using tRPC endpoint
                  const analysisResult = await analyzeIELTSSpeakingMutation.mutateAsync({
                    transcription: transcribedText,
                    prompt: promptForAnalysis,
                  });

                  if (!analysisResult.success || !analysisResult.feedback) {
                    error("فشل في تحليل الإجابة");
                    setIsProcessing(false);
                    return;
                  }

                  const { feedback } = analysisResult;

                  // Store results in sessionStorage to access on results page
                  sessionStorage.setItem(
                    "ieltsResult",
                    JSON.stringify({
                      band: feedback.band,
                      strengths: feedback.strengths,
                      areasToImprove: feedback.areasToImprove,
                      improvementTips: feedback.improvementTips,
                      transcription: transcribedText,
                      prompt: promptForAnalysis,
                    }),
                  );

                  // Navigate to results page
                  router.push("/results");
                } catch (fileErr) {
                  console.error("Error processing file:", fileErr);
                  error(fileErr instanceof Error ? fileErr.message : "حدث خطأ أثناء معالجة الملف");
                  setIsProcessing(false);
                }
              };

              reader.onerror = () => {
                error("فشل في قراءة الملف الصوتي");
                setIsProcessing(false);
              };
            } catch (err) {
              console.error("Error processing audio:", err);
              error(err instanceof Error ? err.message : "حدث خطأ أثناء معالجة التسجيل");
              setIsProcessing(false);
            }
          })();
        });

        // Start recording with a timeout to automatically stop after MAX_RECORDING_TIME
        recorder.start();
        setMediaRecorder(recorder);
        setIsRecording(true);

        // Auto-stop recording after MAX_RECORDING_TIME
        setTimeout(() => {
          if (recorder.state === "recording") {
            recorder.stop();
            setIsRecording(false);
            success("انتهى التسجيل");
          }
        }, MAX_RECORDING_TIME * 1000);
      } catch (err) {
        console.error("Error accessing microphone:", err);
        error("لا يمكن الوصول إلى الميكروفون");
      }
    }
  };

  const handleTimeUp = () => {
    if (isRecording && mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
      success("انتهى التسجيل");
    }
  };

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * prompts.length);
    setCurrentPrompt(prompts[randomIndex]);
  }, []);

  useEffect(() => {
    return () => {
      if (mediaRecorder && isRecording) {
        mediaRecorder.stop();
      }
    };
  }, [mediaRecorder, isRecording]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-white p-8">
      <div className="w-full max-w-2xl space-y-8 text-right">
        <div className="text-center">
          <h1 className="mb-4 text-4xl font-bold text-gray-900">اختبار المحادثة IELTS</h1>
          <p className="mb-2 text-xl text-gray-600">{currentPrompt}</p>
          <p className="mb-8 text-gray-500">
            يجب أن تتحدث لمدة {MAX_RECORDING_TIME} ثانية. سيكون لديك 5 ثوانٍ للتحضير.
          </p>

          {isRecording && (
            <div className="my-8 flex flex-col items-center">
              <Timer
                isRunning={isRecording}
                onTimeUp={handleTimeUp}
                totalSeconds={MAX_RECORDING_TIME}
              />
              <p className="mt-2 font-medium text-red-600">جاري التسجيل...</p>
            </div>
          )}

          {isProcessing && (
            <div className="my-8 flex flex-col items-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-gray-400 border-t-primary"></div>
              <p className="mt-2 font-medium text-gray-600">جاري تحليل إجابتك...</p>
            </div>
          )}

          <div className="mt-8 flex justify-center">
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

          <p className="mt-6 text-gray-500">
            {isRecording
              ? "انقر لإيقاف التسجيل"
              : isProcessing
                ? "جاري تحليل إجابتك..."
                : "إضغط لبدأ المحادثة"}
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-gray-50 p-6">
          <h3 className="mb-2 text-lg font-medium text-gray-900">التعليمات:</h3>
          <ul className="list-disc space-y-2 text-gray-600">
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
