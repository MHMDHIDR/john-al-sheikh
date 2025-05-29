// src/components/custom/data-table/csv-export-button.tsx
import { Download, Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { exportToCSV } from "@/lib/csv-export";
import type { BaseEntity } from "./base-columns";
import type { ColumnDef } from "@tanstack/react-table";

interface CSVExportButtonProps<T extends BaseEntity> {
  data: T[];
  columns: ColumnDef<T>[];
  filename?: string;
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  disabled?: boolean;
}

export function CSVExportButton<T extends BaseEntity>({
  data,
  columns,
  filename = "export",
  className,
  variant = "outline",
  size = "sm",
  disabled = false,
}: CSVExportButtonProps<T>) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!data || data.length === 0) {
      console.warn("No data to export");
      return;
    }

    setIsExporting(true);
    try {
      // Add small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 200));
      // Convert data to a format that exportToCSV can handle
      const isExportableValue = (value: unknown): value is string | number | Date | null => {
        return (
          typeof value === "string" ||
          typeof value === "number" ||
          value === null ||
          (typeof value === "object" && value !== null && value instanceof Date)
        );
      };

      const exportData = data.map(item => {
        const record: Record<string, string | number | Date | null> = {};
        for (const [key, value] of Object.entries(item)) {
          if (key === "created" && typeof value === "number") {
            record[key] = new Date(value * 1000);
          } else if (key === "paymentDetails" && typeof value === "object" && value !== null) {
            Object.entries(value).forEach(([detailKey, detailValue]) => {
              if (isExportableValue(detailValue)) {
                record[`payment_${detailKey}`] = detailValue;
              }
            });
          } else if (isExportableValue(value)) {
            record[key] = value;
          }
        }
        return record;
      });
      exportToCSV(
        exportData,
        columns as unknown as ColumnDef<Record<string, string | number | Date | null>>[],
        filename,
      );
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      onClick={handleExport}
      disabled={disabled || isExporting || !data || data.length === 0}
      variant={variant}
      size={size}
      className={className}
    >
      {isExporting ? (
        <Loader2 className="size-4 mr-2 animate-spin" />
      ) : (
        <Download className="size-4 mr-2" />
      )}
      {isExporting ? "جاري التصدير..." : `تصدير CSV (${data?.length || 0})`}
    </Button>
  );
}
