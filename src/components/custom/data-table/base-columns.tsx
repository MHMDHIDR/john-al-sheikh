import { IconMoustache, IconWoman } from "@tabler/icons-react";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { ColumnDef } from "@tanstack/react-table";

export type BaseEntity = {
  id: string;
  name: string;
  gender: string | null;
};

export const baseColumns = <T extends BaseEntity>(): ColumnDef<T>[] => [
  {
    id: "base_name",
    accessorKey: "name",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        الاسم
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const name = row.original.name;
      const gender = row.original.gender;

      return (
        <span className="flex items-center gap-x-4">
          <Tooltip>
            <TooltipTrigger asChild>
              {gender === "male" ? <IconMoustache /> : <IconWoman />}
            </TooltipTrigger>
            <TooltipContent>{gender === "male" ? "ذكر" : "أنثى"}</TooltipContent>
          </Tooltip>
          <span className="text-muted-foreground select-none">{name}</span>
        </span>
      );
    },
  },
];
