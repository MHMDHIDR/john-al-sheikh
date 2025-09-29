import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";

/**
 * Converts an array of objects to CSV format
 * @param data - Array of objects to convert
 * @param columns - Column definitions to determine which fields to export and their headers
 * @param filename - Name of the downloaded file (without .csv extension)
 */
export function exportToCSV<T extends Record<string, string | number | Date | null | undefined>>(
  data: T[],
  columns: ColumnDef<T>[],
  filename = "export",
): void {
  if (!data || data.length === 0) {
    console.warn("No data to export");
    return;
  }

  // Filter out non-data columns (like actions, select, etc.)
  const exportableColumns = columns.filter(col => {
    const accessorKey = (col as { accessorKey?: string }).accessorKey;
    const id = (col as { id: string }).id;

    // Skip selection, actions, and other utility columns
    const skipColumns = ["select", "actions", "الإجراءات"];
    return accessorKey && !skipColumns.includes(accessorKey) && !skipColumns.includes(id);
  });

  // Extract headers
  const headers = exportableColumns.map(col => {
    // Try to get header text from various sources
    if (typeof col.header === "string") {
      return col.header;
    }

    // For complex headers (like buttons), extract text content
    if (typeof col.header === "function") {
      // This is a simplified approach - you might need to adjust based on your header structure
      const accessorKey = (col as { accessorKey?: string }).accessorKey;
      return accessorKey ? formatHeader(accessorKey) : "Unknown";
    }

    const accessorKey = (col as { accessorKey?: string }).accessorKey;
    return accessorKey ? formatHeader(accessorKey) : "Unknown";
  });

  // Extract data rows
  const csvRows = data.map(row => {
    return exportableColumns.map(col => {
      const accessorKey = (col as { accessorKey?: string }).accessorKey;
      if (!accessorKey) return "";

      const value = row[accessorKey as keyof T];
      let stringValue: string;

      // Handle special formatting for common data types
      if (value && typeof value === "object" && (value as unknown as Date) instanceof Date) {
        stringValue = (value as unknown as Date).toLocaleDateString();
      } else if (value === null || value === undefined) {
        stringValue = "";
      } else if (typeof value === "object") {
        stringValue = JSON.stringify(value);
      } else {
        stringValue = String(value);
      }

      // Escape quotes and wrap in quotes if contains comma, quote, or newline
      if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }

      return stringValue;
    });
  });

  // Combine headers and data
  const csvContent = [headers, ...csvRows].map(row => row.join(",")).join("\n");

  // Add BOM for proper UTF-8 encoding (especially important for Arabic text)
  const BOM = "\uFEFF";
  const csvWithBOM = BOM + csvContent;

  // Create and download file
  const blob = new Blob([csvWithBOM], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } else {
    console.error("CSV download not supported in this browser");
  }
}

/**
 * Formats accessor key to a readable header name
 * @param key - The accessor key
 * @returns Formatted header name
 */
function formatHeader(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1") // Add space before capital letters
    .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
    .trim();
}

/**
 * Hook to handle CSV export with loading state
 * @param data - Data to export
 * @param columns - Column definitions
 * @param defaultFilename - Default filename
 * @returns Object with export function and loading state
 */
export function useCSVExport<T extends Record<string, string | number | Date | null | undefined>>(
  data: T[],
  columns: ColumnDef<T>[],
  defaultFilename = "export",
) {
  const [isExporting, setIsExporting] = useState(false);

  const exportCSV = async (filename?: string) => {
    setIsExporting(true);
    try {
      // Add small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 100));
      exportToCSV(data, columns, filename ?? defaultFilename);
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setIsExporting(false);
    }
  };

  return { exportCSV, isExporting };
}
