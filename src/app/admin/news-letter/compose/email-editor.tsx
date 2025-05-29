"use client";

import { Color } from "@tiptap/extension-color";
import { FontSize } from "@tiptap/extension-font-size";
import { Highlight } from "@tiptap/extension-highlight";
import { Image as TipTapImage } from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { ListItem } from "@tiptap/extension-list-item";
import { TextAlign } from "@tiptap/extension-text-align";
import TextStyle from "@tiptap/extension-text-style";
import { Underline } from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { EditorMenu } from "@/components/custom/editor-menu";
import { EmailPreview } from "@/components/custom/email-preview";
import { Button } from "@/components/ui/button";
import { env } from "@/env";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/trpc/react";

type EmailEditorProps = {
  emailList: Array<{ email: string; name: string }>;
};

export function EmailEditor({ emailList }: EmailEditorProps) {
  const [isPreview, setIsPreview] = useState(false);
  const [subject, setSubject] = useState("");
  const { success, error: errorToast } = useToast();

  const sendNewsletter = api.subscribedEmails.sendNewsletter.useMutation({
    onSuccess: () => {
      success("تم إرسال النشرة البريدية بنجاح");
      setIsPreview(false);
    },
    onError: error => {
      errorToast(error.message);
    },
  });

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Configure existing extensions
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      // Text styling extensions
      TextStyle,
      Color.configure({ types: [TextStyle.name, ListItem.name] }),
      Highlight.configure({
        multicolor: true,
        HTMLAttributes: {
          class: "highlight",
        },
      }),
      Underline,
      FontSize.configure({ types: [TextStyle.name, ListItem.name] }),

      // Text alignment
      TextAlign.configure({
        types: ["heading", "paragraph"],
        alignments: ["left", "center", "right", "justify"],
        defaultAlignment: "right", // Default for RTL content
      }),

      // Image handling with better configuration
      TipTapImage.configure({
        inline: false,
        allowBase64: true,
        HTMLAttributes: {
          class: "max-w-full h-auto rounded-md block",
          style: "max-height: 400px; object-fit: contain;",
        },
      }),

      // Link configuration
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-blue-600 underline hover:text-blue-800",
        },
      }),

      // List item configuration
      ListItem,
    ],
    content: `
      <h2>مرحباً بكم في نشرتنا البريدية</h2>
      <p>ابدأ بكتابة محتوى نشرتك البريدية هنا...</p>
    `,
    editorProps: {
      attributes: {
        class:
          "prose prose-lg max-w-none rtl py-4 px-6 leading-relaxed focus:outline-none min-h-[400px] bg-white prose-headings:text-gray-900 prose-headings:font-bold prose-p:text-gray-700 prose-p:leading-relaxed prose-strong:text-gray-900 prose-strong:font-bold prose-em:text-gray-700 prose-em:italic prose-code:bg-gray-100 prose-code:px-1 prose-code:rounded prose-blockquote:border-r-4 prose-blockquote:border-blue-500 prose-blockquote:pl-4 prose-blockquote:italic prose-ul:list-disc prose-ol:list-decimal prose-li:text-gray-700",
      },
    },
    immediatelyRender: false,
    onCreate: ({ editor }) => {
      // Set default text alignment for RTL content
      editor.commands.setTextAlign("right");
    },
  });

  const handleSend = async () => {
    if (!editor || !subject.trim()) {
      errorToast("يرجى إدخال عنوان النشرة البريدية");
      return;
    }

    const content = editor.getHTML();
    if (!content.trim() || content === "<p></p>") {
      errorToast("يرجى إدخال محتوى النشرة البريدية");
      return;
    }

    try {
      await sendNewsletter.mutateAsync({
        subject: subject.trim(),
        content,
        recipients: emailList,
      });

      // Reset form after successful send
      setSubject("");
      editor.commands.clearContent();
    } catch (error) {
      console.error("Error sending newsletter:", error);
    }
  };

  const SUBJECT_MIN_LENGTH = 5;
  const SUBJECT_MAX_LENGTH = 100;

  const previewContent = editor?.getHTML() ?? "";
  const isFormValid =
    subject.trim().length > SUBJECT_MIN_LENGTH &&
    subject.trim().length < SUBJECT_MAX_LENGTH &&
    editor?.getText().trim();

  if (!editor) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 rtl">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex-1 w-full">
          <label htmlFor="newsletter-subject" className="block text-sm font-medium mb-2">
            عنوان النشرة البريدية
          </label>
          <input
            id="newsletter-subject"
            type="text"
            placeholder="أدخل عنوان جذاب للنشرة البريدية..."
            value={subject}
            onChange={e => setSubject(e.target.value)}
            className="w-full rounded-lg rtl border border-input bg-background px-4 py-3 text-sm
                     ring-offset-background placeholder:text-muted-foreground
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
                     focus-visible:ring-offset-2 transition-colors"
            minLength={SUBJECT_MIN_LENGTH}
            maxLength={SUBJECT_MAX_LENGTH}
          />
          <p className="text-xs text-muted-foreground mt-1">
            {subject.length}/{SUBJECT_MAX_LENGTH} حرف
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setIsPreview(!isPreview)}
            variant={isPreview ? "destructive" : "outline"}
            className="min-w-[120px]"
          >
            {isPreview ? "العودة للتحرير" : "معاينة"}
          </Button>

          {!isPreview && (
            <Button
              onClick={handleSend}
              disabled={sendNewsletter.isPending || !isFormValid}
              variant="default"
              className="min-w-[120px]"
            >
              {sendNewsletter.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2" />
                  جاري الإرسال...
                </>
              ) : (
                "إرسال النشرة"
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Recipients Info */}
      <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground">
        سيتم إرسال النشرة إلى {emailList.length} مشترك
      </div>

      {/* Editor or Preview */}
      {isPreview ? (
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="mb-4 pb-4 border-b">
            <h3 className="text-lg font-semibold">معاينة النشرة البريدية</h3>
            <p className="text-sm text-muted-foreground">العنوان: {subject || "بدون عنوان"}</p>
          </div>
          <EmailPreview
            name="عزيزي المشترك"
            signupUrl={`${env.NEXT_PUBLIC_APP_URL}/signin`}
            ctaButtonLabel="زيارة المنصة"
            customContent={previewContent}
          />
        </div>
      ) : (
        <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
          <EditorMenu editor={editor} />
          <div className="min-h-[400px]">
            <EditorContent editor={editor} />
          </div>
        </div>
      )}

      {/* Footer Tips */}
      {!isPreview && (
        <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4 text-sm">
          <h4 className="font-medium mb-2">نصائح لكتابة نشرة بريدية فعالة:</h4>
          <ul className="space-y-1 text-muted-foreground">
            <li>• استخدم عنواناً جذاباً ومختصراً</li>
            <li>• اجعل المحتوى مفيداً وذا قيمة للقارئ</li>
            <li>• استخدم الصور لجعل النشرة أكثر جاذبية</li>
            <li>• اجعل النص سهل القراءة باستخدام فقرات قصيرة</li>
          </ul>
        </div>
      )}
    </div>
  );
}
