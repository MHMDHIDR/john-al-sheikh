import { Button } from "@/components/ui/button";
import type { Table } from "@tanstack/react-table";

interface TablePaginationProps<TData> {
  table: Table<TData>;
  selectedRows: TData[];
  isSelectable?: boolean;
}

export function TablePagination<TData>({
  table,
  selectedRows,
  isSelectable = true,
}: TablePaginationProps<TData>) {
  return (
    <div className="flex items-center justify-start py-4 gap-x-2">
      {isSelectable && (
        <div className="text-sm text-muted-foreground">
          {`${selectedRows.length} من ${table.getFilteredRowModel().rows.length}`}
        </div>
      )}
      <Button
        variant="outline"
        size="sm"
        onClick={() => table.previousPage()}
        disabled={!table.getCanPreviousPage()}
      >
        {`السابق`}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => table.nextPage()}
        disabled={!table.getCanNextPage()}
      >
        {`التالي`}
      </Button>
    </div>
  );
}
