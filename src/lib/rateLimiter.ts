import { and, eq } from "drizzle-orm";
import { db } from "@/server/db";
import { rateLimits } from "@/server/db/schema";
import type { RateLimits } from "@/server/db/schema";

type rateLimiterProps = {
  userId: string;
  ipAddress: string;
  mins?: number;
  attempts?: number;
};

export async function rateLimiter({
  userId,
  ipAddress,
  mins = 15,
  attempts = 5,
}: rateLimiterProps) {
  const timeLimit = mins * 60 * 1000;
  const currentTime = new Date();
  const fifteenMinutesAgo = new Date(currentTime.getTime() - timeLimit);

  // Check if a record exists for the user and IP address
  const existingRateLimit = await db
    .select()
    .from(rateLimits)
    .where(and(eq(rateLimits.userId, userId), eq(rateLimits.ipAddress, ipAddress)))
    .execute();

  if (existingRateLimit.length > 0) {
    const rateLimitRecord = existingRateLimit[0] as RateLimits;

    // Update the request count and last request time
    if (rateLimitRecord.lastRequestAt > fifteenMinutesAgo) {
      if (rateLimitRecord.requestCount >= attempts) {
        return false; // Rate limit exceeded
      }
      await db
        .update(rateLimits)
        .set({
          requestCount: rateLimitRecord.requestCount + 1,
          lastRequestAt: currentTime,
        })
        .where(eq(rateLimits.id, rateLimitRecord.id))
        .execute();
    } else {
      // Reset the count if the last request was more than 15 minutes ago
      await db
        .update(rateLimits)
        .set({
          requestCount: 1,
          lastRequestAt: currentTime,
        })
        .where(eq(rateLimits.id, rateLimitRecord.id))
        .execute();
    }
  } else {
    // Create a new record if none exists
    await db
      .insert(rateLimits)
      .values({
        userId,
        ipAddress,
        requestCount: 1,
        lastRequestAt: currentTime,
      })
      .execute();
  }

  return true; // Request allowed
}
