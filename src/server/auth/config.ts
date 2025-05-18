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
import type { themeEnumType, UserRoleType } from "@/server/db/schema";
import type { AdapterAccount, AdapterUser } from "@auth/core/adapters";

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
  debug: process.env.NODE_ENV === "development",
  providers: [
    Twitter({ allowDangerousEmailAccountLinking: true }),
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
      // First, ensure user has an email
      if (!user.email) {
        console.error("Sign-in failed: User email is missing");
        return false;
      }

      if ((account?.provider === "google" || account?.provider === "twitter") && profile) {
        try {
          // Find the user by email
          let existingUser = await db.query.users.findFirst({
            where: eq(users.email, user.email),
          });

          // If no user exists, create a new user
          if (!existingUser) {
            // Safely prepare user data, avoiding undefined values
            // Ensure all required fields are defined with non-nullable values
            const userData: typeof users.$inferInsert = {
              id: user.id!, // Non-null assertion since we know user has an ID at this point
              name: String(profile.name ?? user.name ?? "Unknown"),
              email: user.email,
              image: user.image ?? getFullImageUrl("logo.svg"),
              phone: "",
              status: "ACTIVE",
            };

            const result = await db.insert(users).values(userData).returning();

            existingUser = result[0];
          }

          // If user exists but name is not set, then set it with provider profile name
          if (existingUser && !existingUser.name) {
            const name = (profile.name ?? user.name ?? existingUser.name ?? "Unknown").toString();
            await db.update(users).set({ name }).where(eq(users.id, existingUser.id));
          }

          // If user exists but image is not set, update it with provider profile image
          if (existingUser && !existingUser.image) {
            const image = user.image ?? getFullImageUrl("logo.svg");
            await db.update(users).set({ image }).where(eq(users.id, existingUser.id));
          }

          // Check if an account already exists for this user with this provider
          if (existingUser && account) {
            const existingAccount = await db.query.accounts.findFirst({
              where: (accounts, { and, eq }) =>
                and(eq(accounts.userId, existingUser.id), eq(accounts.provider, account.provider)),
            });

            // If no existing account for this provider, create a new one
            if (!existingAccount) {
              // Safely prepare account data with proper nullish coalescing
              const accountData = {
                userId: existingUser.id,
                type: account.type ?? "oauth",
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                // Handle all possible undefined values
                refresh_token: account.refresh_token ?? null,
                access_token: account.access_token ?? null,
                expires_at: account.expires_at ?? null,
                token_type: account.token_type ?? null,
                scope: account.scope ?? null,
                id_token: account.id_token ?? null,
                session_state: account.session_state ?? null,
              } as AdapterAccount;

              await db.insert(accounts).values(accountData);
            }
          }

          return true;
        } catch (error) {
          console.error(`${account?.provider} Sign-In Error:`, error);
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

            const userData = {
              id: user.id,
              name: username,
              email: user.email,
              image: getFullImageUrl("logo.svg"),
              phone: "",
              status: "ACTIVE",
            } as typeof users.$inferInsert;

            const result = await db.insert(users).values(userData).returning();

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
      try {
        let blurImage: string | null = null;
        if (user?.image) {
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
            role: user.role || "USER",
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
      } catch (error) {
        console.error("Session callback error:", error);
        return session;
      }
    },
  },
  events: {
    async signIn(message) {
      console.log("Sign-in successful:", message);
    },
    async signOut(message) {
      console.log("Sign-out successful:", message);
    },
    // error event is not supported in the current version of NextAuth
    // remove the error handler
  },
} satisfies NextAuthConfig;
