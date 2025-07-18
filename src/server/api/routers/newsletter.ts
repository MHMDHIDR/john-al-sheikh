import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { getBlurPlaceholder } from "@/lib/optimize-image";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { db } from "@/server/db";
import { newsletters } from "@/server/db/schema";

export const newsletterRouter = createTRPCRouter({
  getAllNewsletters: publicProcedure.query(async () => {
    const results = await db.select().from(newsletters).orderBy(desc(newsletters.createdAt));
    const blurNewsletterImage = await getBlurPlaceholder("/newsletter-header.png", 300, 90);

    return results.map(newsletter => ({
      ...newsletter,
      image: "/newsletter-header.png",
      blurImage: blurNewsletterImage,
    }));
  }),

  getNewsletterBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const [newsletter] = await db
        .select()
        .from(newsletters)
        .where(eq(newsletters.id, input.slug))
        .limit(1);
      if (!newsletter) throw new Error("Newsletter not found");

      const blurNewsletterImage = await getBlurPlaceholder("/newsletter-header.png", 300, 90);
      return {
        ...newsletter,
        image: "/newsletter-header.png",
        blurImage: blurNewsletterImage,
      };
    }),
});
