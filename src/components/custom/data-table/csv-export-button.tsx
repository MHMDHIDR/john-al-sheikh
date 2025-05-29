// src/components/custom/data-table/csv-export-button.tsx
import { Download, Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { exportToCSV } from "@/lib/csv-export";
import type { ColumnDef } from "@tanstack/react-table";

interface CSVExportButtonProps<T extends Record<string, any>> {
  data: T[];
  columns: ColumnDef<T>[];
  filename?: string;
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  disabled?: boolean;
}

export function CSVExportButton<T extends Record<string, any>>({
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
      exportToCSV(data, columns, filename);
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
