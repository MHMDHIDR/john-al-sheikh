import { ArrowUpDown } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { SpeakingTest, Users } from "@/server/db/schema";
import type { ColumnDef } from "@tanstack/react-table";

export const userColumns: ColumnDef<
  SpeakingTest & { user: Users } & {
    latestTestDate: Date | null;
    testCount: number;
  }
>[] = [
  {
    accessorKey: "phone",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        الهاتف
        <ArrowUpDown className="size-4 ml-2" />
      </Button>
    ),
    cell: ({ row }) => {
      const phone = row.getValue("phone") ? String(row.getValue("phone")) : null;

      return phone ? (
        <Link href={`tel:${phone}`} dir="auto">
          <Button variant={"link"} className="p-0 select-none">
            {phone}
          </Button>
        </Link>
      ) : (
        <span className="text-muted-foreground select-none">غير متوفر</span>
      );
    },
  },
  {
    accessorKey: "latestTestDate",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        آخر تاريخ لأخذ الإختبار
        <ArrowUpDown className="size-4 ml-2" />
      </Button>
    ),
    cell: ({ row }) => {
      const date = row.original.latestTestDate;
      return date ? new Date(date).toLocaleDateString() : "-";
    },
  },
  {
    accessorKey: "testCount",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        عدد مرات آخذ الإختبار
        <ArrowUpDown className="size-4 ml-2" />
      </Button>
    ),
    cell: ({ row }) => row.original.testCount,
  },
];
