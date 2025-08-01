"use client";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { EnhancedFeedback } from "@/server/db/schema";

interface InteractiveTranscriptProps {
  feedback: EnhancedFeedback;
}

interface Highlight {
  start: number;
  end: number;
  type: "grammar" | "vocabulary" | "nativeness";
  original: string;
  correction: string;
  explanation: string;
  arabicExplanation: string;
}

export function InteractiveTranscript({ feedback }: InteractiveTranscriptProps) {
  // Combine all feedback into highlights
  const highlights: Highlight[] = [];

  // Add grammar highlights
  feedback.grammarAnalysis.forEach(item => {
    const start = feedback.originalText.indexOf(item.error);
    if (start !== -1) {
      highlights.push({
        start,
        end: start + item.error.length,
        type: "grammar",
        original: item.error,
        correction: item.correction,
        explanation: item.explanation,
        arabicExplanation: item.arabicExplanation,
      });
    }
  });

  // Add nativeness highlights
  feedback.nativenessAnalysis.expressions.forEach(item => {
    const start = feedback.originalText.indexOf(item.original);
    if (start !== -1) {
      highlights.push({
        start,
        end: start + item.original.length,
        type: "nativeness",
        original: item.original,
        correction: item.britishAlternative,
        explanation: `Better British English: ${item.britishAlternative}`,
        arabicExplanation: item.arabicExplanation,
      });
    }
  });

  // Sort highlights by start position
  highlights.sort((a, b) => a.start - b.start);

  // Split text into segments with highlights
  const renderText = () => {
    if (highlights.length === 0) {
      return <span>{feedback.originalText}</span>;
    }

    const segments: React.ReactElement[] = [];
    let lastEnd = 0;

    highlights.forEach((highlight, index) => {
      // Add text before this highlight
      if (highlight.start > lastEnd) {
        segments.push(
          <span key={`text-${index}`}>
            {feedback.originalText.slice(lastEnd, highlight.start)}
          </span>,
        );
      }

      // Add the highlighted text
      const highlightClass =
        highlight.type === "grammar"
          ? "border-b-2 border-red-400 border-dotted bg-red-50 cursor-help dark:text-background"
          : highlight.type === "vocabulary"
            ? "border-b-2 border-blue-400 border-dotted bg-blue-50 cursor-help dark:text-background"
            : "border-b-2 border-yellow-400 border-dotted bg-yellow-50 cursor-help dark:text-background";

      segments.push(
        <Popover key={`highlight-${index}`}>
          <PopoverTrigger asChild>
            <span className={highlightClass}>{highlight.original}</span>
          </PopoverTrigger>
          <PopoverContent
            className="w-fit max-w-screen py-3 px-4 text-sm"
            side="top"
            align="center"
          >
            <div className="space-y-2">
              <div className="font-semibold text-background">
                قلت:{" "}
                <span className="text-red-500 " dir="auto">
                  &ldquo;{highlight.original}&rdquo;
                </span>
              </div>
              <div className="font-semibold text-background">
                بدلاً من ذلك:{" "}
                <span className="text-green-500 " dir="auto">
                  &ldquo;{highlight.correction}&rdquo;
                </span>
              </div>
              {highlight.explanation && (
                <div className="text-xs text-foreground italic ltr">{highlight.explanation}</div>
              )}
              <div className="text-sm text-foreground border-t pt-2">
                {highlight.arabicExplanation}
              </div>
            </div>
          </PopoverContent>
        </Popover>,
      );

      lastEnd = highlight.end;
    });

    // Add remaining text
    if (lastEnd < feedback.originalText.length) {
      segments.push(<span key="text-end">{feedback.originalText.slice(lastEnd)}</span>);
    }

    return segments;
  };

  return (
    <div className="relative">
      <div className="bg-background border rounded-lg p-3 leading-relaxed text-base">
        <div className="mb-4 text-sm text-foreground">
          <span>انقر على النص المميز لرؤية التصحيحات والاقتراحات</span>
        </div>

        <div className="ltr text-justify">{renderText()}</div>
      </div>
    </div>
  );
}
