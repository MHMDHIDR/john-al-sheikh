import { api } from "@/trpc/server";
import type { PriceWithCurrency } from "@/lib/types";

// Cache for server-rendered prices
const priceCache: Record<string, PriceWithCurrency> = {};

/**
 * Server-side function: Fetches adaptive price from Stripe using tRPC
 * This must be called from a Server Component
 *
 * @param priceId - The Stripe price ID
 * @param userCountry - The ISO country code for localization
 * @returns The price with currency conversion information
 */
export async function getAdaptivePrice(
  priceId: string,
  userCountry: string,
): Promise<PriceWithCurrency | null> {
  // Check cache first
  const cacheKey = `${priceId}_${userCountry || "default"}`;
  if (priceCache[cacheKey]) {
    return priceCache[cacheKey];
  }

  try {
    const price = await api.payments.getAdaptivePrice({ priceId, country: userCountry });

    // Cache the result so we don't need to call the API again
    if (price) {
      priceCache[cacheKey] = price;
    }

    return price;
  } catch (error) {
    console.error("Error fetching adaptive price:", error);
    return null;
  }
}
