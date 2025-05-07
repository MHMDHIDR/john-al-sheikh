export type PriceWithCurrency = {
  id: string;
  unit_amount: number;
  currency: string;
  converted_amount?: number;
  converted_currency?: string;
  exchange_rate?: number;
};

export type CreditPackagePrices = Record<string, PriceWithCurrency | null>;
