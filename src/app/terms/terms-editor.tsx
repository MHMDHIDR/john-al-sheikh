"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import clsx from "clsx";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
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
    },
    onError: error => {
      errorToast(error.message);
    },
  });

  const editor = useEditor({
    extensions: [StarterKit],
    content,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "prose prose-lg max-w-none rtl focus:outline-none",
      },
    },
  });

  const handleSave = async () => {
    if (!editor) return;

    await updateTermsContent.mutateAsync({ content: editor.getHTML(), type: "TERMS" });
  };

  return (
    <>
      {isAdmin && (
        <div
          className={clsx(
            "tools-container flex w-fit items-center gap-x-2 transition-all duration-300",
            {
              "sticky top-14 z-10 shadow-md bg-white/20 backdrop-blur-sm p-1 px-0.5 rounded-lg":
                scrolled,
            },
          )}
        >
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
