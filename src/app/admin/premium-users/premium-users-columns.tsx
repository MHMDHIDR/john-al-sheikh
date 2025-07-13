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
];
