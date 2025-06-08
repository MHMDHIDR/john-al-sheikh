"use client";

import { Color } from "@tiptap/extension-color";
import { FontSize } from "@tiptap/extension-font-size";
import { Highlight } from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";
import { ListItem } from "@tiptap/extension-list-item";
import { TextAlign } from "@tiptap/extension-text-align";
import TextStyle from "@tiptap/extension-text-style";
import { Underline } from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import clsx from "clsx";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { EditorMenu } from "@/components/custom/editor-menu";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/trpc/react";

export function TermsContent({ content, isAdmin }: { content: string; isAdmin: boolean }) {
  const [isEditing, setIsEditing] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const dataUpdatedAtContainer = document.querySelector("[data-page-content-intro]")!;
    const SCROLL_AT =
      dataUpdatedAtContainer.getBoundingClientRect().top -
      dataUpdatedAtContainer.getBoundingClientRect().height;

    const handleScroll = () => {
      const isScrolled = window.scrollY > SCROLL_AT;
      setScrolled(isScrolled);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const { success, error: errorToast } = useToast();

  const updateTermsContent = api.pageContent.updateContent.useMutation({
    onSuccess: () => {
      success("تم تعديل المحتوى الخاص بالشروط والأحكام");
      setIsEditing(false);
    },
    onError: error => {
      errorToast(error.message);
    },
  });

  const handleSave = async () => {
    if (!editor) return;

    await updateTermsContent.mutateAsync({ content: editor.getHTML(), type: "TERMS" });
  };

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
    editorProps: {
      attributes: {
        class:
          "prose prose-lg max-w-fit rtl py-4 px-6 leading-relaxed focus:outline-none min-h-[400px] bg-white prose-headings:text-gray-900 prose-headings:font-bold prose-p:text-gray-700 prose-p:leading-relaxed prose-strong:text-gray-900 prose-strong:font-bold prose-em:text-gray-700 prose-em:italic prose-code:bg-gray-100 prose-code:px-1 prose-code:rounded prose-blockquote:border-r-4 prose-blockquote:border-blue-500 prose-blockquote:pl-4 prose-blockquote:italic prose-ul:list-disc prose-ol:list-decimal prose-li:text-gray-700",
      },
    },
    content,
    immediatelyRender: false,
    onCreate: ({ editor }) => {
      // Set default text alignment for RTL content
      editor.commands.setTextAlign("right");
    },
  });

  return (
    <>
      {isAdmin && editor && (
        <div
          className={clsx(
            "tools-container flex flex-col items-start gap-1 w-fit gap-x-2 transition-all duration-300",
            {
              "sticky top-14 z-10 shadow-md bg-white/20 backdrop-blur-sm p-1 px-0.5 rounded-lg":
                scrolled,
            },
          )}
        >
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setIsEditing(!isEditing)}
              variant={isEditing ? "destructive" : "outline"}
            >
              {isEditing ? "إلغاء" : "تعديل"}
            </Button>
            {isEditing && (
              <Button onClick={handleSave} disabled={updateTermsContent.isPending} variant="active">
                {updateTermsContent.isPending ? <Loader2 className="size-4 animate-spin" /> : "حفظ"}
              </Button>
            )}
          </div>
          {isEditing && <EditorMenu editor={editor} isSimpleEditor />}
        </div>
      )}
      <div className="flex flex-col justify-between items-center">
        {isEditing ? (
          <EditorContent editor={editor} className="text-justify leading-loose" />
        ) : (
          <div
            className="prose prose-lg max-w-none rtl text-justify leading-loose"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        )}
      </div>
    </>
  );
}
