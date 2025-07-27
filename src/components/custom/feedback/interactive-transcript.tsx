"use client";

import React, { useState } from "react";
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
  const [hoveredHighlight, setHoveredHighlight] = useState<Highlight | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

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
          ? "border-b-2 border-red-400 border-dotted bg-red-50 cursor-help"
          : highlight.type === "vocabulary"
            ? "border-b-2 border-blue-400 border-dotted bg-blue-50 cursor-help"
            : "border-b-2 border-yellow-400 border-dotted bg-yellow-50 cursor-help";

      segments.push(
        <span
          key={`highlight-${index}`}
          className={highlightClass}
          onMouseEnter={e => {
            setHoveredHighlight(highlight);
            const rect = e.currentTarget.getBoundingClientRect();
            setTooltipPosition({
              x: rect.left + rect.width / 2,
              y: rect.top - 10,
            });
          }}
          onMouseLeave={() => setHoveredHighlight(null)}
        >
          {highlight.original}
        </span>,
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
      <div className="bg-gray-50 border rounded-lg p-6 leading-relaxed text-base">
        <div className="mb-4 text-sm text-gray-600">
          <span>انقر على النص المميز لرؤية التصحيحات والاقتراحات</span>
        </div>

        <div className="ltr text-justify">{renderText()}</div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-1 bg-red-400 border-dotted border-b-2"></div>
          <span>أخطاء نحوية</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-1 bg-blue-400 border-dotted border-b-2"></div>
          <span>مفردات</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-1 bg-yellow-400 border-dotted border-b-2"></div>
          <span>طبيعية التعبير</span>
        </div>
      </div>

      {/* Tooltip */}
      {hoveredHighlight && (
        <div
          className="fixed z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-sm"
          style={{
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y}px`,
            transform: "translate(-50%, -100%)",
          }}
        >
          <div className="space-y-2">
            <div className="font-semibold text-red-600">
              قلت: &ldquo;{hoveredHighlight.original}&rdquo;
            </div>
            <div className="font-semibold text-green-600">
              بدلاً من ذلك: &ldquo;{hoveredHighlight.correction}&rdquo;
            </div>
            <div className="text-sm text-gray-600 border-t pt-2">
              {hoveredHighlight.arabicExplanation}
            </div>
            {hoveredHighlight.explanation && (
              <div className="text-xs text-gray-500 italic">{hoveredHighlight.explanation}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
