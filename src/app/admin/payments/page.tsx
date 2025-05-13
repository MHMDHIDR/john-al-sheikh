import { Suspense } from "react";
import { LoadingCard } from "@/components/custom/data-table/loading";
import { api } from "@/trpc/server";
import PaymentsTable from "./payments-table";

export default async function Payments() {
  const { balance: accountBalance } = await api.payments.getAccountBalance();

  // Combining available and pending payments with a type indicator
  const allPayments = [
    ...accountBalance.available.map((payment, index) => ({
      ...payment,
      type: "available",
      id: `available-${index}`,
      name: `Payment ${index + 1}`,
      source_types: { card: payment.source_types?.card },
    })),
    ...accountBalance.pending.map((payment, index) => ({
      ...payment,
      type: "pending",
      id: `pending-${index}`,
      name: `Pending ${index + 1}`,
      source_types: { card: payment.source_types?.card },
    })),
  ];

  return (
    <div className="container max-w-6xl md:px-3.5 px-2 py-3 mx-auto">
      <Suspense fallback={<LoadingCard renderedSkeletons={allPayments.length ?? 1} />}>
        <PaymentsTable payments={allPayments} />
      </Suspense>
    </div>
  );
}
