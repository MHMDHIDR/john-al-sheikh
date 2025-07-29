import { TRPCError } from "@trpc/server";
import { desc, eq, isNotNull, sql } from "drizzle-orm";
import { z } from "zod";
import { checkRoleAccess } from "@/lib/check-role-access";
import { createVapiClient, getAllVapiKeysInOrder } from "@/lib/vapi.server.sdk";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { speakingTests, UserRole, users } from "@/server/db/schema";

export const vapiRouter = createTRPCRouter({
  getConversationRecordings: protectedProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(100).default(50),
          offset: z.number().min(0).default(0),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const IS_AUTHORIZED = checkRoleAccess(ctx.session.user.role, [
        UserRole.SUPER_ADMIN,
        UserRole.ADMIN,
      ]);

      if (!IS_AUTHORIZED) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "غير مصرح بالوصول" });
      }

      const limit = input?.limit ?? 50;
      const offset = input?.offset ?? 0;

      // Get speaking tests with call IDs and user information
      const recordings = await ctx.db
        .select({
          id: speakingTests.id,
          type: speakingTests.type,
          callId: speakingTests.callId,
          createdAt: speakingTests.createdAt,
          user: {
            id: users.id,
            name: users.name,
            username: users.username,
            phone: users.phone,
            displayName: users.displayName,
            email: users.email,
            gender: users.gender,
          },
        })
        .from(speakingTests)
        .innerJoin(users, eq(speakingTests.userId, users.id))
        .where(isNotNull(speakingTests.callId))
        .orderBy(desc(speakingTests.createdAt))
        .limit(limit)
        .offset(offset);

      // Get total count
      const countResult = await ctx.db
        .select({ count: sql<number>`count(*)::int` })
        .from(speakingTests)
        .where(isNotNull(speakingTests.callId));

      return {
        recordings,
        totalCount: countResult[0]?.count ?? 0,
      };
    }),

  getRecordingById: protectedProcedure
    .input(z.object({ callId: z.string() }))
    .query(async ({ ctx, input }) => {
      const IS_AUTHORIZED = checkRoleAccess(ctx.session.user.role, [
        UserRole.SUPER_ADMIN,
        UserRole.ADMIN,
      ]);

      if (!IS_AUTHORIZED) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "غير مصرح بالوصول" });
      }

      const recording = await ctx.db
        .select({
          id: speakingTests.id,
          topic: speakingTests.topic,
          type: speakingTests.type,
          callId: speakingTests.callId,
          transcription: speakingTests.transcription,
          createdAt: speakingTests.createdAt,
          user: {
            id: users.id,
            name: users.name,
            displayName: users.displayName,
            email: users.email,
          },
        })
        .from(speakingTests)
        .innerJoin(users, eq(speakingTests.userId, users.id))
        .where(eq(speakingTests.callId, input.callId))
        .limit(1);

      if (!recording.length) {
        throw new TRPCError({ code: "NOT_FOUND", message: "التسجيل غير موجود" });
      }

      return recording[0];
    }),

  getRecordingUrl: protectedProcedure
    .input(z.object({ callId: z.string() }))
    .query(async ({ ctx, input }) => {
      const IS_AUTHORIZED = checkRoleAccess(ctx.session.user.role, [
        UserRole.SUPER_ADMIN,
        UserRole.ADMIN,
      ]);

      if (!IS_AUTHORIZED) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "غير مصرح بالوصول" });
      }

      const vapiKeys = getAllVapiKeysInOrder();
      let lastError: unknown = null;

      for (const key of vapiKeys) {
        try {
          const vapiClient = createVapiClient(key);
          const call = await vapiClient.calls.get(input.callId);
          const recordingUrl = call.artifact?.recordingUrl;

          if (recordingUrl) {
            return {
              recordingUrl,
              stereoRecordingUrl: call.artifact?.stereoRecordingUrl,
              transcript: call.artifact?.transcript,
              summary: call.analysis?.summary,
            };
          }
        } catch (error) {
          lastError = error;
        }
      }

      // If none of the keys worked, throw a not found error
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "لم يتم العثور على رابط التسجيل بأي من المفاتيح المتاحة",
        cause: lastError,
      });
    }),
});
