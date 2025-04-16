"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ButtonRecord } from "@/components/custom/button-record";
import { Timer } from "@/components/custom/timer";
import { useToast } from "@/hooks/use-toast";

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

export function SpeakTest() {
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  // const [_audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [currentPrompt, setCurrentPrompt] = useState(prompts[0]);
  const router = useRouter();
  const { success, error } = useToast();

  const handleToggleRecording = async () => {
    if (isRecording) {
      mediaRecorder?.stop();
      setIsRecording(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        const recorder = new MediaRecorder(stream);

        // setAudioChunks([]);

        recorder.addEventListener("dataavailable", _event => {
          // if (event.data.size > 0) {
          //   setAudioChunks(chunks => [...chunks, event.data]);
          // }
        });

        recorder.addEventListener("stop", () => {
          setTimeout(() => {
            router.push("/results");
          }, 1000);
        });

        recorder.start();
        setMediaRecorder(recorder);
        setIsRecording(true);
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
            يجب أن تتحدث لمدة دقيقة واحدة. سيكون لديك 5 ثوانٍ للتحضير.
          </p>

          {isRecording && (
            <div className="my-8 flex flex-col items-center">
              <Timer isRunning={isRecording} onTimeUp={handleTimeUp} totalSeconds={60} />
              <p className="mt-2 font-medium text-red-600">جاري التسجيل...</p>
            </div>
          )}

          <div className="mt-8 flex justify-center">
            <ButtonRecord isRecording={isRecording} onClick={handleToggleRecording} />
          </div>

          <p className="mt-6 text-gray-500">
            {isRecording ? "انقر لإيقاف التسجيل" : "إضغط لبدأ المحادثة"}
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
