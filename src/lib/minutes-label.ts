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
  if (credits === 0 || credits === 1) return "دقيقة";

  if (credits === 2) return "دقيقتين";

  if (credits >= 3 && credits <= 10) return "دقائق";

  if (credits >= 11) return "دقيقة";

  return "";
}
