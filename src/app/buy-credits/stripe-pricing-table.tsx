"use client";

export function StripePricingTable({
  pricingTableId,
  publishableKey,
  clientReferenceId,
}: {
  pricingTableId: string;
  publishableKey: string;
  clientReferenceId?: string;
}) {
  return (
    <div
      dangerouslySetInnerHTML={{
        __html: `<stripe-pricing-table
          pricing-table-id="${pricingTableId}"
          publishable-key="${publishableKey}"
          ${clientReferenceId ? `client-reference-id="${clientReferenceId}"` : ""}
        ></stripe-pricing-table>`,
      }}
    />
  );
}
