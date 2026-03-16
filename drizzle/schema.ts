import {
  boolean,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  /** True once the user has completed the first-time onboarding flow */
  onboardingCompleted: boolean("onboardingCompleted").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ============================================================
// ONBOARDING & AI PLANS
// ============================================================

/**
 * User profile collected during onboarding.
 * One row per user (1:1 with users).
 */
export const userProfiles = mysqlTable("userProfiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  age: int("age").notNull(),
  sex: mysqlEnum("sex", ["homme", "femme", "autre"]).notNull(),
  weight: int("weight").notNull(), // kg
  height: int("height").notNull(), // cm
  goal: varchar("goal", { length: 64 }).notNull(),
  activity: varchar("activity", { length: 64 }).notNull(),
  sports: json("sports").$type<string[]>().notNull(),
  diet: varchar("diet", { length: 64 }),
  mealsPerDay: int("mealsPerDay").default(5).notNull(),
  level: varchar("level", { length: 32 }).notNull(),
  sessionsPerWeek: int("sessionsPerWeek").default(4).notNull(),
  targetWeight: int("targetWeight"),
  timeline: int("timeline").default(12), // weeks
  avoid: text("avoid"),
  foodPrefs: text("foodPrefs"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = typeof userProfiles.$inferInsert;

/**
 * AI-generated nutrition plans (7-day plans).
 */
export const nutritionPlans = mysqlTable("nutritionPlans", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  targets: json("targets")
    .$type<{ kcal: number; pro: number; glu: number; lip: number }>()
    .notNull(),
  week: json("week").$type<unknown[]>().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type NutritionPlan = typeof nutritionPlans.$inferSelect;
export type InsertNutritionPlan = typeof nutritionPlans.$inferInsert;

/**
 * AI-generated sport programs.
 */
export const sportPlans = mysqlTable("sportPlans", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  programName: varchar("programName", { length: 256 }).notNull(),
  goalStatement: text("goalStatement"),
  weeks: json("weeks").$type<unknown[]>().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SportPlan = typeof sportPlans.$inferSelect;
export type InsertSportPlan = typeof sportPlans.$inferInsert;