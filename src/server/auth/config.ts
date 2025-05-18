import { type AdapterUser } from "@auth/core/adapters";
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
  debug: true, // Enable debug to see detailed logs
  providers: [
    Twitter({
      allowDangerousEmailAccountLinking: true,
      // Ensure email is included in the returned profile
      authorization: {
        params: {
          include_email: "true",
        },
      },
    }),
    GoogleProvider({
      allowDangerousEmailAccountLinking: true,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          scope: "openid email profile",
        },
      },
    }),
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
      // Log data received from provider to diagnose issues
      console.log("SIGNIN CALLBACK - User:", {
        id: user.id,
        name: user.name,
        email: user.email ?? "missing",
        image: user.image ?? "missing",
      });

      console.log(
        "SIGNIN CALLBACK - Profile:",
        profile ? { name: profile.name, email: profile.email } : "No profile data",
      );

      console.log(
        "SIGNIN CALLBACK - Account:",
        account ? { provider: account.provider, type: account.type } : "No account data",
      );

      // Get email from multiple possible sources
      const email = user.email ?? profile!.email ?? "";

      if (!email) {
        console.error(`Sign-in failed: Email missing from both user and profile objects`);
        return false;
      }

      // Now we have an email to work with
      if ((account?.provider === "google" || account?.provider === "twitter") && profile) {
        try {
          // Find the user by email
          let existingUser = await db.query.users.findFirst({
            where: eq(users.email, email),
          });

          // If no user exists, create a new user
          if (!existingUser) {
            // Get name from available sources
            const name = profile.name ?? user.name ?? email.split("@")[0] ?? "Unknown";
            const image = user.image ?? getFullImageUrl("logo.svg");

            console.log(`Creating new user with email: ${email}, name: ${name}`);

            // Simplified user data
            await db.insert(users).values({
              id: user.id ?? crypto.randomUUID(),
              name: name.toString(),
              email: email,
              image: image,
              phone: "",
              status: "ACTIVE",
            });

            // Query to get the inserted user
            existingUser = await db.query.users.findFirst({
              where: eq(users.email, email),
            });
          }

          // If no account exists for this user with this provider, create one
          if (existingUser && account) {
            const existingAccount = await db.query.accounts.findFirst({
              where: (accounts, { and, eq }) =>
                and(eq(accounts.userId, existingUser.id), eq(accounts.provider, account.provider)),
            });

            // If no existing account for this provider, create a new one
            if (!existingAccount) {
              console.log(
                `Creating new ${account.provider} account for user: ${existingUser.email}`,
              );

              // Simplified account insertion with type casting
              await db.insert(accounts).values({
                userId: existingUser.id,
                type: (account.type || "oauth") as "oauth",
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                refresh_token: account.refresh_token ? String(account.refresh_token) : null,
                access_token: account.access_token ? String(account.access_token) : null,
                expires_at: account.expires_at ?? null,
                token_type: account.token_type ? String(account.token_type) : null,
                scope: account.scope ? String(account.scope) : null,
                id_token: account.id_token ? String(account.id_token) : null,
                session_state:
                  account.session_state && typeof account.session_state === "string"
                    ? account.session_state
                    : account.session_state
                      ? JSON.stringify(account.session_state)
                      : null,
              });
            }
          }

          console.log(`${account?.provider} authentication successful for: ${email}`);
          return true;
        } catch (error) {
          console.error(`${account?.provider} Sign-In Error:`, error);
          return false;
        }
      }

      // Handle email provider
      if (account?.provider === "resend" && email) {
        try {
          // Find the user by email
          let existingUser = await db.query.users.findFirst({
            where: eq(users.email, email),
          });

          // If no user exists, create a new user with a default name
          if (!existingUser) {
            const username = email.split("@")[0];

            // Simplified user data for email sign-in
            await db.insert(users).values({
              id: user.id ?? crypto.randomUUID(),
              name: username ?? "User",
              email: email,
              image: getFullImageUrl("logo.svg"),
              phone: "",
              status: "ACTIVE",
            });

            // Query to get the inserted user
            existingUser = await db.query.users.findFirst({
              where: eq(users.email, email),
            });
          }

          console.log(`Email authentication successful for: ${email}`);
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
            role: user.role ?? "USER",
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
      console.log("Sign-in event:", message);
    },
    async signOut(message) {
      console.log("Sign-out event:", message);
    },
    // Error event removed: not supported in NextAuth 5
  },
} satisfies NextAuthConfig;
