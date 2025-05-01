/**
 * Returns the correct Arabic label for the number of credits
 * @param credits - The number of credits
 * @returns The correct label for the number of credits in Arabic
 */
export function creditsLabel({ credits }: { credits: number }): string {
  // For 0 credits
  if (credits === 0) return "نقاط";

  // For 1 credit
  if (credits === 1) return "نقطة";

  // For 2 credits (dual form in Arabic)
  if (credits === 2) return "نقطتين";

  // Get the last digit of the number for numbers greater than 10
  const lastDigit = credits % 10;

  // For numbers 3-10, use plural form "نقاط"
  if (credits >= 3 && credits <= 10) return "نقاط";

  // For numbers 11-99, check the last digit
  // If the last digit is 1, use "نقطة"
  if (lastDigit === 1) return "نقطة";

  // If the last digit is 2, use "نقطة"
  if (lastDigit === 2) return "نقطة";

  // For numbers ending with 3-9, use "نقطة"
  if (lastDigit >= 3 && lastDigit <= 9) return "نقطة";

  // For numbers ending with 0, use "نقطة"
  return "نقطة";
}
