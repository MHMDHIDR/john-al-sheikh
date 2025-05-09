"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import clsx from "clsx";
import { Loader, MessageSquare, Send, X } from "lucide-react";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { feedbackFormSchema, MAX_FILE_SIZE, MAX_MESSAGE_LENGTH } from "@/app/schemas/feedback-form";
import { FileUpload } from "@/components/custom/file-upload";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { env } from "@/env";
import { useToast } from "@/hooks/use-toast";
import { convertImageToBase64 } from "@/lib/convert-image-base64";
import { api } from "@/trpc/react";
import type { FeedbackFormValues } from "@/app/schemas/feedback-form";

export function FeedbackButton() {
  const { data: session } = useSession();
  const user = session?.user;

  const [isOpen, setIsOpen] = useState(false);
  const [files, setFiles] = useState<Array<File>>([]);

  const toast = useToast();

  const form = useForm<FeedbackFormValues>({
    resolver: zodResolver(feedbackFormSchema),
    defaultValues: {
      name: user?.name ?? "",
      email: user?.email ?? "",
      subject: "",
      message: "",
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        name: user.name ?? "",
        email: user.email ?? "",
      });
    }
  }, [user, form]);

  const feedbackMutation = api.feedback.submit.useMutation({
    onSuccess: () => {
      toast.success(`${env.NEXT_PUBLIC_APP_NAME} يشكرك على الرسالة 🤍`);
      form.reset();
      setFiles([]);
      setIsOpen(false);
    },
    onError: error => {
      alert(JSON.stringify(error));
      toast.error(
        error.message || "عفواً حدث خطأ عند محاولة إرسال الرسالة. يرجى المحاولة مرة أخرى.",
      );
    },
  });

  const handleFilesSelected = (selectedFiles: Array<File>) => {
    if (selectedFiles[0] && selectedFiles[0].size > MAX_FILE_SIZE) {
      toast.error("المرفق يجب أن يكون أصغر من 5MB");
      return;
    }
    setFiles(selectedFiles);
  };

  const onSubmit = async (data: FeedbackFormValues) => {
    try {
      let attachmentData = undefined;

      // Convert file to base64 if there's a file
      if (files.length > 0 && files[0]) {
        const result = await convertImageToBase64(files[0]);
        if (result?.base64) {
          // Find the comma to separate the data URL prefix
          const base64String = result.base64;
          const commaIndex = base64String.indexOf(",");

          // Extract the base64 part (everything after the comma)
          const base64Data =
            commaIndex !== -1 ? base64String.substring(commaIndex + 1) : base64String;

          attachmentData = {
            name: files[0].name,
            type: files[0].type,
            size: files[0].size,
            base64: base64Data,
          };
        }
      }

      // Submit the form with attachment data
      feedbackMutation.mutate({
        ...data,
        attachment: attachmentData,
      });
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast.error("حدث خطأ أثناء إرسال الملاحظات");
    }
  };

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
            <DialogTitle className="text-xl" hidden></DialogTitle>
            <DialogDescription className="text-center">
              إذا كان لديك أي إستفسار أو مقترحات، يرجى إدخالها هنا
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الاسم</FormLabel>
                    <FormControl>
                      <Input placeholder="ادخل اسمك" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>البريد الإلكتروني</FormLabel>
                    <FormControl>
                      <Input placeholder="ادخل بريدك الإلكتروني" type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الموضوع</FormLabel>
                    <FormControl>
                      <Input placeholder="ادخل الموضوع" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      الرسالة{" "}
                      <span
                        className={clsx("text-xs font-black text-muted-foreground", {
                          "text-red-500": field.value?.length >= MAX_MESSAGE_LENGTH / 1.1,
                        })}
                      >
                        {field.value?.length} / {MAX_MESSAGE_LENGTH}
                      </span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="ادخل رسالتك"
                        className="min-h-[120px] resize-none rtl"
                        maxLength={MAX_MESSAGE_LENGTH}
                        minLength={10}
                        dir="auto"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="attachment"
                render={() => (
                  <FormItem>
                    <FormLabel>المرفق (اختياري)</FormLabel>
                    <FormControl>
                      <div className="space-y-2">
                        <FileUpload
                          onFilesSelected={handleFilesSelected}
                          disabled={feedbackMutation.isPending}
                        />
                        {files.length > 0 && (
                          <div className="flex items-center justify-between p-2 bg-accent rounded">
                            <span className="text-sm truncate max-w-[80%]">{files[0]?.name}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => setFiles([])}
                              type="button"
                            >
                              <X className="size-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={feedbackMutation.isPending}>
                <strong className="flex items-center gap-2">
                  {feedbackMutation.isPending ? (
                    <Loader className="size-4 animate-spin" />
                  ) : (
                    <Send className="size-4" />
                  )}
                  إرسال
                </strong>
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
