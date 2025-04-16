"use client";

import Link from "next/link";
import { FeedbackSection } from "@/components/custom/feedback-section";
import { Button } from "@/components/ui/button";

export default function ResultsPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-white p-8">
      <div className="w-full max-w-2xl space-y-8 text-right">
        <div className="text-center">
          <h1 className="mb-4 text-6xl font-bold text-gray-900">6.5</h1>
          <p className="mb-8 text-2xl text-gray-600">نطاق IELTS الخاص بك</p>
        </div>

        <FeedbackSection title="نقاط القوة">
          <p className="mb-4">
            لقد أظهرت فهمًا جيدًا للموضوع واستخدمت مجموعة متنوعة من المفردات. كانت إجابتك منظمة بشكل
            جيد مع مقدمة وخاتمة واضحة.
          </p>
          <ul className="list-disc space-y-2">
            <li>استخدام جيد للكلمات الانتقالية</li>
            <li>تنوع في التراكيب النحوية</li>
            <li>أمثلة واضحة تدعم وجهة نظرك</li>
          </ul>
        </FeedbackSection>

        <FeedbackSection title="مجالات التحسين">
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-red-600">✗ استخدام غير صحيح للزمن الماضي</p>
              <p className="text-green-600">✓ يجب استخدام الماضي البسيط بدلاً من الماضي المستمر</p>
            </div>
            <div>
              <p className="mb-2 text-red-600">✗ تكرار بعض الكلمات الأساسية</p>
              <p className="text-green-600">✓ حاول استخدام مرادفات لتجنب التكرار</p>
            </div>
          </div>
        </FeedbackSection>

        <FeedbackSection title="نصائح للتحسين">
          <ul className="list-disc space-y-2">
            <li>تدرب على استخدام مجموعة أوسع من المفردات المتقدمة</li>
            <li>ركز على تحسين نطق الكلمات الصعبة</li>
            <li>استخدم المزيد من التعابير الاصطلاحية</li>
            <li>تدرب على تنظيم أفكارك بشكل أسرع</li>
          </ul>
        </FeedbackSection>

        <div className="mt-8 text-center">
          <Button asChild variant="pressable">
            <Link href="/signin">سجل للحصول على المزيد من الاختبارات</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
