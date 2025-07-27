"use client";

import { TagCloud } from "react-tagcloud";
import type { WordAnalysis } from "@/server/db/schema";

interface WordCloudProps {
  wordUsage: Record<string, WordAnalysis>;
}

export function WordCloud({ wordUsage }: WordCloudProps) {
  // Create a mapping of words to categories for color lookup
  const wordCategories: Record<string, string> = {};
  Object.entries(wordUsage).forEach(([word, analysis]) => {
    wordCategories[word] = analysis.category;
  });

  // Convert word usage to TagCloud format
  const tags = Object.entries(wordUsage).map(([word, analysis]) => ({
    value: word,
    count: analysis.frequency,
  }));

  // Color scheme for different categories
  const getColor = (category: string) => {
    switch (category) {
      case "advanced":
        return "#DC2626"; // Red for advanced
      case "intermediate":
        return "#2563EB"; // Blue for intermediate
      case "basic":
        return "#16A34A"; // Green for basic
      default:
        return "#6B7280"; // Gray for unknown
    }
  };

  const customRenderer = (tag: { value: string; count: number }, size: number) => {
    const category = wordCategories[tag.value] ?? "unknown";
    return (
      <span
        key={tag.value}
        style={{
          fontSize: `${size}px`,
          color: getColor(category),
          margin: "2px",
          padding: "2px 4px",
          borderRadius: "4px",
          backgroundColor: `${getColor(category)}10`,
          display: "inline-block",
          cursor: "pointer",
        }}
        title={`${tag.value} - استُخدمت ${tag.count} مرة (${category})`}
      >
        {tag.value}
      </span>
    );
  };

  if (tags.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>لا توجد كلمات لعرضها</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-center gap-4 text-sm">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span>أساسية</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          <span>متوسطة</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <span>متقدمة</span>
        </div>
      </div>

      <div className="border rounded-lg p-6 bg-gray-50 min-h-[200px] flex items-center justify-center">
        <TagCloud
          minSize={12}
          maxSize={28}
          tags={tags}
          renderer={customRenderer}
          className="text-center"
        />
      </div>

      <div className="grid grid-cols-3 gap-4 text-center text-sm">
        <div>
          <div className="font-semibold text-green-600">
            {Object.values(wordCategories).filter(category => category === "basic").length}
          </div>
          <div>كلمة أساسية</div>
        </div>
        <div>
          <div className="font-semibold text-blue-600">
            {Object.values(wordCategories).filter(category => category === "intermediate").length}
          </div>
          <div>كلمة متوسطة</div>
        </div>
        <div>
          <div className="font-semibold text-red-600">
            {Object.values(wordCategories).filter(category => category === "advanced").length}
          </div>
          <div>كلمة متقدمة</div>
        </div>
      </div>
    </div>
  );
}
