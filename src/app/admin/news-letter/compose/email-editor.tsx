"use client";

import { render as renderEmail } from "@react-email/render";
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
import clsx from "clsx";
import { Check, Loader2, Users } from "lucide-react";
import { useEffect, useState } from "react";
import ImageResize from "tiptap-extension-resize-image";
import { ConfirmationDialog } from "@/components/custom/data-table/confirmation-dialog";
import { EditorMenu } from "@/components/custom/editor-menu";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import NewsletterEmailTemplate from "@/emails/newsletter-email";
import { env } from "@/env";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";

type EmailEditorProps = {
  emailList: Array<{ email: string; name: string }>;
};

export function EmailEditor({ emailList }: EmailEditorProps) {
  const [isPreview, setIsPreview] = useState(false);
  const [subject, setSubject] = useState("");
  const [selectedRecipients, setSelectedRecipients] =
    useState<Array<{ email: string; name: string }>>(emailList);
  const [isRecipientsDialogOpen, setIsRecipientsDialogOpen] = useState(false);
  const [confirmSendDialog, setConfirmSendDialog] = useState(false);
  const [newsletterHtml, setNewsletterHtml] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [ctaUrl, setCtaUrl] = useState<string>(`${env.NEXT_PUBLIC_APP_URL}/signin`);
  const [ctaButtonLabel, setCtaButtonLabel] = useState<string>("زيارة المنصة");

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
        HTMLAttributes: {
          class: "max-w-96 h-auto rounded-md block",
          style: "max-height: 300px; object-fit: contain;",
        },
      }),

      // Add image resize extension
      ImageResize.configure({
        HTMLAttributes: {
          class: "resizable-image",
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
      <style>
        .resizable-image {
          position: relative;
          display: inline-block;
          transition: box-shadow 0.2s ease;
        }

        .resizable-image:hover {
          box-shadow: 0 0 0 2px #4a9eff;
        }

        .resizable-image .resize-handle {
          background: #4a9eff !important;
          border: 2px solid white !important;
          border-radius: 50% !important;
          opacity: 0;
          transition: opacity 0.2s ease;
        }

        .resizable-image:hover .resize-handle {
          opacity: 1;
        }

        .resizable-image.resizing {
          user-select: none;
          box-shadow: 0 0 0 2px #4a9eff;
        }

        .resizable-image.resizing .resize-handle {
          opacity: 1;
          background: #2563eb !important;
        }
      </style>
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
    if (!editor || !subject.trim() || subject.length <= 5) {
      errorToast("يرجى إدخال عنوان النشرة البريدية بشكل صحيح");
      return;
    }

    const content = editor.getHTML();
    if (!content.trim() || content === "<p></p>") {
      errorToast("يرجى إدخال محتوى النشرة البريدية");
      return;
    }

    if (selectedRecipients.length === 0) {
      errorToast("يرجى اختيار مستلمين على الأقل");
      return;
    }

    try {
      await sendNewsletter.mutateAsync({
        subject: subject.trim(),
        content,
        recipients: selectedRecipients,
        ctaUrl,
        ctaButtonLabel,
      });

      // Reset form after successful send
      setSubject("");
      editor.commands.clearContent();
    } catch (error) {
      console.error("Error sending newsletter:", error);
    }
  };

  const toggleRecipient = (recipient: { email: string; name: string }) => {
    setSelectedRecipients(prev => {
      const isSelected = prev.some(r => r.email === recipient.email);
      if (isSelected) {
        return prev.filter(r => r.email !== recipient.email);
      } else {
        return [...prev, recipient];
      }
    });
  };

  const SUBJECT_MIN_LENGTH = 5;
  const SUBJECT_MAX_LENGTH = 100;

  const previewContent = editor?.getHTML() ?? "";
  const isFormValid =
    subject.trim().length > SUBJECT_MIN_LENGTH &&
    subject.trim().length < SUBJECT_MAX_LENGTH &&
    editor?.getText().trim() &&
    selectedRecipients.length > 0;

  useEffect(() => {
    if (isPreview) {
      setIsRendering(true);
      void renderEmail(
        <NewsletterEmailTemplate
          senderName="فريق المنصة"
          sendingDate={new Date().toLocaleDateString("ar-EG", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
          name="عزيزي المشترك"
          subject={subject ?? "نشرة جديدة"}
          customContent={previewContent}
          ctaUrl={ctaUrl}
          ctaButtonLabel={ctaButtonLabel}
        />,
      ).then(html => {
        setNewsletterHtml(html);
        setIsRendering(false);
      });
    }
  }, [isPreview, subject, previewContent, ctaUrl, ctaButtonLabel]);

  if (!editor) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="size-10 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 rtl">
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
          <Dialog open={isRecipientsDialogOpen} onOpenChange={setIsRecipientsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="min-w-[120px]">
                <Users className="size-4 ml-2" />
                المستلمين ({selectedRecipients.length})
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader className="text-center! select-none">
                <DialogTitle>اختر المستلمين</DialogTitle>
              </DialogHeader>
              <div className="flex gap-2 text-muted-foreground">
                <Button
                  variant="secondary"
                  className="w-full mb-2"
                  onClick={() => setSelectedRecipients(emailList)}
                >
                  تحديد الكل
                </Button>
                <Button
                  variant="secondary"
                  className="w-full mb-2"
                  onClick={() => setSelectedRecipients([])}
                >
                  إلغاء التحديد
                </Button>
              </div>
              <Command className="rounded-lg border shadow-md">
                <CommandInput placeholder="ابحث عن مستلم..." />
                <CommandList>
                  <CommandEmpty>لا يوجد مستلمين</CommandEmpty>
                  <CommandGroup>
                    {emailList.map(recipient => {
                      const isSelected = selectedRecipients.some(r => r.email === recipient.email);
                      return (
                        <CommandItem
                          key={recipient.email}
                          onSelect={() => toggleRecipient(recipient)}
                          className="flex items-center justify-between px-4 py-2 cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className={cn(
                                "size-4 rounded border flex items-center justify-center",
                                isSelected && "bg-primary border-primary",
                              )}
                            >
                              {isSelected && <Check className="size-3 text-primary-foreground" />}
                            </div>
                            <span>{recipient.name}</span>
                          </div>
                          <span className="text-muted-foreground text-sm">{recipient.email}</span>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </CommandList>
              </Command>
            </DialogContent>
          </Dialog>

          <Button
            onClick={() => setIsPreview(!isPreview)}
            variant={isPreview ? "destructive" : "outline"}
            className="min-w-[120px]"
          >
            {isPreview ? "العودة للتحرير" : "معاينة"}
          </Button>

          {!isPreview && (
            <Button
              onClick={() => setConfirmSendDialog(true)}
              variant="default"
              className={clsx("min-w-[120px]", {
                "opacity-50 cursor-not-allowed disabled:pointer-events-auto":
                  sendNewsletter.isPending || !isFormValid,
              })}
              disabled={sendNewsletter.isPending || !isFormValid}
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

      {/* Accordion for optional CTA fields */}
      <Accordion type="single" collapsible className="w-full" defaultValue="">
        <AccordionItem value="cta-options">
          <AccordionTrigger className="justify-baseline">خيارات متقدمة</AccordionTrigger>
          <AccordionContent className="flex flex-col gap-4">
            <div>
              <label htmlFor="cta-url" className="block text-sm font-medium mb-1">
                رابط الزر (CTA URL)
                <small className="text-primary/50 mx-2">(إختياري)</small>
              </label>
              <Input
                id="cta-url"
                type="url"
                placeholder={`مثال: ${env.NEXT_PUBLIC_APP_URL}`}
                value={ctaUrl}
                onChange={e => setCtaUrl(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="cta-label" className="block text-sm font-medium mb-1">
                نص الزر (CTA Button Label)
                <small className="text-primary/50 mx-2">(إختياري)</small>
              </Label>
              <Input
                id="cta-label"
                type="text"
                placeholder="مثال: زيارة المنصة"
                value={ctaButtonLabel}
                onChange={e => setCtaButtonLabel(e.target.value)}
              />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div className="bg-muted/50 border select-none rounded-lg p-3 text-sm text-red-500">
        سيتم إرسال النشرة إلى <strong>{selectedRecipients.length}</strong> مشترك
      </div>

      {isPreview ? (
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="mb-4 pb-4 border-b">
            <h3 className="text-lg font-semibold">معاينة النشرة البريدية</h3>
            <p className="text-sm text-muted-foreground">العنوان: {subject || "بدون عنوان"}</p>
          </div>
          {isRendering ? (
            <div className="flex items-center justify-center min-h-[300px]">
              <Loader2 className="size-10 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <iframe
              title="معاينة البريد"
              srcDoc={newsletterHtml ?? ""}
              className="w-full min-h-[600px] border rounded"
              style={{ background: "#fff" }}
            />
          )}
        </div>
      ) : (
        <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
          <EditorMenu editor={editor} />
          <div className="min-h-[400px]">
            <EditorContent editor={editor} />
          </div>
        </div>
      )}

      <ConfirmationDialog
        open={confirmSendDialog}
        onOpenChange={setConfirmSendDialog}
        title="إرسال النشرة البريدية"
        description={
          <div className="flex flex-col text-right">
            <p>
              سيتم إرسال النشرة البريدية إلى{" "}
              <strong className="text-black">{selectedRecipients.length}</strong> مشترك
            </p>
            <strong className="text-pretty text-black mt-3">
              هل أنت متأكد من إرسال النشرة البريدية؟
            </strong>
          </div>
        }
        buttonText="إرسال النشرة"
        buttonClass="bg-green-600 hover:bg-green-700"
        onConfirm={handleSend}
      />
    </div>
  );
}
