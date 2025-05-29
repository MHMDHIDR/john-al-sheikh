import { IconBrandMastercard, IconBrandVisa } from "@tabler/icons-react";
import clsx from "clsx";
import { ArrowUpDown, Calendar, CreditCard, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format-date";
import { formatPrice } from "@/lib/format-price";
import { translateSring } from "@/lib/translate-string";
import type { Payment } from "./payments-table";
import type { ColumnDef } from "@tanstack/react-table";
import type Stripe from "stripe";

export const paymentsColumns: ColumnDef<Payment>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        اسم المستخدم
        <ArrowUpDown className="w-4 h-4 ml-2" />
      </Button>
    ),
    cell: ({ row }) => {
      const name = row.original.name;
      return (
        <div className="flex items-center gap-2">
          <User className="size-4" />
          <span>{name}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "type",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        نوع الدفع
        <ArrowUpDown className="w-4 h-4 ml-2" />
      </Button>
    ),
    cell: ({ row }) => {
      const type = row.original.type;
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
      const amount = row.original.amount;
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
      const currency = row.original.currency;
      return currency.toUpperCase();
    },
  },
  {
    accessorKey: "paymentDetails.paymentMethod",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        طريقة الدفع
        <ArrowUpDown className="w-4 h-4 ml-2" />
      </Button>
    ),
    cell: ({ row }) => {
      const source = row.original.source;
      if (!source || typeof source === "string") return "-";

      const charge = source as unknown as { source: Stripe.Charge };
      const cardDetails = charge.source.payment_method_details?.card;

      if (!cardDetails) return "-";

      return (
        <div className="flex items-center gap-2">
          <CreditCard className="size-6" />
          <span className="flex items-center gap-1">
            {cardDetails.brand === "visa" ? (
              <IconBrandVisa className="size-6" />
            ) : cardDetails.brand === "mastercard" ? (
              <IconBrandMastercard className="size-6" />
            ) : (
              cardDetails.brand?.toUpperCase()
            )}{" "}
            •••• {cardDetails.last4}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "created",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        تاريخ الدفع
        <ArrowUpDown className="size-4 ml-2" />
      </Button>
    ),
    cell: ({ row }) => {
      const created = row.original.created;

      return (
        <div className="flex items-center gap-2">
          <Calendar className="size-4" />
          <span>{formatDate(new Date(created * 1000).toString(), true, true)}</span>
        </div>
      );
    },
  },
];
