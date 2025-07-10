import { createHash } from "crypto";
import type { SubscribedEmail, Users } from "@/server/db/schema";

// Union type for both subscriber types
type SubscriberData = SubscribedEmail | Users;

/**
 * Generate a secure unsubscribe token for a subscriber
 * @param subscriber - The subscriber object (from either table)
 * @returns A SHA-256 hash token
 */
export function generateUnsubscribeToken(subscriber: SubscriberData): string {
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
  subscribers: SubscriberData[],
): SubscriberData | null {
  return (
    subscribers.find(subscriber => {
      const expectedToken = generateUnsubscribeToken(subscriber);
      return expectedToken === token;
    }) ?? null
  );
}
