"use client";

import { Image as TipTapImage } from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { EditorMenu } from "@/components/custom/editor-menu";
import { WelcomeEmailTemplate } from "@/components/custom/welcome-email";
import { Button } from "@/components/ui/button";
import { env } from "@/env";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/trpc/react";

type EmailEditorProps = {
  emailList: Array<{ email: string; name: string | null }>;
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
      StarterKit,
      TipTapImage.configure({ inline: true, allowBase64: true }),
      Link.configure({ openOnClick: false }),
    ],
    content: "",
    editorProps: {
      attributes: {
        class:
          "prose prose-lg max-w-none rtl py-3.5 px-4.5 leading-loose focus:outline-none min-h-[300px]",
      },
    },
    immediatelyRender: false,
  });

  const handleSend = async () => {
    if (!editor || !subject) return;

    await sendNewsletter.mutateAsync({
      subject,
      content: editor.getHTML(),
      recipients: emailList,
    });
  };

  const previewContent = editor?.getHTML() ?? "";

  return !editor ? null : (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <input
          type="text"
          placeholder="عنوان النشرة البريدية"
          value={subject}
          onChange={e => setSubject(e.target.value)}
          className="w-full rounded-md rtl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
        <div className="flex items-center gap-1.5 px-1">
          <Button
            onClick={() => setIsPreview(!isPreview)}
            variant={isPreview ? "destructive" : "outline"}
          >
            {isPreview ? "العودة للتحرير" : "معاينة"}
          </Button>
          {!isPreview && (
            <Button
              onClick={handleSend}
              disabled={sendNewsletter.isPending || !subject || !editor?.getText().trim()}
              variant="active"
            >
              {sendNewsletter.isPending ? <Loader2 className="size-4 animate-spin" /> : "إرسال"}
            </Button>
          )}
        </div>
      </div>

      {isPreview ? (
        <div className="rounded-lg border p-4">
          <WelcomeEmailTemplate
            name="عزيزي المستخدم"
            signupUrl={`${env.NEXT_PUBLIC_APP_URL}/signin`}
            ctaButtonLabel="زيارة المنصة"
            customContent={previewContent}
          />
        </div>
      ) : (
        <div className="rounded-lg border">
          <EditorMenu editor={editor} />
          <EditorContent editor={editor} />
        </div>
      )}
    </div>
  );
}
