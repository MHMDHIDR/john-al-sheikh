import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { eq } from "drizzle-orm";
import { type DefaultSession, type NextAuthConfig } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";
import Twitter from "next-auth/providers/twitter";
import { Resend as ResendEmail } from "resend";
import { env } from "@/env";
import { getBlurPlaceholder } from "@/lib/optimize-image";
import { db } from "@/server/db";
import { accounts, sessions, users, verificationTokens } from "@/server/db/schema";
import type { themeEnumType, UserRoleType, Users } from "@/server/db/schema";
import type { AdapterUser } from "@auth/core/adapters";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      phone: string;
      theme: themeEnumType;
      profileCompleted: boolean;
      displayName: string;
      username: string;
      nationality: string;
      goalBand: number;
      hobbies: string[];
      gender: string;
      age: number;
    } & DefaultSession["user"];
  }
  interface User extends AdapterUser {
    role: UserRoleType;
    blurImageDataURL: string | null;
  }
}
declare module "@auth/core/adapters" {
  interface AdapterUser {
    role: UserRoleType;
    blurImageDataURL: string | null;
  }
}

const getFullImageUrl = (path: string) => {
  // If the path is already a full URL (e.g., from Google), return it as is
  if (path.startsWith("http")) return path;

  // Otherwise, ensure the path starts with a slash and combine with base URL
  const basePath = path.startsWith("/") ? path : `/${path}`;
  return `${env.NEXT_PUBLIC_APP_URL}${basePath}`;
};

const resendEmail = new ResendEmail(env.AUTH_RESEND_KEY);

export const authConfig = {
  providers: [
    Twitter,
    GoogleProvider({ allowDangerousEmailAccountLinking: true }),
    Resend({
      name: "Email",
      from: env.ADMIN_EMAIL,
      sendVerificationRequest: async params => {
        const { identifier: email, url } = params;

        try {
          const { SignInEmailTemplate } = await import("@/components/custom/signin-email");

          // Send the email using Resend
          const result = await resendEmail.emails.send({
            from: env.ADMIN_EMAIL,
            to: email,
            subject: `تسجيل الدخول إلى منصة ${env.NEXT_PUBLIC_APP_NAME} للايلتس`,
            react: SignInEmailTemplate({ url }),
          });

          if (result.error) {
            console.error("Resend error:", result.error);
            throw new Error(`Error sending verification email: ${JSON.stringify(result.error)}`);
          }
        } catch (error) {
          console.error("Error sending verification email:", error);
          throw error;
        }
      },
    }),
  ],
  pages: { signIn: "/signin", error: "/signin" },
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google" && profile) {
        try {
          // Find the user by email
          let existingUser = await db.query.users.findFirst({
            where: eq(users.email, profile.email!),
          });

          // If no user exists, create a new user
          if (!existingUser) {
            const result = await db
              .insert(users)
              .values({
                id: user.id, // Use the same user ID that will be used for the account
                name: profile.name ?? user.name ?? "Unknown",
                email: profile.email!,
                image: (profile.picture as string) ?? user.image ?? getFullImageUrl("logo.svg"),
                phone: "",
                status: "ACTIVE",
              })
              .returning();

            existingUser = result[0];
          }

          // If user exists but name is not set, then set it with Google profile name
          if (existingUser && !existingUser.name) {
            await db
              .update(users)
              .set({ name: profile.name ?? existingUser.name ?? "Unknown" })
              .where(eq(users.email, user.email!));
          }
          // If user exists but image is not set, then update it with Google profile image
          if (existingUser && !existingUser.image) {
            await db
              .update(users)
              .set({ image: (profile.picture as string) ?? getFullImageUrl("logo.svg") })
              .where(eq(users.email, user.email!));
          }

          // If no account exists for this user with Google provider, create one
          const existingAccount = existingUser
            ? await db.query.accounts.findFirst({
                where: (accounts, { and, eq }) =>
                  and(eq(accounts.userId, existingUser.id), eq(accounts.provider, "google")),
              })
            : null;

          // If no existing Google account, create a new account
          if (existingUser && !existingAccount) {
            await db.insert(accounts).values({
              userId: existingUser.id,
              type: "oauth",
              provider: "google",
              providerAccountId: account.providerAccountId,
              access_token: account.access_token,
              token_type: account.token_type,
              scope: account.scope,
              id_token: account.id_token,
            });
          }

          return true;
        } catch (error) {
          console.error("Google Sign-In Error:", error);
          return false;
        }
      }

      // Handle email provider
      if (account?.provider === "resend" && user.email) {
        try {
          // Find the user by email
          let existingUser = await db.query.users.findFirst({
            where: eq(users.email, user.email),
          });

          // If no user exists, create a new user with a default name
          if (!existingUser) {
            const username = user.email.split("@")[0];
            const result = await db
              .insert(users)
              .values({
                id: user.id, // Use the same user ID that will be used for the account
                name: username,
                email: user.email,
                image: getFullImageUrl("logo.svg"),
                phone: "",
                status: "ACTIVE",
              } as Users)
              .returning();

            existingUser = result[0];
          }

          return true;
        } catch (error) {
          console.error("Email Sign-In Error:", error);
          return false;
        }
      }

      return true;
    },
    async session({ session, user }) {
      let blurImage: string | null = null;
      if (user.image) {
        blurImage = await getBlurPlaceholder(user.image);
      }

      // Get user data from the database to ensure we have the most updated info
      const userData = await db.query.users.findFirst({
        where: eq(users.id, user.id),
      });

      return {
        ...session,
        user: {
          ...session.user,
          id: user.id,
          role: user.role,
          phone: userData?.phone ?? "",
          theme: userData?.theme ?? "light",
          blurImageDataURL: blurImage,
          nationality: userData?.nationality ?? "",
          goalBand: userData?.goalBand ?? 0,
          hobbies: userData?.hobbies ?? [],
          gender: userData?.gender ?? "male",
          age: userData?.age ?? 0,
        },
      };
    },
  },
} satisfies NextAuthConfig;
