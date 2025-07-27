"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ProgressionMetrics } from "@/server/db/schema";

interface GrammarImprovementChartProps {
  metrics: ProgressionMetrics;
}

export function GrammarImprovementChart({ metrics }: GrammarImprovementChartProps) {
  // Create data for the chart
  const grammarComparison = metrics.historicalComparison.comparisonPoints.find(
    p => p.aspect === "Grammar",
  );

  const data = [
    {
      name: "السابق",
      score: grammarComparison?.previous ?? 0,
      fill: "#93C5FD", // Light blue
    },
    {
      name: "الحالي",
      score: metrics.grammarAccuracy,
      fill: grammarComparison && grammarComparison.change >= 0 ? "#10B981" : "#EF4444", // Green if improved, red if declined
    },
  ];

  const improvement = grammarComparison?.change ?? 0;

  return (
    <div className="space-y-4">
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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
            <Bar dataKey="score" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="text-center">
        <div
          className={`text-lg font-semibold ${improvement >= 0 ? "text-green-600" : "text-red-600"}`}
        >
          {improvement >= 0 ? "↗" : "↘"} {Math.abs(improvement).toString()} نقطة
        </div>
        <p className="text-sm text-gray-600 mt-1">
          {improvement > 0.5
            ? "تحسن كبير في القواعد!"
            : improvement > 0
              ? "تحسن طفيف"
              : improvement < -0.5
                ? "يحتاج مراجعة القواعد"
                : "مستقر"}
        </p>

        {/* Grammar tips based on performance */}
        <div className="mt-3 text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
          {metrics.grammarAccuracy >= 8
            ? "أداء ممتاز! استمر في هذا المستوى"
            : metrics.grammarAccuracy >= 6
              ? "أداء جيد، ركز على تحسين استخدام الأزمنة والمقالات"
              : "يحتاج تحسين، ننصح بمراجعة القواعد الأساسية وممارسة تكوين الجمل"}
        </div>
      </div>
    </div>
  );
}
