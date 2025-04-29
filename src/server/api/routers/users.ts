import { TRPCError } from "@trpc/server";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { accountFormSchema } from "@/app/schemas/account";
import { onboardingSchema } from "@/app/schemas/onboarding";
import { extractS3FileName } from "@/lib/extract-s3-filename";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { speakingTests, users } from "@/server/db/schema";

const onboardingModifiedSchema = onboardingSchema
  .omit({ profileImage: true })
  .extend({ profileImage: z.string().optional() });

export const usersRouter = createTRPCRouter({
  getById: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    return await ctx.db.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, input.id),
    });
  }),

  getUsers: protectedProcedure.query(async ({ ctx }) => {
    const usersList = await ctx.db.query.users.findMany();
    const [{ count = 0 } = { count: 0 }] = await ctx.db
      .select({ count: sql<number>`count(*)::int` })
      .from(users);

    return { users: usersList, count };
  }),

  update: protectedProcedure.input(accountFormSchema).mutation(async ({ ctx, input }) => {
    // Find user by id or email
    const whereClause = input.id ? eq(users.id, input.id) : eq(users.email, input.email!);
    const existingUser = await ctx.db.query.users.findFirst({
      where: () => whereClause,
    });

    if (!existingUser) {
      throw new TRPCError({ code: "NOT_FOUND", message: "User not found!" });
    }

    // Update user with provided fields
    const [updatedUser] = await ctx.db
      .update(users)
      .set({
        ...(input.name && { name: input.name }),
        ...(input.phone && { phone: input.phone }),
        ...(input.theme && { theme: input.theme }),
        ...(input.image && { image: input.image }),
        ...(input.status && { status: input.status }),
        ...(input.deletedAt && { deletedAt: input.deletedAt }),
        updatedAt: new Date(),
      })
      .where(whereClause)
      .returning();

    return updatedUser;
  }),

  checkProfileCompletion: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, ctx.session.user.id),
    });

    if (!user) {
      throw new TRPCError({ code: "NOT_FOUND", message: "User not found!" });
    }

    return {
      isComplete: user.profileCompleted || false,
      user,
    };
  }),

  onboardUser: protectedProcedure
    .input(onboardingModifiedSchema)
    .mutation(async ({ ctx, input }) => {
      const { displayName, username, gender, goalBand, hobbies, profileImage } = input;

      // Check if username is already taken
      const usernameExists = await ctx.db.query.users.findFirst({
        where: (users, { eq }) => eq(users.username, username),
      });

      if (usernameExists && usernameExists.id !== ctx.session.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "اسم المستخدم مستخدم بالفعل، يرجى اختيار اسم آخر",
        });
      }

      // Update user with onboarding data
      const [updatedUser] = await ctx.db
        .update(users)
        .set({
          displayName,
          username,
          gender,
          goalBand,
          hobbies,
          ...(profileImage && { image: profileImage }),
          profileCompleted: true,
          updatedAt: new Date(),
        })
        .where(eq(users.id, ctx.session.user.id))
        .returning();

      return updatedUser;
    }),

  checkUsernameAvailability: protectedProcedure
    .input(z.object({ username: z.string() }))
    .query(async ({ ctx, input }) => {
      const { username } = input;

      // Check if username is already taken
      const usernameExists = await ctx.db.query.users.findFirst({
        where: (users, { eq }) => eq(users.username, username),
      });

      // Return true if username is available, false if it's taken
      return {
        isAvailable: !usernameExists || usernameExists.id === ctx.session.user.id,
      };
    }),

  deleteProfileImage: protectedProcedure.mutation(async ({ ctx }) => {
    const user = await ctx.db.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, ctx.session.user.id),
    });

    if (!user?.image) {
      return { success: false };
    }

    // Extract S3 file name from image URL
    const fileName = extractS3FileName(user.image);
    if (!fileName) {
      return { success: false };
    }

    // Update user record to remove image
    await ctx.db
      .update(users)
      .set({
        image: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, ctx.session.user.id));

    return { success: true, fileName };
  }),

  getUserTestStats: protectedProcedure.query(async ({ ctx }) => {
    // Get count of tests by type
    const testCounts = await ctx.db
      .select({
        type: speakingTests.type,
        count: sql<number>`count(*)::int`,
      })
      .from(speakingTests)
      .where(eq(speakingTests.userId, ctx.session.user.id))
      .groupBy(speakingTests.type);

    // Get average score by test type
    const averageScores = await ctx.db
      .select({
        type: speakingTests.type,
        average: sql<number>`avg(${speakingTests.band})::numeric(10,1)`,
      })
      .from(speakingTests)
      .where(eq(speakingTests.userId, ctx.session.user.id))
      .groupBy(speakingTests.type);

    // Get the highest band score
    const highestScore = await ctx.db
      .select({
        highestBand: sql<number>`max(${speakingTests.band})::numeric(10,1)`,
      })
      .from(speakingTests)
      .where(eq(speakingTests.userId, ctx.session.user.id));

    // Get recent improvement trend (last 5 tests)
    const recentTests = await ctx.db
      .select({
        id: speakingTests.id,
        band: speakingTests.band,
        createdAt: speakingTests.createdAt,
      })
      .from(speakingTests)
      .where(eq(speakingTests.userId, ctx.session.user.id))
      .orderBy(sql`${speakingTests.createdAt} desc`)
      .limit(5);

    // Calculate improvement trend
    let trend = 0;
    if (recentTests.length >= 2) {
      const latestScore = recentTests[0]?.band ?? 0;
      const earliestScore = recentTests[recentTests.length - 1]?.band ?? 0;
      trend = Number(latestScore) - Number(earliestScore);
    }

    // Get total count of all tests
    const [{ totalCount = 0 } = { totalCount: 0 }] = await ctx.db
      .select({ totalCount: sql<number>`count(*)::int` })
      .from(speakingTests)
      .where(eq(speakingTests.userId, ctx.session.user.id));

    return {
      testCounts,
      averageScores,
      highestScore: highestScore[0]?.highestBand ?? 0,
      trend,
      totalCount,
      recentTests,
    };
  }),

  getUserTestHistory: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db
      .select()
      .from(speakingTests)
      .where(eq(speakingTests.userId, ctx.session.user.id))
      .orderBy(sql`${speakingTests.createdAt} desc`);
  }),

  getTestById: protectedProcedure
    .input(z.object({ testId: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        const test = await ctx.db.query.speakingTests.findFirst({
          where: (tests, { eq }) =>
            eq(tests.id, input.testId) && eq(tests.userId, ctx.session.user.id),
          with: { user: true },
        });

        if (!test) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Test not found or you don't have access to it",
          });
        }

        return test;
      } catch (error) {
        console.error("Error fetching test details:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch test details",
        });
      }
    }),
});
