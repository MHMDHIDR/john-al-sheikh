import clsx from "clsx";
import { ArrowUpDown, CreditCard } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format-price";
import { translateSring } from "@/lib/translate-string";
import type { Payment } from "./payments-table";
import type { ColumnDef } from "@tanstack/react-table";

export const paymentsColumns: ColumnDef<Payment>[] = [
  {
    accessorKey: "type",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        نوع الدفع
        <ArrowUpDown className="w-4 h-4 ml-2" />
      </Button>
    ),
    cell: ({ row }) => {
      const type = row.getValue("type") as string;
      return (
        <Badge variant={type === "pending" ? "secondary" : "success"}>{translateSring(type)}</Badge>
      );
    },
  },
  {
    accessorKey: "amount",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        القيمة
        <ArrowUpDown className="size-4 ml-2" />
      </Button>
    ),
    cell: ({ row }) => {
      const amount = row.getValue("amount") as number;
      return (
        <strong className={clsx({ "text-red-500": amount < 0 })}>
          {formatPrice({ price: amount, toPence: true })}
        </strong>
      );
    },
  },
  {
    accessorKey: "currency",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        العملة
        <ArrowUpDown className="w-4 h-4 ml-2" />
      </Button>
    ),
    cell: ({ row }) => {
      const currency = row.getValue("currency") as string;
      return currency.toUpperCase();
    },
  },
  {
    accessorKey: "source_types",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        المصدر
        <ArrowUpDown className="w-4 h-4 ml-2" />
      </Button>
    ),
    cell: ({ row }) => {
      const sourceTypes = row.original.source_types;
      if (!sourceTypes) return "-";

      return Object.entries(sourceTypes).map(([key]) => {
        return (
          <span key={key} className="flex items-center justify-center gap-1">
            <CreditCard className="size-4" />
            {translateSring(key)}
          </span>
        );
      });
    },
  },
];
