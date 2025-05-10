import { zodResolver } from "@hookform/resolvers/zod";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { feedbackFormSchema, MAX_FILE_SIZE } from "@/app/schemas/feedback-form";
import { env } from "@/env";
import { useToast } from "@/hooks/use-toast";
import { convertImageToBase64 } from "@/lib/convert-image-base64";
import { api } from "@/trpc/react";
import type { FeedbackFormValues } from "@/app/schemas/feedback-form";

export function useFeedbackForm() {
  const { data: session } = useSession();
  const user = session?.user;
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
      form.reset({ name: user.name ?? "", email: user.email ?? "" });
    }
  }, [user, form]);

  const feedbackMutation = api.feedback.submit.useMutation({
    onSuccess: () => {
      toast.success(`${env.NEXT_PUBLIC_APP_NAME} يشكرك على الرسالة 🤍`);
      form.reset();
      setFiles([]);
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

      if (files.length > 0 && files[0]) {
        const result = await convertImageToBase64(files[0]);
        if (result?.base64) {
          const base64String = result.base64;
          const commaIndex = base64String.indexOf(",");
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

      feedbackMutation.mutate({
        ...data,
        attachment: attachmentData,
      });
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast.error("حدث خطأ أثناء إرسال الملاحظات");
    }
  };

  return {
    form,
    files,
    setFiles,
    handleFilesSelected,
    onSubmit,
    feedbackMutation,
  };
}
