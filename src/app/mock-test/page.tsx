"use client";

import { AuroraText } from "@/components/magicui/aurora-text";
import { InteractiveGridPattern } from "@/components/magicui/interactive-grid-pattern";
import { cn } from "@/lib/utils";
import { SpeechChat } from "./speech-chat";

export default function MockTest() {
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

      <div className="w-full max-w-2xl text-right z-10 relative">
        <SpeechChat />

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
