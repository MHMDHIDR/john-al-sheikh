"use client";

import { MessageSquare } from "lucide-react";
import { useState } from "react";
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
  const { form, files, setFiles, handleFilesSelected, onSubmit, feedbackMutation } =
    useFeedbackForm();

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 fixed bottom-6 right-6 z-50 shadow-lg animate-feedback-aurora opacity-75"
      >
        <strong>Feedback</strong>
        <MessageSquare className="size-6" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-h-[90vh] select-none overflow-y-auto max-w-sm rounded-md sm:max-w-[500px] data-[state=open]:slide-in-from-bottom-full! data-[state=closed]:slide-out-to-bottom-full!">
          <DialogHeader>
            <DialogTitle className="text-xs hidden" hidden />
            <DialogDescription className="text-center">
              إذا كان لديك أي إستفسار أو مقترحات، يرجى إدخالها هنا
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
