export function formatPrice(
  price: number,
  minimumFractionDigits = 2,
  locale = "en-GB",
  currency = "GBP",
) {
  const localeLang = navigator.geolocation;

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits,
  }).format(price);
}
