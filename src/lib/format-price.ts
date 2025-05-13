type FormatPriceProps = {
  price: number;
  minimumFractionDigits?: number;
  locale?: string;
  currency?: string;
  toPence?: boolean;
};

export function formatPrice({
  price,
  minimumFractionDigits = 2,
  locale = "en-GB",
  currency = "GBP",
  toPence = false,
}: FormatPriceProps) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits,
  }).format(price / (toPence ? 100 : 1));
}
