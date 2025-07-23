"use server";

import { desc } from "drizzle-orm";
import { getBlurPlaceholder } from "@/lib/optimize-image";
import { db } from "@/server/db";
import { newsletters } from "@/server/db/schema";

export async function getAllNewsletters() {
  const results = await db.select().from(newsletters).orderBy(desc(newsletters.createdAt));
  const blurNewsletterImage = await getBlurPlaceholder("/newsletter-header.png", 300, 90);

  return results.map(newsletter => ({
    ...newsletter,
    image: "/newsletter-header.png",
    blurImage: blurNewsletterImage,
  }));
}
