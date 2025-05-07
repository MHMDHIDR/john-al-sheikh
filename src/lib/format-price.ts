type FormatPriceProps = {
  price: number;
  minimumFractionDigits?: number;
  locale?: string;
  currency?: string;
};

export function formatPrice({
  price,
  minimumFractionDigits = 2,
  locale = "en-GB",
  currency = "GBP",
}: FormatPriceProps) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits,
  }).format(price);
}
