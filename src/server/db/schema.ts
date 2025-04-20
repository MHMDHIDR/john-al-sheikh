import { relations } from "drizzle-orm";
import {
  boolean,
  decimal,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTableCreator,
  primaryKey,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { type AdapterAccount } from "next-auth/adapters";

export const createTable = pgTableCreator(name => `jas_${name}`);

// First, create all enums with the jas_ prefix to match table naming

export const UserRole = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMIN: "ADMIN",
  USER: "USER",
} as const;

export const userRoleEnum = pgEnum("jas_user_role", [
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.USER,
]);
export const userStatusEnum = pgEnum("jas_user_status", ["PENDING", "ACTIVE", "SUSPENDED"]);
export const themeEnum = pgEnum("jas_theme", ["light", "dark"]);
export const genderEnum = pgEnum("jas_gender", ["male", "female"]);
export const speakingTestEnum = pgEnum("jas_speaking_test_type", ["MOCK", "PRACTICE", "OFFICIAL"]);

export type themeEnumType = (typeof themeEnum.enumValues)[number];
export type genderEnumType = (typeof genderEnum.enumValues)[number];

export type UserRoleType = keyof typeof UserRole;

export const users = createTable("user", {
  id: varchar("id", { length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: varchar("name", { length: 255 }).notNull(),
  displayName: varchar("display_name", { length: 255 }),
  username: varchar("username", { length: 50 }).unique(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  gender: genderEnum("gender"),
  age: integer("age"),
  nationality: varchar("nationality", { length: 100 }),
  hobbies: jsonb("hobbies").$type<string[]>(),
  goalBand: decimal("goal_band", { precision: 3, scale: 1 }).$type<number>().default(5),
  currentBand: decimal("current_band", { precision: 3, scale: 1 }).$type<number>().default(0),
  role: userRoleEnum("role").notNull().default("USER"),
  status: userStatusEnum("status").notNull().default("PENDING"),
  emailVerified: timestamp("email_verified", {
    mode: "date",
    withTimezone: true,
  }),
  image: varchar("image", { length: 255 }),
  theme: themeEnum("theme").default("light").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
  profileCompleted: boolean("profile_completed").default(false).notNull(),
});
export type Users = typeof users.$inferSelect;

export const accounts = createTable(
  "account",
  {
    userId: varchar("user_id", { length: 255 })
      .notNull()
      .references(() => users.id),
    type: varchar("type", { length: 255 }).$type<AdapterAccount["type"]>().notNull(),
    provider: varchar("provider", { length: 255 }).notNull(),
    providerAccountId: varchar("provider_account_id", { length: 255 }).notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: varchar("token_type", { length: 255 }),
    scope: varchar("scope", { length: 255 }),
    id_token: text("id_token"),
    session_state: varchar("session_state", { length: 255 }),
  },
  account => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
    userIdIdx: index("account_user_id_idx").on(account.userId),
  }),
);

export const sessions = createTable(
  "session",
  {
    sessionToken: varchar("session_token", { length: 255 }).notNull().primaryKey(),
    userId: varchar("user_id", { length: 255 })
      .notNull()
      .references(() => users.id),
    expires: timestamp("expires", { mode: "date", withTimezone: true }).notNull(),
  },
  session => ({
    userIdIdx: index("session_user_id_idx").on(session.userId),
  }),
);

export const verificationTokens = createTable(
  "verification_token",
  {
    identifier: varchar("identifier", { length: 255 }).notNull(),
    token: varchar("token", { length: 255 }).notNull(),
    expires: timestamp("expires", { mode: "date", withTimezone: true }).notNull(),
  },
  vt => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  }),
);

export const rateLimits = createTable("rate_limit", {
  id: varchar("id", { length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: varchar("user_id", { length: 255 }).notNull(),
  ipAddress: varchar("ip_address", { length: 255 }).notNull(),
  requestCount: integer("request_count").notNull().default(0),
  lastRequestAt: timestamp("last_request_at").defaultNow().notNull(),
});
export type RateLimits = typeof rateLimits.$inferSelect;

export const speakingTests = createTable("speaking_test", {
  id: varchar("id", { length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: varchar("user_id", { length: 255 })
    .notNull()
    .references(() => users.id),
  type: speakingTestEnum("type").notNull().default("MOCK"),
  transcription: jsonb("transcription").$type<{
    messages: Array<{
      role: "examiner" | "user";
      content: string;
      timestamp: string;
    }>;
  }>(),
  topic: varchar("topic", { length: 255 }).notNull(),
  band: decimal("band", { precision: 3, scale: 1 }).$type<number>(),
  feedback: jsonb("feedback").$type<{
    strengths: {
      summary: string;
      points: string[];
    };
    areasToImprove: {
      errors: Array<{
        mistake: string;
        correction: string;
      }>;
    };
    improvementTips: string[];
  }>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type SpeakingTest = typeof speakingTests.$inferSelect;

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  speakingTests: many(speakingTests),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const speakingTestsRelations = relations(speakingTests, ({ one }) => ({
  user: one(users, { fields: [speakingTests.userId], references: [users.id] }),
}));
