import { Edit, MoreHorizontal, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { BaseEntity } from "./base-columns";
import type { ColumnDef } from "@tanstack/react-table";

type ActionCellProps<T extends BaseEntity> = {
  row: T;
  onDelete: (id: string) => void;
  onEdit?: (row: T) => void;
};

export function ActionCell<T extends BaseEntity>({ row, onDelete, onEdit }: ActionCellProps<T>) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="w-8 h-8 p-0">
          <span className="sr-only">Actions</span>
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="rtl:rtl">
        {onEdit && (
          <DropdownMenuItem onClick={() => onEdit(row)}>
            <Edit className="mr-0.5 h-4 w-4" />
            Edit
          </DropdownMenuItem>
        )}
        <DropdownMenuItem className="text-red-600" onClick={() => onDelete(row.id)}>
          <Trash className="mr-0.5 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export const createActionsColumn = <T extends BaseEntity>(
  onDelete: (id: string) => void,
  onEdit?: (row: T) => void,
): ColumnDef<T> => ({
  accessorKey: "actions",
  header: "Actions",
  cell: ({ row }) => <ActionCell row={row.original} onDelete={onDelete} onEdit={onEdit} />,
});
