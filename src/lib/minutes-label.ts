/**
 * Converts credits to minutes based on the mapping in stripe-client.ts
 * 1 credit = 5 minutes
 * @param credits - The number of credits
 * @returns The number of minutes
 */
export function creditsToMinutes(credits: number): number {
  return credits * 5;
}

/**
 * Returns the correct Arabic label for the number of minutes represented by credits
 * @param credits - The number of credits
 * @returns The correct label for the number of minutes in Arabic
 */
export function minutesLabel({ credits }: { credits: number }): string {
  const minutes = creditsToMinutes(credits);
  if (minutes === 0) return "دقائق";
  if (minutes === 1) return "دقيقة";
  if (minutes === 2) return "دقيقتين";
  if (minutes >= 3 && minutes <= 10) return "دقائق";
  const lastDigit = minutes % 10;
  if (lastDigit === 1) return "دقيقة";
  if (lastDigit === 2) return "دقيقتين";
  if (lastDigit >= 3 && lastDigit <= 9) return "دقيقة";
  return "دقيقة";
}
