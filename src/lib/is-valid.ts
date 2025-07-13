/**
 * Utility functions for validation
 */

/**
 * Normalizes a Gmail address by removing dots and everything after the plus sign
 * Gmail treats these as the same email:
 * - user@gmail.com
 * - u.s.e.r@gmail.com (dots are ignored)
 * - user+anything@gmail.com (plus and everything after is ignored)
 * - user+test+more@gmail.com (multiple plus signs work too)
 *
 * @param email - The email address to normalize
 * @returns The normalized email address
 */
export function normalizeGmailAddress(email: string): string {
  if (!email || typeof email !== "string") {
    return email;
  }

  const lowerEmail = email.toLowerCase().trim();

  // Check if it's a Gmail address
  if (!lowerEmail.endsWith("@gmail.com")) {
    return lowerEmail;
  }

  // Split into local part and domain
  const [localPart, domain] = lowerEmail.split("@");

  if (!localPart || !domain) {
    return lowerEmail;
  }

  // Remove all dots from the local part
  const withoutDots = localPart.replace(/\./g, "");

  // Remove everything after the first plus sign (including the plus)
  const withoutPlus = withoutDots.split("+")[0];

  // Reconstruct the email
  return `${withoutPlus}@${domain}`;
}

/**
 * Checks if an email is valid and optionally normalizes Gmail addresses
 * @param email - The email address to validate
 * @param normalizeGmail - Whether to normalize Gmail addresses (default: true)
 * @returns The normalized email if valid, null if invalid
 */
export function isValidEmail(email: string, normalizeGmail = true): string | null {
  if (!email || typeof email !== "string") {
    return null;
  }

  const trimmedEmail = email.trim();

  // Basic email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmedEmail)) {
    return null;
  }

  // Normalize Gmail addresses if requested
  if (normalizeGmail) {
    return normalizeGmailAddress(trimmedEmail);
  }

  return trimmedEmail.toLowerCase();
}

/**
 * Compares two email addresses, normalizing Gmail addresses for comparison
 * @param email1 - First email address
 * @param email2 - Second email address
 * @returns true if the emails are equivalent after normalization
 */
export function areEmailsEquivalent(email1: string, email2: string): boolean {
  const normalized1 = normalizeGmailAddress(email1);
  const normalized2 = normalizeGmailAddress(email2);

  return normalized1 === normalized2;
}

/**
 * Test function to verify Gmail normalization
 * @param email - Email to test
 * @returns Normalized email
 */
export function testGmailNormalization(email: string): string {
  const normalized = normalizeGmailAddress(email);
  return normalized;
}

/**
 * Examples of Gmail variations that are treated as the same:
 * - user@gmail.com
 * - u.s.e.r@gmail.com
 * - user+test@gmail.com
 * - user+test+more@gmail.com
 * - USER@gmail.com
 * - User@gmail.com
 *
 * All of these would normalize to: user@gmail.com
 */
