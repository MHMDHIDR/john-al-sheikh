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
import type { SubscribedEmail } from "@/server/db/schema";
import type { ColumnDef } from "@tanstack/react-table";

// Wrapper component to handle router and mutation logic
const SubscribersActionsCell: React.FC<{ user: SubscribedEmail }> = ({ user }) => {
  const router = useRouter();
  const toast = useToast();

  const utils = api.useUtils();

  const deleteSubscriberMutation = api.subscribedEmails.deleteSubscriber.useMutation({
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
    deleteSubscriberMutation.mutate({ name: user.fullname, email: user.email });
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

export const subscribersColumns: ColumnDef<SubscribedEmail>[] = [
  {
    accessorKey: "fullname",
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
    accessorKey: "ieltsGoal",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        هدف الايلتس
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
