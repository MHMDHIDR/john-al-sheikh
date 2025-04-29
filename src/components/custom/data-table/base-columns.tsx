import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ColumnDef } from "@tanstack/react-table";

export type BaseEntity = {
  id: string;
  name: string;
};

export const baseColumns = <T extends BaseEntity>(): ColumnDef<T>[] => [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        الاسم
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    id: "base_name",
  },
];
