import { createHash } from "crypto";
import type { SubscribedEmail } from "@/server/db/schema";

/**
 * Generate a secure unsubscribe token for a subscriber
 * @param subscriber - The subscriber object
 * @returns A SHA-256 hash token
 */
export function generateUnsubscribeToken(subscriber: SubscribedEmail): string {
  const tokenData = `${subscriber.id}:${subscriber.email}:${subscriber.createdAt.getTime()}`;
  return createHash("sha256").update(tokenData).digest("hex");
}

/**
 * Verify an unsubscribe token against a list of subscribers
 * @param token - The token to verify
 * @param subscribers - Array of all subscribers
 * @returns The matching subscriber or null
 */
export function verifyUnsubscribeToken(
  token: string,
  subscribers: SubscribedEmail[],
): SubscribedEmail | null {
  return (
    subscribers.find(subscriber => {
      const expectedToken = generateUnsubscribeToken(subscriber);
      return expectedToken === token;
    }) ?? null
  );
}
