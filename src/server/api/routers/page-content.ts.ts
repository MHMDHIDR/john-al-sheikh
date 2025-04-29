import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { checkRoleAccess } from "@/lib/check-role-access";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "@/server/api/trpc";
import { contentTypeEnum, pageContent, UserRole } from "@/server/db/schema";

export const pageContentRouter = createTRPCRouter({
  getLatestContent: publicProcedure
    .input(z.enum(contentTypeEnum.enumValues))
    .query(async ({ ctx, input }) => {
      return await ctx.db.query.pageContent.findFirst({
        where: and(eq(pageContent.type, input), eq(pageContent.isPublished, true)),
      });
    }),

  updateContent: protectedProcedure
    .input(
      z.object({
        type: z.enum(contentTypeEnum.enumValues),
        content: z.string(),
        isPublished: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const IS_AUTHORIZED = checkRoleAccess(ctx.session.user.role, [
        UserRole.SUPER_ADMIN,
        UserRole.ADMIN,
      ]);

      if (!IS_AUTHORIZED) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "غير مصرح بالوصول" });
      }

      const latest = await ctx.db.query.pageContent.findFirst({
        where: eq(pageContent.type, input.type),
      });

      if (!latest) {
        throw new TRPCError({ code: "NOT_FOUND", message: "لا يوجد محتوى للخصوصية" });
      }

      await ctx.db
        .update(pageContent)
        .set({
          type: input.type,
          content: input.content,
          isPublished: input.isPublished ?? true,
          publishedAt: new Date(),
          createdById: ctx.session.user.id,
        })
        .where(eq(pageContent.id, latest.id));
    }),
});
