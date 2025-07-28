"use client";

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ProgressionMetrics } from "@/server/db/schema";

interface VocabularyProgressChartProps {
  metrics: ProgressionMetrics;
}

export function VocabularyProgressChart({ metrics }: VocabularyProgressChartProps) {
  // Create data for the chart
  const data = [
    {
      name: "السابق",
      score:
        metrics.historicalComparison.comparisonPoints.find(p => p.aspect === "Vocabulary")
          ?.previous ?? 0,
    },
    {
      name: "الحالي",
      score: metrics.vocabularyDiversity,
    },
  ];

  // Calculate improvement
  const improvement =
    metrics.historicalComparison.comparisonPoints.find(p => p.aspect === "Vocabulary")?.change ?? 0;

  return (
    <div className="space-y-4">
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 15, right: 0, left: -30, bottom: 5 }}>
            <defs>
              <linearGradient id="vocabularyGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <XAxis dataKey="name" axisLine={false} tickLine={false} />
            <YAxis domain={[0, 10]} axisLine={false} tickLine={false} />
            <Tooltip
              formatter={(value: number) => [`${value.toString()}`, "الدرجة"]}
              labelStyle={{ color: "#374151" }}
              contentStyle={{
                backgroundColor: "#F9FAFB",
                border: "1px solid #E5E7EB",
                borderRadius: "6px",
              }}
            />
            <Area
              type="monotone"
              dataKey="score"
              stroke="#3B82F6"
              fillOpacity={1}
              fill="url(#vocabularyGradient)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="text-center">
        <div
          className={`text-lg font-semibold ${improvement >= 0 ? "text-green-600" : "text-red-600"}`}
        >
          {improvement >= 0 ? "↗" : "↘"} {Math.abs(improvement).toString()} نقطة
        </div>
        <p className="text-sm text-gray-600 mt-1">
          {improvement > 0 ? "تحسن ممتاز!" : improvement < 0 ? "يحتاج تحسين" : "مستقر"}
        </p>
      </div>
    </div>
  );
}
