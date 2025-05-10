"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { FeedbackForm } from "@/components/custom/feedback-form";
import { env } from "@/env";
import { useFeedbackForm } from "@/hooks/use-feedback-form";

export default function Contact() {
  const { form, files, setFiles, handleFilesSelected, onSubmit, feedbackMutation } =
    useFeedbackForm();

  return (
    <div className="container mx-auto px-4 py-8 mb-20 max-w-[800px]" dir="rtl">
      <Link
        href="/"
        className="flex items-center justify-start gap-2 text-lg hover:underline underline-offset-6"
      >
        <ArrowRight />
        العودة للرئيسية
      </Link>

      <h1 className="text-center text-2xl font-bold my-6">تواصل معنا</h1>

      <p className="mb-2">
        في <strong>{env.NEXT_PUBLIC_APP_NAME}</strong> نؤمن بالفكرة، وأننا على استعداد لتقديم أفضل
        خدمة ممكنة لك. يرجى استخدام النموذج التالي للتواصل معنا:
      </p>

      <div className="mt-8">
        <FeedbackForm
          form={form}
          files={files}
          setFiles={setFiles}
          handleFilesSelected={handleFilesSelected}
          onSubmit={onSubmit}
          isPending={feedbackMutation.isPending}
        />
      </div>
    </div>
  );
}
