"use client";

import { DataTable } from "@/components/custom/data-table";
import { paymentsColumns } from "./payments-columns";
import type { BaseEntity } from "@/components/custom/data-table/base-columns";

export interface Payment extends BaseEntity {
  amount: number;
  currency: string;
  source_types: { card: number | undefined };
  type: string;
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
