import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import clsx from "clsx";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import EmptyState from "@/components/custom/empty-state";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { checkRoleAccess } from "@/lib/check-role-access";
import { UserRole } from "@/server/db/schema";
import { LoadingCard } from "./loading";
import type { BaseEntity } from "./base-columns";
import type { ColumnDef, Row, RowSelectionState } from "@tanstack/react-table";

type RowStatus = "inactive" | "deactivated" | "pending" | "active" | "default";

type DataTableProps<TData extends BaseEntity> = {
  columns: ColumnDef<TData>[];
  data: TData[];
  onRowSelection?: (selectedRows: TData[]) => void;
  emptyStateMessage?: string;
  isLoading?: boolean;
  count?: number;
};

export function DataTable<TData extends BaseEntity>({
  columns,
  data,
  isLoading = false,
  count = 7,
  emptyStateMessage = "Sorry we couldn't find any data.",
  onRowSelection,
}: DataTableProps<TData>) {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const { data: session } = useSession();
  const pathname = usePathname();
  const ALLOWED_ROLES = [UserRole.SUPER_ADMIN, UserRole.ADMIN] as const;
  const MANAGING_PATHS = ["/dashboard", "/admin"];

  const selectionColumn: ColumnDef<TData> = {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={value => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className={clsx("relative w-4 h-4 flex items-center justify-center mx-3", {
          "hover:after:content-['✔'] hover:after:absolute hover:after:top-0 hover:after:left-0 hover:after:w-full hover:after:h-full hover:after:flex hover:after:items-center hover:after:justify-center hover:after:text-xs":
            !table.getIsAllPageRowsSelected(),
        })}
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={value => row.toggleSelected(!!value)}
        aria-label="Select row"
        className={clsx("relative w-4 h-4 flex items-center justify-center mx-3", {
          "hover:after:content-['✔'] hover:after:absolute hover:after:top-0 hover:after:left-0 hover:after:w-full hover:after:h-full hover:after:flex hover:after:items-center hover:after:justify-center hover:after:text-xs":
            !row.getIsSelected(),
        })}
      />
    ),
    enableSorting: false,
    enableHiding: false,
  };

  const allColumns = [
    checkRoleAccess(session?.user?.role, ALLOWED_ROLES) &&
    MANAGING_PATHS.some(path => pathname.includes(path))
      ? selectionColumn
      : null,
    ...columns,
  ].filter(Boolean) as ColumnDef<TData>[];

  const table = useReactTable({
    data,
    columns: allColumns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onRowSelectionChange: setRowSelection,
    state: { rowSelection },
  });

  useEffect(() => {
    if (onRowSelection) {
      const selectedRows = table.getFilteredSelectedRowModel().rows.map(row => row.original);
      onRowSelection(selectedRows);
    }
  }, [rowSelection, table, onRowSelection]);

  const getRowStatus = (row: Row<TData>): RowStatus => {
    const original = row.original as {
      status?: string;
      deletedAt?: Date;
      suspendedAt?: Date;
    };
    const isInactive = original.deletedAt ?? original.suspendedAt;

    if (isInactive) return "inactive";

    switch (original.status) {
      case "DEACTIVATED":
        return "deactivated";
      case "PENDING":
        return "pending";
      case "ACTIVE":
        return "active";
      default:
        return "default";
    }
  };

  const statusStyles: Record<RowStatus, string> = {
    inactive:
      "text-red-700 hover:text-red-50 bg-red-200 hover:bg-red-500 dark:text-red-200 dark:bg-red-900 dark:hover:bg-red-950",
    deactivated:
      "text-orange-700 hover:text-orange-50 bg-orange-200 hover:bg-orange-500 dark:text-orange-200 dark:bg-orange-900 dark:hover:bg-orange-950",
    pending:
      "text-yellow-700 hover:text-yellow-50 bg-yellow-200 hover:bg-yellow-500 dark:text-yellow-200 dark:bg-yellow-900 dark:hover:bg-yellow-950",
    active:
      "text-green-700 hover:text-green-50 bg-green-200 hover:bg-green-500 dark:text-green-200 dark:bg-green-900 dark:hover:bg-green-950",
    default: "",
  };

  return (
    <div className="border rounded-md overflow-auto">
      <Table>
        <TableHeader className="select-none">
          {table.getHeaderGroups().map(headerGroup => (
            <TableRow key={headerGroup.id} className="bg-muted/50">
              {headerGroup.headers.map(header => (
                <TableHead key={header.id} className="text-center">
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map(row =>
              isLoading ? (
                <TableRow key={row.id}>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    <LoadingCard renderedSkeletons={count} />
                  </TableCell>
                </TableRow>
              ) : (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={statusStyles[getRowStatus(row)]}
                >
                  {row.getVisibleCells().map(cell => (
                    <TableCell key={cell.id} className="whitespace-nowrap text-center">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ),
            )
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length + 1} className="h-24 text-center">
                <EmptyState>
                  <p className="mt-4 text-lg text-gray-500 select-none dark:text-gray-400">
                    {emptyStateMessage}
                  </p>
                </EmptyState>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
