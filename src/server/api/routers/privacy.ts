import { TRPCError } from "@trpc/server";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { checkRoleAccess } from "@/lib/check-role-access";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "@/server/api/trpc";
import { privacyContent, UserRole } from "@/server/db/schema";

export const privacyRouter = createTRPCRouter({
  getLatestContent: publicProcedure.query(async ({ ctx }) => {
    return await ctx.db.query.privacyContent.findFirst({
      where: (privacyContent, { eq }) => eq(privacyContent.isPublished, true),
    });
  }),

  updateContent: protectedProcedure
    .input(z.object({ content: z.string(), isPublished: z.boolean().optional() }))
    .mutation(async ({ ctx, input }) => {
      const IS_AUTHORIZED = checkRoleAccess(ctx.session.user.role, [
        UserRole.SUPER_ADMIN,
        UserRole.ADMIN,
      ]);

      if (!IS_AUTHORIZED) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "غير مصرح بالوصول" });
      }

      const latest = await ctx.db.query.privacyContent.findFirst({
        orderBy: [desc(privacyContent.version)],
      });

      if (!latest) {
        throw new TRPCError({ code: "NOT_FOUND", message: "لا يوجد محتوى للخصوصية" });
      }

      await ctx.db
        .update(privacyContent)
        .set({
          content: input.content,
          version: latest.version,
          isPublished: input.isPublished ?? true,
          publishedAt: new Date(),
          createdById: ctx.session.user.id,
        })
        .where(eq(privacyContent.id, latest.id));
    }),
});
