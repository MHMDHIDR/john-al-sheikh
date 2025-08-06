import { ArrowUpDown, MoreHorizontal, Trash2 } from "lucide-react";
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
import type { CombinedSubscriber } from "./subscribers-table";
import type { ColumnDef } from "@tanstack/react-table";

// Wrapper component to handle router and mutation logic
const SubscribersActionsCell: React.FC<{ user: CombinedSubscriber }> = ({ user }) => {
  const router = useRouter();
  const toast = useToast();

  const utils = api.useUtils();

  const deleteSubscriberMutation = api.subscribedEmails.deleteSubscriberByEmail.useMutation({
    onSuccess: async () => {
      toast.success("تم حذف المشترك بنجاح");
      await utils.subscribedEmails.getSubscribers.invalidate();
      router.refresh();
    },
    onError: error => {
      toast.error(`فشل حذف المشترك: ${error.message}`);
    },
    onMutate: () => {
      toast.loading("يتم حذف المشترك من القائمة البريدية...");
    },
  });

  const handleDelete = () => {
    // For admin panel, we'll use the email-based deletion which handles both cases
    deleteSubscriberMutation.mutate({ name: user.name, email: user.email });
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
        <DropdownMenuItem onClick={handleDelete}>
          <Trash2 className="mr-0.5 h-4 w-4" /> حذف
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export const subscribersColumns: ColumnDef<CombinedSubscriber>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        الاسم الكامل
        <ArrowUpDown className="size-4 ml-2" />
      </Button>
    ),
  },
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
    accessorKey: "createdAt",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        تاريخ الاشتراك
        <ArrowUpDown className="size-4 ml-2" />
      </Button>
    ),
    cell: ({ row }) => {
      const date = row.getValue("createdAt");
      return new Date(String(date)).toLocaleDateString();
    },
  },
  {
    accessorKey: "actions",
    header: "الإجراءات",
    cell: ({ row }) => <SubscribersActionsCell user={row.original} />,
  },
];
