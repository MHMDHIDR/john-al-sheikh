import { ArrowUpDown, Ban, Check, CheckCircle, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/trpc/react";
import type { Users } from "@/server/db/schema";
import type { ColumnDef } from "@tanstack/react-table";

// Wrapper component to handle router and mutation logic
const UsersActionsCell: React.FC<{ user: Users }> = ({ user }) => {
  const router = useRouter();
  const toast = useToast();

  const utils = api.useUtils();
  const status = user.status;
  const isSuspended = user.status === "SUSPENDED";

  const updateUserMutation = api.users.update.useMutation({
    onSuccess: async () => {
      toast.success("User status updated successfully");
      await utils.users.getUsers.invalidate();
      router.refresh();
    },
    onError: error => {
      toast.error(`Failed to update user status: ${error.message}`);
    },
    onMutate: () => {
      toast.loading("Updating User...");
    },
  });

  const handleActivate = () => {
    updateUserMutation.mutate({ email: user.email, status: "ACTIVE" });
  };

  const handleSuspend = () => {
    updateUserMutation.mutate({ email: user.email, status: "SUSPENDED" });
  };

  const handleUnsuspend = () => {
    updateUserMutation.mutate({ email: user.email, status: "ACTIVE" });
  };

  const handleDelete = () => {
    updateUserMutation.mutate({ email: user.email, deletedAt: new Date() });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="w-8 h-8 p-0">
          <span className="sr-only">الإجراءات</span>
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="rtl">
        <DropdownMenuLabel className="select-none bg-accent">الإجراءات</DropdownMenuLabel>
        <DropdownMenuItem asChild>
          <Link href={`/dashboard/users/${user.id}`}>
            <Pencil className="mr-0.5 h-4 w-4" />
            عرض / تعديل
          </Link>
        </DropdownMenuItem>
        {status === "PENDING" && (
          <DropdownMenuItem onClick={handleActivate}>
            <Check className="mr-0.5 h-4 w-4" /> تفعيل
          </DropdownMenuItem>
        )}
        {status === "ACTIVE" && (
          <DropdownMenuItem onClick={handleSuspend}>
            <Ban className="mr-0.5 h-4 w-4" /> تعطيل
          </DropdownMenuItem>
        )}
        {isSuspended && (
          <DropdownMenuItem onClick={handleUnsuspend}>
            <CheckCircle className="mr-0.5 h-4 w-4" /> تفعيل
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={handleDelete}>
          <Trash2 className="mr-0.5 h-4 w-4" /> حذف
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export const userColumns: ColumnDef<Users>[] = [
  {
    accessorKey: "email",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        البريد الإلكتروني
        <ArrowUpDown className="w-4 h-4 ml-2" />
      </Button>
    ),
  },
  {
    accessorKey: "phone",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        الهاتف
        <ArrowUpDown className="w-4 h-4 ml-2" />
      </Button>
    ),
  },
  {
    accessorKey: "role",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        الدور
        <ArrowUpDown className="w-4 h-4 ml-2" />
      </Button>
    ),
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        الحالة
        <ArrowUpDown className="w-4 h-4 ml-2" />
      </Button>
    ),
    cell: ({ row }) => {
      const status = String(row.getValue("status"));
      const isDeleted = row.original.deletedAt !== null;

      return isDeleted ? "Deleted" : status.charAt(0) + status.slice(1).toLowerCase();
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        تاريخ الإنشاء
        <ArrowUpDown className="w-4 h-4 ml-2" />
      </Button>
    ),
    cell: ({ row }) => {
      const date = row.getValue("createdAt");
      return new Date(String(date)).toLocaleDateString();
    },
  },
  {
    accessorKey: "updatedAt",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        تاريخ التحديث
        <ArrowUpDown className="w-4 h-4 ml-2" />
      </Button>
    ),
    cell: ({ row }) => {
      const date = row.getValue("updatedAt");
      return new Date(String(date)).toLocaleDateString();
    },
  },
  {
    accessorKey: "actions",
    header: "الإجراءات",
    cell: ({ row }) => <UsersActionsCell user={row.original} />,
  },
];
