import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  InsertUserProfile,
  InsertNutritionPlan,
  InsertSportPlan,
  nutritionPlans,
  sportPlans,
  userProfiles,
  users,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============================================================
// USER PROFILE
// ============================================================

export async function upsertUserProfile(profile: InsertUserProfile): Promise<void> {
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert profile: database not available"); return; }
  const existing = await db.select().from(userProfiles).where(eq(userProfiles.userId, profile.userId)).limit(1);
  if (existing.length > 0) {
    await db.update(userProfiles).set(profile).where(eq(userProfiles.userId, profile.userId));
  } else {
    await db.insert(userProfiles).values(profile);
  }
}

export async function getUserProfile(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============================================================
// NUTRITION PLANS
// ============================================================

export async function insertNutritionPlan(plan: InsertNutritionPlan) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(nutritionPlans).values(plan);
  return result;
}

export async function getLatestNutritionPlan(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(nutritionPlans)
    .where(eq(nutritionPlans.userId, userId))
    .orderBy(nutritionPlans.createdAt)
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============================================================
// SPORT PLANS
// ============================================================

export async function insertSportPlan(plan: InsertSportPlan) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(sportPlans).values(plan);
  return result;
}

export async function getLatestSportPlan(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(sportPlans)
    .where(eq(sportPlans.userId, userId))
    .orderBy(sportPlans.createdAt)
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============================================================
// ONBOARDING STATUS
// ============================================================

export async function markOnboardingCompleted(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot mark onboarding: database not available"); return; }
  await db.update(users).set({ onboardingCompleted: true }).where(eq(users.id, userId));
}
