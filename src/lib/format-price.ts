export function formatPrice(
  price: number,
  minimumFractionDigits = 2,
  locale = "en-GB",
  currency = "GBP",
) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits,
  }).format(price);
}
