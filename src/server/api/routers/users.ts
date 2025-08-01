import { TRPCError } from "@trpc/server";
import { and, eq, like, sql } from "drizzle-orm";
import { z } from "zod";
import { accountFormSchema } from "@/app/schemas/account";
import { onboardingSchema } from "@/app/schemas/onboarding";
import { extractS3FileName } from "@/lib/extract-s3-filename";
import { normalizeGmailAddress } from "@/lib/is-valid";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "@/server/api/trpc";
import { creditTransactions, speakingTests, users } from "@/server/db/schema";

const onboardingModifiedSchema = onboardingSchema
  .omit({ profileImage: true })
  .extend({ profileImage: z.string().optional() });

export const usersRouter = createTRPCRouter({
  getById: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    return await ctx.db.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, input.id),
    });
  }),

  getUsers: protectedProcedure
    .input(z.object({ getPremium: z.boolean() }).optional())
    .query(async ({ ctx, input }) => {
      const isPremium = input?.getPremium === true;

      if (isPremium) {
        // Get premium users from credit transactions with PURCHASE type and live Stripe payment IDs
        const premiumUsersQuery = await ctx.db
          .select({
            user: users,
          })
          .from(creditTransactions)
          .innerJoin(users, eq(creditTransactions.userId, users.id))
          .where(
            and(
              eq(creditTransactions.type, "PURCHASE"),
              like(creditTransactions.stripePaymentId, "cs_live%"),
              eq(users.role, "USER"),
            ),
          )
          .groupBy(users.id); // Group by user ID to avoid duplicates

        // Get count of premium users
        const [{ count = 0 } = { count: 0 }] = await ctx.db
          .select({ count: sql<number>`count(DISTINCT ${users.id})::int` })
          .from(creditTransactions)
          .innerJoin(users, eq(creditTransactions.userId, users.id))
          .where(
            and(
              eq(creditTransactions.type, "PURCHASE"),
              like(creditTransactions.stripePaymentId, "cs_live%"),
              eq(users.role, "USER"),
            ),
          );

        return {
          users: premiumUsersQuery.map(row => row.user),
          count,
        };
      } else {
        // Get all regular users
        const usersList = await ctx.db.query.users.findMany({
          where: (users, { eq }) => eq(users.role, "USER"),
        });

        const [{ count = 0 } = { count: 0 }] = await ctx.db
          .select({ count: sql<number>`count(*)::int` })
          .from(users)
          .where(eq(users.role, "USER"));

        return { users: usersList, count };
      }
    }),

  /** Count unique users who have taken speaking tests */
  getTotalTestUsers: protectedProcedure.query(async ({ ctx }) => {
    const speakingTestUser = await ctx.db.query.speakingTests.findMany({ with: { user: true } });

    // Get unique users who took the test, with their latest test date and test count
    const uniqueTestUsers = await ctx.db
      .select({
        user: users,
        latestTestDate: sql<string>`max(${speakingTests.createdAt})::text`,
        testCount: sql<number>`count(${speakingTests.id})::int`,
      })
      .from(speakingTests)
      .innerJoin(users, eq(speakingTests.userId, users.id))
      .groupBy(users.id);

    const [{ count = 0 } = { count: 0 }] = await ctx.db
      .select({ count: sql<number>`count(distinct ${speakingTests.userId})::int` })
      .from(speakingTests);

    return { speakingTestUser, uniqueTestUsers, count };
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

    const newPhone = input.phone;
    const isPhoneChanged = newPhone && existingUser.phone !== newPhone;
    if (isPhoneChanged) {
      const phoneExists = await ctx.db.query.users.findFirst({
        where: (users, { eq }) => eq(users.phone, newPhone),
      });

      if (phoneExists && phoneExists.id !== ctx.session.user.id) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "لا يمكن استخدام رقم الهاتف هذا" });
      }
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
        ...(input.goalBand && { goalBand: input.goalBand }),
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
      const { displayName, username, email, gender, goalBand, phone, hobbies, profileImage } =
        input;

      // Check if username is already taken
      const usernameExists = await ctx.db.query.users.findFirst({
        where: (users, { eq }) => eq(users.username, username),
      });

      const phoneExists = await ctx.db.query.users.findFirst({
        where: (users, { eq }) => eq(users.phone, phone),
      });

      if (usernameExists && usernameExists.id !== ctx.session.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "اسم المستخدم مستخدم بالفعل، يرجى اختيار اسم آخر",
        });
      }

      if (phoneExists && phoneExists.id !== ctx.session.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "رقم الهاتف مستخدم بالفعل، يرجى استخدام رقم هاتف آخر",
        });
      }

      // Check if email is already taken (if email is provided)
      if (email) {
        const normalizedEmail = normalizeGmailAddress(email);
        const emailExists = await ctx.db.query.users.findFirst({
          where: (users, { eq }) => eq(users.email, normalizedEmail),
        });

        if (emailExists && emailExists.id !== ctx.session.user.id) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "البريد الإلكتروني مستخدم بالفعل، يرجى استخدام بريد إلكتروني آخر",
          });
        }
      }

      // Update user with onboarding data
      const [updatedUser] = await ctx.db
        .update(users)
        .set({
          displayName,
          username,
          ...(email && { email: normalizeGmailAddress(email) }),
          gender,
          goalBand,
          phone,
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

  checkEmailAvailability: protectedProcedure
    .input(z.object({ email: z.string() }))
    .query(async ({ ctx, input }) => {
      const { email } = input;

      // Normalize the email address (handles Gmail variations)
      const normalizedEmail = normalizeGmailAddress(email);

      // First, try exact match with normalized email
      let emailExists = await ctx.db.query.users.findFirst({
        where: (users, { eq }) => eq(users.email, normalizedEmail),
      });

      // If no exact match, check if any existing email normalizes to the same value
      if (!emailExists) {
        const allUsers = await ctx.db.query.users.findMany({
          where: (users, { isNotNull }) => isNotNull(users.email),
        });

        emailExists = allUsers.find(user => {
          if (!user.email) return false;
          const userNormalizedEmail = normalizeGmailAddress(user.email);
          const isMatch = userNormalizedEmail === normalizedEmail;
          return isMatch;
        });
      }

      const isAvailable = !emailExists || emailExists.id === ctx.session.user.id;

      // Return true if email is available, false if it's taken
      return {
        isAvailable,
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
          where: (tests, { eq, and }) =>
            and(eq(tests.id, input.testId), eq(tests.userId, ctx.session.user.id)),
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

  getPublicTestById: publicProcedure
    .input(z.object({ testId: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        const test = await ctx.db.query.speakingTests.findFirst({
          where: (tests, { eq }) => eq(tests.id, input.testId),
          with: { user: true },
        });

        if (!test) {
          return null;
        }

        // Return limited data for public sharing
        return {
          id: test.id,
          type: test.type,
          band: test.band ?? 0,
          feedback: test.feedback,
          createdAt: test.createdAt,
          user: {
            username: test.user.username,
            displayName: test.user.displayName,
            image: test.user.image,
          },
        };
      } catch (error) {
        console.error("Error fetching public test details:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch test details",
        });
      }
    }),
});
