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

// Create everything with the jas_ prefix to match table naming
export const createTable = pgTableCreator(name => `jas_${name}`);

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
export const contentTypeEnum = pgEnum("jas_content_type", ["PRIVACY", "TERMS"]);
export const transactionTypeEnum = pgEnum("jas_transaction_type", ["PURCHASE", "USAGE"]);
export const transactionStatusEnum = pgEnum("jas_transaction_status", [
  "PENDING",
  "COMPLETED",
  "FAILED",
  "REFUNDED",
]);

export type themeEnumType = (typeof themeEnum.enumValues)[number];
export type genderEnumType = (typeof genderEnum.enumValues)[number];
export type UserRoleType = keyof typeof UserRole;
export type PageContent = typeof pageContent.$inferSelect;
export type ContentType = (typeof contentTypeEnum.enumValues)[number];

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
  credits: integer("credits").notNull().default(1),
  role: userRoleEnum("role").notNull().default("USER"),
  status: userStatusEnum("status").notNull().default("PENDING"),
  emailVerified: timestamp("email_verified", {
    mode: "date",
    withTimezone: true,
  }),
  image: varchar("image", { length: 255 }),
  theme: themeEnum("theme").default("light").notNull(),
  isNewsletterSubscribed: boolean("is_newsletter_subscribed").default(true).notNull(),
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

export const pageContent = createTable("page_content", {
  id: varchar("id", { length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  type: contentTypeEnum("type").notNull(),
  content: text("content").notNull(),
  isPublished: boolean("is_published").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdById: varchar("created_by_id", { length: 255 })
    .notNull()
    .references(() => users.id),
});

export type TransactionMetadata = {
  promoCode?: string;
  discountPercent?: number;
  notes?: string;
  ipAddress?: string;
  deviceInfo?: string;
  sessionId?: string;
  paymentIntent?: string | null;
  [key: string]: string | number | boolean | null | undefined;
};

export const creditTransactions = createTable(
  "credit_transaction",
  {
    id: varchar("id", { length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: varchar("user_id", { length: 255 })
      .notNull()
      .references(() => users.id),
    type: transactionTypeEnum("type").notNull(),
    amount: integer("amount").notNull(), // Number of credits added or used
    creditsAfter: integer("credits_after").notNull(), // Balance after transaction

    // Purchase-specific fields (null for USAGE transactions)
    stripePaymentId: varchar("stripe_payment_id", { length: 255 }),
    priceInCents: integer("price_in_cents"), // Store actual price paid
    currency: varchar("currency", { length: 3 }), // e.g., "GBP"
    packageName: varchar("package_name", { length: 100 }), // e.g., "5 Credits Pack"

    // Usage-specific fields (null for PURCHASE transactions)
    speakingTestId: varchar("speaking_test_id", { length: 255 }).references(() => speakingTests.id),
    creditCost: integer("credit_cost"), // How many credits this test consumed

    status: transactionStatusEnum("status").notNull().default("PENDING"),
    metadata: jsonb("metadata").$type<TransactionMetadata>(), // For any additional flexible data
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  creditTransaction => ({
    userIdIdx: index("credit_transaction_user_id_idx").on(creditTransaction.userId),
    stripePaymentIdIdx: index("credit_transaction_stripe_payment_id_idx").on(
      creditTransaction.stripePaymentId,
    ),
    speakingTestIdIdx: index("credit_transaction_speaking_test_id_idx").on(
      creditTransaction.speakingTestId,
    ),
  }),
);

export type CreditTransaction = typeof creditTransactions.$inferSelect;

// Newsletter subscribers schema
export const subscribedEmails = createTable("subscribed_emails", {
  id: varchar("id", { length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  fullname: varchar("fullname", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  ieltsGoal: decimal("ielts_goal", { precision: 3, scale: 1 }).$type<number>().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type SubscribedEmail = typeof subscribedEmails.$inferSelect;

// Authenticator table for Passkeys
export const authenticators = createTable("authenticator", {
  id: varchar("id", { length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  credentialID: varchar("credential_id", { length: 255 }).notNull().unique(),
  userId: varchar("user_id", { length: 255 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  providerAccountId: varchar("provider_account_id", { length: 255 }).notNull(),
  credentialPublicKey: text("credential_public_key").notNull(),
  counter: integer("counter").notNull(),
  credentialDeviceType: varchar("credential_device_type", { length: 255 }).notNull(),
  credentialBackedUp: boolean("credential_backed_up").notNull(),
  transports: varchar("transports", { length: 255 }),
});

export type Authenticator = typeof authenticators.$inferSelect;

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  speakingTests: many(speakingTests),
  creditTransactions: many(creditTransactions),
  authenticators: many(authenticators),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const speakingTestsRelations = relations(speakingTests, ({ one, many }) => ({
  user: one(users, { fields: [speakingTests.userId], references: [users.id] }),
  creditTransactions: many(creditTransactions),
}));

export const pageContentRelations = relations(pageContent, ({ one }) => ({
  createdBy: one(users, {
    fields: [pageContent.createdById],
    references: [users.id],
  }),
}));

export const creditTransactionsRelations = relations(creditTransactions, ({ one }) => ({
  user: one(users, { fields: [creditTransactions.userId], references: [users.id] }),
  speakingTest: one(speakingTests, {
    fields: [creditTransactions.speakingTestId],
    references: [speakingTests.id],
  }),
}));

export const authenticatorsRelations = relations(authenticators, ({ one }) => ({
  user: one(users, { fields: [authenticators.userId], references: [users.id] }),
}));
