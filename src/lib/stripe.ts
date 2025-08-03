import Stripe from "stripe";
import "server-only";
import { env } from "@/env";
import { PriceIDs } from "./stripe-client";

// Server-only Stripe instance
export const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-07-30.basil",
});

// Re-export PriceIDs from stripe-client for compatibility
export { PriceIDs };
export { Minutes, minutePackages, type PackageInfo } from "./stripe-client";
