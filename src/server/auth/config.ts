import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { eq } from "drizzle-orm";
import { type DefaultSession, type NextAuthConfig } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";
import Twitter from "next-auth/providers/twitter";
import posthog from "posthog-js";
import { Resend as ResendEmail } from "resend";
import WelcomeEmailTemplate from "@/emails/welcome-email";
import { env } from "@/env";
import { normalizeGmailAddress } from "@/lib/is-valid";
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
    Twitter({
      clientId: env.NEXT_PUBLIC_TWITTER_CLIENT_ID,
      clientSecret: env.TWITTER_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
    GoogleProvider({ allowDangerousEmailAccountLinking: true }),
    Resend({
      name: "Email",
      from: env.ADMIN_EMAIL,
      sendVerificationRequest: async params => {
        const { identifier: email, url } = params;

        try {
          const { SignInEmailTemplate } = await import("@/emails/signin-email");

          // Send the email using Resend
          const result = await resendEmail.emails.send({
            from: env.ADMIN_EMAIL,
            to: email,
            subject: `تسجيل الدخول إلى منصة ${env.NEXT_PUBLIC_APP_NAME}`,
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
      // Helper to find user by normalized email or user ID
      async function findUserByEmailOrId(email: string | null | undefined, id: string | undefined) {
        let foundUser = null;
        if (email) {
          const normalizedEmail = normalizeGmailAddress(email);
          foundUser = await db.query.users.findFirst({
            where: eq(users.email, normalizedEmail),
          });
        }
        if (!foundUser && id) {
          foundUser = await db.query.users.findFirst({
            where: eq(users.id, id),
          });
        }
        return foundUser;
      }

      // Handle Google provider
      if (account?.provider === "google" && profile) {
        try {
          const normalizedEmail = normalizeGmailAddress(profile.email ?? user.email ?? "");
          let existingUser = await findUserByEmailOrId(normalizedEmail, user.id);

          // If no user exists, create a new user
          if (!existingUser) {
            const result = await db
              .insert(users)
              .values({
                id: user.id, // Use the same user ID that will be used for the account
                name: profile.name ?? user.name ?? "Unknown",
                email: normalizedEmail,
                image: (profile.picture as string) ?? user.image ?? getFullImageUrl("logo.svg"),
                phone: "",
                status: "ACTIVE",
              })
              .returning();

            if (result[0]?.email) {
              void sendWelcomeEmail({
                name: result[0].name ?? user.name,
                email: result[0].email ?? user.email,
              });
            }

            existingUser = result[0];
          } else {
            // If user exists, update name/image if needed
            if (!existingUser.name && (profile.name ?? user.name)) {
              await db
                .update(users)
                .set({ name: profile.name ?? existingUser.name ?? "Unknown" })
                .where(eq(users.id, existingUser.id));
            }
            if (!existingUser.image && (profile.picture as string)) {
              await db
                .update(users)
                .set({ image: (profile.picture as string) ?? getFullImageUrl("logo.svg") })
                .where(eq(users.id, existingUser.id));
            }
          }

          // If no account exists for this user with Google provider, create one
          const existingAccount = existingUser
            ? await db.query.accounts.findFirst({
                where: (accounts, { and, eq }) =>
                  and(eq(accounts.userId, existingUser.id), eq(accounts.provider, "google")),
              })
            : null;

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

            if (existingUser?.email) {
              void sendWelcomeEmail({
                name: existingUser.name ?? user.name,
                email: existingUser.email ?? normalizedEmail,
              });
            }
          }

          return true;
        } catch (error) {
          console.error("Google Sign-In Error:", error);
          return false;
        }
      }

      // Handle Twitter provider
      if (account?.provider === "twitter" && profile) {
        try {
          // Try to find user by Twitter provider account ID first
          const existingAccount = await db.query.accounts.findFirst({
            where: (accounts, { and, eq }) =>
              and(
                eq(accounts.provider, "twitter"),
                eq(accounts.providerAccountId, account.providerAccountId),
              ),
          });

          let existingUser = null;
          if (existingAccount) {
            existingUser = await db.query.users.findFirst({
              where: eq(users.id, existingAccount.userId),
            });
          } else {
            // If not found by account, try by user ID
            existingUser = user.id
              ? await db.query.users.findFirst({
                  where: eq(users.id, user.id),
                })
              : null;
          }

          // If no user exists, create a new user without email
          if (!existingUser) {
            const [result] = await db
              .insert(users)
              .values({
                id: user.id,
                name: profile.name ?? user.name ?? "Unknown",
                email: null, // Twitter doesn't provide email, will be collected during onboarding
                image:
                  (profile.profile_image_url as string) ??
                  user.image ??
                  getFullImageUrl("logo.svg"),
                phone: null, // Will be collected during onboarding
                status: "ACTIVE",
                profileCompleted: false, // Mark as incomplete so they go through onboarding
              })
              .returning();

            existingUser = result;

            // Create the Twitter account
            if (existingUser) {
              await db.insert(accounts).values({
                userId: existingUser.id,
                type: "oauth",
                provider: "twitter",
                providerAccountId: account.providerAccountId,
                access_token: account.access_token,
                token_type: account.token_type,
                scope: account.scope,
                id_token: account.id_token,
              });
            }
          } else {
            // User exists, update their profile if needed
            if (!existingUser.name && (profile.name ?? user.name)) {
              await db
                .update(users)
                .set({ name: profile.name ?? existingUser.name ?? "Unknown" })
                .where(eq(users.id, existingUser.id));
            }
            if (!existingUser.image && (profile.profile_image_url as string)) {
              await db
                .update(users)
                .set({
                  image: (profile.profile_image_url as string) ?? getFullImageUrl("logo.svg"),
                })
                .where(eq(users.id, existingUser.id));
            }
          }

          return true;
        } catch (error) {
          console.error("Twitter Sign-In Error:", error);
          return false;
        }
      }

      // Handle email provider (Resend)
      if (account?.provider === "resend" && user.email) {
        try {
          // Normalize the input email for comparison only
          const normalizedEmail = normalizeGmailAddress(user.email);

          // Find any user whose normalized email matches the normalized input
          const allUsers = await db.query.users.findMany({
            where: (users, { isNotNull }) => isNotNull(users.email),
          });
          const existingUser = allUsers.find(
            user => user.email && normalizeGmailAddress(user.email) === normalizedEmail,
          );

          console.log("normalizedEmail: ", normalizedEmail);
          console.log("existingUser: ", existingUser);

          if (existingUser) {
            // Patch the user object so NextAuth uses the existing user
            user.id = existingUser.id;
            user.email = existingUser.email; // Use the email as stored in DB
            if (!user.name) user.name = existingUser.name ?? "user";
            return true;
          }

          // If no user exists, create a new user with the RAW email
          const username = user.email.split("@")[0] ?? "user";
          const [result] = await db
            .insert(users)
            .values({
              id: user.id,
              name: username,
              email: user.email, // store raw email
              image: getFullImageUrl("logo.svg"),
              phone: "",
              status: "ACTIVE",
            } as Users)
            .returning();

          if (result?.email) {
            void sendWelcomeEmail({
              name: result.name ?? user.name,
              email: result.email ?? user.email,
            });
          }

          return true;
        } catch (error) {
          console.error("Email Sign-In Error:", error);
          return false;
        }
      }

      // Capture sign-in event with PostHog
      posthog.identify();

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
          profileCompleted: userData?.profileCompleted ?? false,
        },
      };
    },
  },
  experimental: {
    enableWebAuthn: true,
  },
} satisfies NextAuthConfig;

type sendWelcomeEmailType = { name: string; email: string; ctaButtonLabel?: string };
/** Use this function to send welcome email if this is a new user  */
async function sendWelcomeEmail({ name, email, ctaButtonLabel }: sendWelcomeEmailType) {
  await resendEmail.emails.send({
    from: env.ADMIN_EMAIL,
    to: email,
    subject: `مرحباً بك في منصة ${env.NEXT_PUBLIC_APP_NAME}`,
    react: WelcomeEmailTemplate({
      name: name,
      ctaUrl: `${env.NEXT_PUBLIC_APP_URL}/mock-test`,
      ctaButtonLabel: ctaButtonLabel ?? "إبدأ بتجربة المحادثة",
    }),
  });
}
