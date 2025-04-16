"use client";

import { Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function CopyText({ text, className }: { text: string; className?: string }) {
  const toast = useToast();

  async function handleCopyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);

      toast.success("Copied");
    } catch (error) {
      toast.error(JSON.stringify(error));
    }
  }

  return (
    <Copy
      onClick={() => handleCopyToClipboard(text)}
      className={cn("cursor-pointer opacity-70 hover:opacity-100", className)}
    />
  );
}
