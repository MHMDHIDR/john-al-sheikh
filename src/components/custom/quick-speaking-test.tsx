"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ButtonRecord } from "@/components/custom/button-record";
import { Timer } from "@/components/custom/timer";
import { useToast } from "@/hooks/use-toast";
import { MAX_RECORDING_TIME } from "@/lib/constants";
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

// Helper function to make sure we have valid audio data
function isValidAudio(data: string): boolean {
  const parts = data.split(",");
  return parts.length > 1 && typeof parts[1] === "string" && parts[1].length > 100;
}

// Constants for audio detection timeouts (in milliseconds)
const INITIAL_CHECK_DELAY = 3000; // Check for audio after 3 seconds
const MAX_SILENCE_DURATION = 10000; // Stop recording after 10 seconds of silence

export function SpeakTest() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [currentPrompt, setCurrentPrompt] = useState(prompts[0]);
  const router = useRouter();
  const { success, error, warning } = useToast();

  // References for timers and audio tracking
  const initialCheckTimerRef = useRef<NodeJS.Timeout | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastAudioTimestampRef = useRef<number>(0);
  const hasAudioBeenDetectedRef = useRef<boolean>(false);

  // tRPC mutations
  const transcribeAudioMutation = api.openai.transcribeAudio.useMutation();
  const analyzeIELTSSpeakingMutation = api.openai.analyzeIELTSSpeaking.useMutation();

  // Helper function to stop all timers
  const clearAllTimers = () => {
    if (initialCheckTimerRef.current) {
      clearTimeout(initialCheckTimerRef.current);
      initialCheckTimerRef.current = null;
    }
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  };

  // Helper function to stop recording
  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === "recording") {
      mediaRecorder.stop();
      setIsRecording(false);
      clearAllTimers();
    }
  };

  const handleToggleRecording = async () => {
    if (isRecording) {
      stopRecording();
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

        // Reset audio detection state
        hasAudioBeenDetectedRef.current = false;
        lastAudioTimestampRef.current = Date.now();

        // Setup audio analyzer to detect silence
        const audioContext = new AudioContext();
        const audioSource = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        audioSource.connect(analyser);

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        // Function to check if audio is being detected
        const checkAudioLevel = () => {
          analyser.getByteFrequencyData(dataArray);

          // Calculate average audio level
          let sum = 0;
          for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i]!; // Use non-null assertion
          }
          const average = sum / bufferLength;

          // If average is above threshold, audio is detected
          if (average > 5) {
            // Lower threshold for better detection
            hasAudioBeenDetectedRef.current = true;
            lastAudioTimestampRef.current = Date.now();
            console.log("Audio detected with level:", average.toFixed(2));
          }

          // Check if we've been silent for too long
          const timeSinceLastAudio = Date.now() - lastAudioTimestampRef.current;
          if (hasAudioBeenDetectedRef.current && timeSinceLastAudio > MAX_SILENCE_DURATION) {
            // Stop recording after silence duration reached
            console.log(
              "Stopping recording due to silence for",
              (timeSinceLastAudio / 1000).toFixed(1),
              "seconds",
            );
            success("توقف التسجيل بسبب الصمت لفترة طويلة");
            stopRecording();
            return;
          }

          // Continue checking as long as we're recording
          if (isRecording) {
            requestAnimationFrame(checkAudioLevel);
          }
        };

        // Ensure WebM audio format with good quality
        const recorder = new MediaRecorder(stream, {
          mimeType: "audio/webm;codecs=opus",
          audioBitsPerSecond: 128000,
        });

        // Request data every 1 second to ensure we're collecting chunks during recording
        const timeslice = 1000; // 1 second intervals

        setAudioChunks([]);

        // Create a local variable to collect chunks to avoid state timing issues
        const chunks: Blob[] = [];

        recorder.addEventListener("dataavailable", event => {
          if (event.data.size > 0) {
            // Add to local array and update state
            chunks.push(event.data);
            setAudioChunks(prev => [...prev, event.data]);
          }
        });

        recorder.addEventListener("stop", () => {
          void (async () => {
            // Stop the audio context
            audioContext.close().catch(console.error);

            // Clear all timers
            clearAllTimers();

            console.log("Chunks collected:", chunks.length);

            // Check both local chunks and state
            if (chunks.length === 0) {
              error("لم يتم تسجيل أي صوت");
              return;
            }

            try {
              setIsProcessing(true);
              success("جاري تحليل إجابتك...");

              // Use the local chunks array to avoid state timing issues
              const audioBlob = new Blob(chunks, { type: "audio/webm" });

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

        // Start recording
        recorder.start(timeslice); // Start with timeslice to get frequent data events
        setMediaRecorder(recorder);
        setIsRecording(true);

        // Debug MediaRecorder state
        console.log("MediaRecorder started with state:", recorder.state);

        // Add event listeners for MediaRecorder state changes
        recorder.addEventListener("start", () => console.log("MediaRecorder started"));
        recorder.addEventListener("pause", () => console.log("MediaRecorder paused"));
        recorder.addEventListener("resume", () => console.log("MediaRecorder resumed"));
        recorder.addEventListener("error", e => console.error("MediaRecorder error:", e));

        // Start audio level checking
        requestAnimationFrame(checkAudioLevel);

        // Setup early audio detection check after 3 seconds
        initialCheckTimerRef.current = setTimeout(() => {
          if (!hasAudioBeenDetectedRef.current && isRecording) {
            warning("يرجى التحدث بصوت أعلى أو التأكد من تشغيل الميكروفون");
          }
        }, INITIAL_CHECK_DELAY);

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
      clearAllTimers();
    }
  };

  // get random prompt from prompts array
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * prompts.length);
    setCurrentPrompt(prompts[randomIndex]);
  }, []);

  useEffect(() => {
    // this is a cleanup function to stop the recording when the component unmounts
    // to avoid memory leaks
    return () => {
      if (mediaRecorder && isRecording) {
        mediaRecorder.stop();
      }
      clearAllTimers();
    };
  }, [mediaRecorder, isRecording]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-white p-8">
      <div className="w-full max-w-2xl space-y-8 text-right">
        <div className="text-center">
          <h1 className="mb-4 text-4xl font-bold text-gray-900">اختبار المحادثة IELTS</h1>
          <p className="mb-2 text-xl text-gray-600">{currentPrompt}</p>
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

          <div className="my-10 flex justify-center">
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
            <label className="block text-gray-500" htmlFor="recording-button">
              إضغط لبدأ المحادثة
            </label>
          )}
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
