import clsx from "clsx";
import { Loader, Send, X } from "lucide-react";
import { MAX_MESSAGE_LENGTH } from "@/app/schemas/feedback-form";
import { FileUpload } from "@/components/custom/file-upload";
import { Button } from "@/components/ui/button";
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
import type { FeedbackFormValues } from "@/app/schemas/feedback-form";
import type { UseFormReturn } from "react-hook-form";

type FeedbackFormProps = {
  form: UseFormReturn<FeedbackFormValues>;
  files: Array<File>;
  setFiles: (files: Array<File>) => void;
  handleFilesSelected: (files: Array<File>) => void;
  onSubmit: (data: FeedbackFormValues) => Promise<void>;
  isPending: boolean;
};

export function FeedbackForm({
  form,
  files,
  setFiles,
  handleFilesSelected,
  onSubmit,
  isPending,
}: FeedbackFormProps) {
  return (
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
                  className="min-h-[120px] overflow-y-clip resize-none rtl leading-loose"
                  maxLength={MAX_MESSAGE_LENGTH}
                  minLength={10}
                  dir="auto"
                  onInput={e => {
                    const textarea = e.target as HTMLTextAreaElement;
                    textarea.style.height = "auto";
                    textarea.style.height = `${textarea.scrollHeight}px`;
                  }}
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
                  <FileUpload onFilesSelected={handleFilesSelected} disabled={isPending} />
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

        <Button type="submit" className="w-full" disabled={isPending}>
          <strong className="flex items-center gap-2">
            {isPending ? <Loader className="size-4 animate-spin" /> : <Send className="size-4" />}
            إرسال
          </strong>
        </Button>
      </form>
    </Form>
  );
}
