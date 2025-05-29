"use client";

import { DataTable } from "@/components/custom/data-table";
import { paymentsColumns } from "./payments-columns";
import type { BaseEntity } from "@/components/custom/data-table/base-columns";
import type Stripe from "stripe";

export interface Payment extends BaseEntity {
  amount: number;
  currency: string;
  source: Stripe.BalanceTransaction;
  type: string;
  created: number;
  user?: {
    id: string;
    name: string;
    displayName: string | null;
    email: string;
  } | null;
  paymentDetails: {
    email: string | null;
    name: string | null;
    cardLast4: string | null;
    cardBrand: string | null;
    paymentMethod: string | null;
    paymentDate: string | null;
  };
}

export default function PaymentsTable({ payments }: { payments: Payment[] }) {
  return (
    <DataTable<Payment>
      columns={paymentsColumns}
      data={payments}
      emptyStateMessage="No payments found."
      exportFilename="payments_export"
    />
  );
}
