"use client";

import { MessageSquare } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { FeedbackForm } from "@/components/custom/feedback-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useFeedbackForm } from "@/hooks/use-feedback-form";

export function FeedbackButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const pathname = usePathname();
  const { form, files, setFiles, handleFilesSelected, onSubmit, feedbackMutation } =
    useFeedbackForm();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return !isMounted || pathname?.includes("/admin") ? null : (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="flex select-none max-sm:scale-70 items-center gap-2 fixed max-sm:bottom-32 bottom-10 -rotate-90 max-sm:-right-1 max-sm:size-20 max-sm:rounded-full -right-11 z-50 shadow-lg animate-feedback-aurora max-sm:opacity-45 opacity-75"
      >
        <strong className="hidden sm:flex">Feedback</strong>
        <MessageSquare className="max-sm:size-12! max-sm:rotate-90 size-6" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-h-[90vh] select-none overflow-y-auto max-w-sm rounded-md sm:max-w-[500px] data-[state=open]:slide-in-from-bottom-full! data-[state=closed]:slide-out-to-bottom-full!">
          <DialogHeader>
            <DialogTitle className="text-xs hidden" hidden />
            <DialogDescription className="text-balance">
              للإستفسارات، المقترحات، الأفكار التطويرية، أو التبليغ عن الأخطاء، (المشاكل التقنية)
              سنكون سعداء بمساعدتك
            </DialogDescription>
          </DialogHeader>

          <FeedbackForm
            form={form}
            files={files}
            setFiles={setFiles}
            handleFilesSelected={handleFilesSelected}
            onSubmit={onSubmit}
            isPending={feedbackMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
