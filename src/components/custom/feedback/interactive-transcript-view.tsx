"use client";

import EmptyState from "@/components/custom/empty-state";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { EnhancedFeedback, SpeakingTest } from "@/server/db/schema";

interface InteractiveTranscriptViewProps {
  transcription: SpeakingTest["transcription"];
  feedback?: EnhancedFeedback;
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

export function InteractiveTranscriptView({
  transcription,
  feedback,
}: InteractiveTranscriptViewProps) {
  if (!transcription?.messages || transcription.messages.length === 0) {
    return (
      <EmptyState>
        <p className="mt-4 text-lg text-gray-500 select-none dark:text-gray-400">
          لا يوجد تسجيل نصي لهذه المحادثة
        </p>
      </EmptyState>
    );
  }

  // Group messages by role
  const messageGroups = transcription.messages.reduce<
    Array<{
      role: "user" | "examiner";
      messages: Array<(typeof transcription.messages)[number]>;
    }>
  >((acc, message) => {
    const lastGroup = acc[acc.length - 1];
    if (lastGroup && lastGroup.role === message.role) {
      lastGroup.messages.push(message);
    } else {
      acc.push({ role: message.role, messages: [message] });
    }
    return acc;
  }, []);

  // Generate highlights from feedback for user messages
  const getHighlightsForText = (text: string): Highlight[] => {
    if (!feedback) return [];

    const highlights: Highlight[] = [];

    // Add grammar highlights
    feedback.grammarAnalysis.forEach(item => {
      const start = text.indexOf(item.error);
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
      const start = text.indexOf(item.original);
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
    return highlights;
  };

  const renderTextWithHighlights = (text: string, isUserMessage: boolean) => {
    if (!isUserMessage || !feedback) {
      return <span>{text}</span>;
    }

    const highlights = getHighlightsForText(text);

    if (highlights.length === 0) {
      return <span>{text}</span>;
    }

    const segments: React.ReactElement[] = [];
    let lastEnd = 0;

    highlights.forEach((highlight, index) => {
      // Add text before this highlight
      if (highlight.start > lastEnd) {
        segments.push(<span key={`text-${index}`}>{text.slice(lastEnd, highlight.start)}</span>);
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
                <span className="text-red-500" dir="auto">
                  &ldquo;{highlight.original}&rdquo;
                </span>
              </div>
              <div className="font-semibold text-background">
                بدلاً من ذلك:{" "}
                <span className="text-green-500" dir="auto">
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
    if (lastEnd < text.length) {
      segments.push(<span key="text-end">{text.slice(lastEnd)}</span>);
    }

    return segments;
  };

  return (
    <div className="space-y-6 mt-6">
      {feedback && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <div className="text-sm text-blue-800 mb-2">
            انقر على النص المميز في رسائلك لرؤية التصحيحات والاقتراحات
          </div>
          {/* Legend */}
          <div className="flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-1 bg-red-400 border-dotted border-b-2"></div>
              <span className="dark:text-background">أخطاء نحوية</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-1 bg-blue-400 border-dotted border-b-2"></div>
              <span className="dark:text-background">مفردات</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-1 bg-yellow-400 border-dotted border-b-2"></div>
              <span className="dark:text-background">طبيعية التعبير</span>
            </div>
          </div>
        </div>
      )}

      {messageGroups.map((group, groupIndex) => (
        <div
          key={groupIndex}
          className={`p-3 relative rounded-lg flex gap-2.5 ${
            group.role === "examiner" ? "bg-blue-50 text-blue-900" : "bg-green-50 text-green-900"
          }`}
        >
          <div className="flex-shrink-0 absolute -top-3.5 right-0">
            <Badge variant={group.role === "user" ? "default" : "secondary"}>
              {group.role === "user" ? "المستخدم" : "الممتحن"}
            </Badge>
          </div>
          <div className="flex-1 space-y-2">
            {group.messages.map((message, messageIndex) => (
              <div
                key={messageIndex}
                className="text-sm ltr text-justify text-pretty leading-loose"
              >
                {renderTextWithHighlights(message.content, group.role === "user")}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
