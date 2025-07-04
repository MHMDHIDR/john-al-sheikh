import type { UserRoleType } from "@/server/db/schema";
import type Stripe from "stripe";

export const calculateTotalBalance = (balance: Stripe.Balance) => {
  const availableTotal = balance.available.reduce((sum, item) => sum + item.amount, 0);
  const pendingTotal = balance.pending.reduce((sum, item) => sum + item.amount, 0);

  // Total balance = available + pending (since pending will be added to available once it clears)
  return availableTotal + pendingTotal;
};

// Helper function to extract user emails from balance transactions
export const extractUserEmails = (transactions: Stripe.BalanceTransaction[]) => {
  return transactions
    .filter(tx => {
      const source = tx.source as Stripe.Charge;
      return source?.object === "charge" && source?.billing_details?.email;
    })
    .map(tx => (tx.source as Stripe.Charge).billing_details.email)
    .filter((email): email is string => email !== null);
};

// Helper function to create user map for quick lookup
export const createUserMap = (
  users: Array<{
    id: string;
    name: string;
    email: string;
    displayName: string | null;
    role: UserRoleType;
  }>,
) => {
  return new Map(users.filter(user => user.role === "USER").map(user => [user.email, user]));
};

// Helper function to enhance transactions with user details
export const enhanceTransactions = (
  transactions: Stripe.BalanceTransaction[],
  userMap: Map<
    string,
    { id: string; name: string; email: string; displayName: string | null; role: UserRoleType }
  >,
) => {
  return transactions
    .map(tx => {
      const source = tx.source as Stripe.Charge;
      const userEmail = source?.billing_details?.email;
      const userDetails = userEmail ? userMap.get(userEmail) : null;

      // Only include transactions where the user role is "USER"
      if (!userDetails || userDetails.role !== "USER") return null;

      return {
        id: tx.id,
        amount: tx.amount,
        currency: tx.currency,
        created: tx.created,
        status: tx.status,
        type: tx.type,
        source: tx,
        description: tx.description,
        paymentDetails: {
          email: source?.billing_details?.email,
          name: source?.billing_details?.name,
          cardLast4: source?.payment_method_details?.card?.last4,
          cardBrand: source?.payment_method_details?.card?.brand,
        },
        user: {
          id: userDetails.id,
          name: userDetails.name,
          displayName: userDetails.displayName,
          email: userDetails.email,
        },
      };
    })
    .filter((tx): tx is NonNullable<typeof tx> => tx !== null);
};
