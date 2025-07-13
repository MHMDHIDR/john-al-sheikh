import { Suspense } from "react";
import { LoadingCard } from "@/components/custom/data-table/loading";
import { AuroraText } from "@/components/magicui/aurora-text";
import { api } from "@/trpc/server";
import PaymentsTable from "./payments-table";
import type { Payment } from "./payments-table";
import type Stripe from "stripe";

export default async function Payments() {
  const { balanceTransactions } = await api.payments.getAccountBalance();
  const { count } = await api.users.getUsers({ getPremium: true });

  // Filter out payout transactions and format the data
  const paymentTransactions: Payment[] = balanceTransactions
    .filter(tx => tx.type === "charge")
    .map((tx, index) => {
      const source = tx.source as unknown as Stripe.Charge;
      const cardDetails = source?.payment_method_details?.card;

      const paymentDetails = {
        email: tx.paymentDetails?.email ?? null,
        name: tx.paymentDetails?.name ?? null,
        cardLast4: cardDetails?.last4 ?? null,
        cardBrand: cardDetails?.brand ?? null,
        paymentMethod: cardDetails
          ? `${cardDetails.brand?.toUpperCase()} •••• ${cardDetails.last4}`
          : null,
        paymentDate: new Date(tx.created * 1000).toISOString(),
      };

      return {
        id: `payment-${index}`,
        name: tx.user?.displayName ?? paymentDetails.name ?? `Payment ${index + 1}`,
        gender: tx.user.gender,
        amount: tx.amount,
        currency: tx.currency,
        type: tx.type,
        created: tx.created,
        source: tx.source,
        user: tx.user ?? undefined,
        paymentDetails,
      };
    });

  return (
    <div className="container max-w-6xl md:px-3.5 px-2 py-3 mx-auto">
      <h1 className="text-xl select-none mb-5 font-bold text-center">
        <AuroraText>يوجد {count} مستخدم مميز</AuroraText>
      </h1>

      <Suspense fallback={<LoadingCard renderedSkeletons={paymentTransactions.length ?? 1} />}>
        <PaymentsTable payments={paymentTransactions} />
      </Suspense>
    </div>
  );
}
