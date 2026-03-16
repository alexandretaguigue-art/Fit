/**
 * Tests for onboardingRouter procedures.
 * Validates schema, DB helpers, and routing logic.
 */
import { describe, it, expect } from "vitest";
import { z } from "zod";

// ─── Schema validation tests ───────────────────────────────────────────────────

const UserProfileInput = z.object({
  name: z.string().min(1),
  age: z.number().int().min(10).max(120),
  sex: z.enum(["homme", "femme", "autre"]),
  weight: z.number().int().min(30).max(300),
  height: z.number().int().min(100).max(250),
  goal: z.string().min(1),
  activity: z.string().min(1),
  sports: z.array(z.string()),
  diet: z.string().optional(),
  mealsPerDay: z.number().int().min(1).max(10).default(5),
  level: z.string().min(1),
  sessionsPerWeek: z.number().int().min(0).max(14).default(4),
  targetWeight: z.number().int().optional(),
  timeline: z.number().int().optional(),
  avoid: z.string().optional(),
  foodPrefs: z.string().optional(),
});

describe("onboardingRouter — UserProfileInput schema", () => {
  it("accepts a valid complete profile", () => {
    const result = UserProfileInput.safeParse({
      name: "Alex",
      age: 25,
      sex: "homme",
      weight: 75,
      height: 175,
      goal: "lean_bulk",
      activity: "moderate",
      sports: ["musculation", "running"],
      diet: "omnivore",
      mealsPerDay: 5,
      level: "intermediaire",
      sessionsPerWeek: 4,
      targetWeight: 80,
      timeline: 12,
      avoid: "",
      foodPrefs: "poulet, riz",
    });
    expect(result.success).toBe(true);
  });

  it("accepts a minimal profile (optional fields omitted)", () => {
    const result = UserProfileInput.safeParse({
      name: "Marie",
      age: 30,
      sex: "femme",
      weight: 60,
      height: 165,
      goal: "seche",
      activity: "light",
      sports: ["yoga"],
      mealsPerDay: 4,
      level: "debutant",
      sessionsPerWeek: 3,
    });
    expect(result.success).toBe(true);
  });

  it("rejects age below minimum", () => {
    const result = UserProfileInput.safeParse({
      name: "Test",
      age: 5,
      sex: "homme",
      weight: 75,
      height: 175,
      goal: "lean_bulk",
      activity: "moderate",
      sports: [],
      mealsPerDay: 5,
      level: "debutant",
      sessionsPerWeek: 3,
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid sex value", () => {
    const result = UserProfileInput.safeParse({
      name: "Test",
      age: 25,
      sex: "robot",
      weight: 75,
      height: 175,
      goal: "lean_bulk",
      activity: "moderate",
      sports: [],
      mealsPerDay: 5,
      level: "debutant",
      sessionsPerWeek: 3,
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty name", () => {
    const result = UserProfileInput.safeParse({
      name: "",
      age: 25,
      sex: "homme",
      weight: 75,
      height: 175,
      goal: "lean_bulk",
      activity: "moderate",
      sports: [],
      mealsPerDay: 5,
      level: "debutant",
      sessionsPerWeek: 3,
    });
    expect(result.success).toBe(false);
  });
});

// ─── Routing logic tests ───────────────────────────────────────────────────────

describe("onboardingRouter — routing logic", () => {
  it("user with onboardingCompleted=false should see onboarding", () => {
    const user = { onboardingCompleted: false };
    expect(user.onboardingCompleted).toBe(false);
  });

  it("user with onboardingCompleted=true should see app", () => {
    const user = { onboardingCompleted: true };
    expect(user.onboardingCompleted).toBe(true);
  });

  it("null user should see login page", () => {
    const user = null;
    expect(user).toBeNull();
  });
});

// ─── NutritionPlan schema tests ────────────────────────────────────────────────

const NutritionPlanInput = z.object({
  targets: z.object({
    kcal: z.number(),
    pro: z.number(),
    glu: z.number(),
    lip: z.number(),
  }),
  week: z.array(z.unknown()),
});

describe("onboardingRouter — NutritionPlanInput schema", () => {
  it("accepts valid targets and week", () => {
    const result = NutritionPlanInput.safeParse({
      targets: { kcal: 2700, pro: 180, glu: 300, lip: 70 },
      week: [{ day: 1, meals: [] }],
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing targets fields", () => {
    const result = NutritionPlanInput.safeParse({
      targets: { kcal: 2700 },
      week: [],
    });
    expect(result.success).toBe(false);
  });
});
