export interface PriceWithCurrency {
  // Original price details
  id: string;
  unit_amount: number;
  currency: string;

  // Converted price details (if available)
  converted_amount?: number;
  converted_currency?: string;
  exchange_rate?: number;
}

export type CreditPackagePrices = Record<string, PriceWithCurrency | null>;
