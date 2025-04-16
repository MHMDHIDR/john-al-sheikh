import { TRPCError } from "@trpc/server";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { accountFormSchema } from "@/app/schemas/account";
import { onboardingSchema } from "@/app/schemas/onboarding";
import { extractS3FileName } from "@/lib/extract-s3-filename";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { users } from "@/server/db/schema";

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
      const { displayName, username, gender, age, phone, nationality, hobbies, profileImage } =
        input;

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
          age,
          phone,
          nationality,
          hobbies,
          ...(profileImage && { image: profileImage }),
          profileCompleted: true,
          updatedAt: new Date(),
        })
        .where(eq(users.id, ctx.session.user.id))
        .returning();

      return updatedUser;
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
});
