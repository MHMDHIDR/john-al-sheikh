import { ArrowUpDown, Check, CheckCircle, MoreHorizontal, Pencil } from "lucide-react";
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
const PremiumUsersActionsCell: React.FC<{ user: Users }> = ({ user }) => {
  const router = useRouter();
  const toast = useToast();

  const utils = api.useUtils();
  const status = user.status;
  const isSuspended = user.status === "SUSPENDED";

  const updateUserMutation = api.users.update.useMutation({
    onSuccess: async () => {
      toast.success("تم تحديث حالة المستخدم بنجاح");
      await utils.users.getUsers.invalidate();
      router.refresh();
    },
    onError: error => {
      toast.error(`فشل تحديث حالة المستخدم: ${error.message}`);
    },
    onMutate: () => {
      toast.loading("يتم تحديث حالة المستخدم...");
    },
  });

  const handleActivate = () => {
    updateUserMutation.mutate({ email: user.email, status: "ACTIVE" });
  };

  const handleUnsuspend = () => {
    updateUserMutation.mutate({ email: user.email, status: "ACTIVE" });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="size-8 p-0">
          <span className="sr-only">الإجراءات</span>
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="rtl">
        <DropdownMenuLabel className="select-none bg-accent">الإجراءات</DropdownMenuLabel>
        <DropdownMenuItem asChild>
          <Link href={`/dashboard/users/${user.id}`}>
            <Pencil className="mr-0.5 size-4" />
            عرض / تعديل
          </Link>
        </DropdownMenuItem>
        {status === "PENDING" && (
          <DropdownMenuItem onClick={handleActivate}>
            <Check className="mr-0.5 size-4" /> تفعيل
          </DropdownMenuItem>
        )}
        {isSuspended && (
          <DropdownMenuItem onClick={handleUnsuspend}>
            <CheckCircle className="mr-0.5 size-4" /> تفعيل
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export const premiumUserColumns: ColumnDef<Users>[] = [
  {
    accessorKey: "email",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        البريد الإلكتروني
        <ArrowUpDown className="size-4 ml-2" />
      </Button>
    ),
  },
  {
    accessorKey: "credits",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        رصيد الحساب
        <ArrowUpDown className="size-4 ml-2" />
      </Button>
    ),
    cell: ({ row }) => {
      const credits = row.getValue("credits");
      return credits ?? "لا يوجد";
    },
  },
  {
    accessorKey: "phone",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        الهاتف
        <ArrowUpDown className="size-4 ml-2" />
      </Button>
    ),
    cell: ({ row }) => {
      const phone = row.getValue("phone");
      return phone ?? "لا يوجد";
    },
  },
  {
    accessorKey: "role",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        صلاحية المستخدم
        <ArrowUpDown className="size-4 ml-2" />
      </Button>
    ),
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        الحالة
        <ArrowUpDown className="size-4 ml-2" />
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
        <ArrowUpDown className="size-4 ml-2" />
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
        <ArrowUpDown className="size-4 ml-2" />
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
    cell: ({ row }) => <PremiumUsersActionsCell user={row.original} />,
  },
];
