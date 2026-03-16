/**
 * onboardingRouter — tRPC procedures for first-time onboarding.
 *
 * Handles:
 * - Saving user profile (step 1-5 data)
 * - Saving AI-generated nutrition & sport plans to DB
 * - Marking onboarding as completed
 * - Fetching onboarding status + saved plans
 */
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "./db";
import { protectedProcedure, router } from "./_core/trpc";

// ---- Input schemas ----

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

const NutritionPlanInput = z.object({
  targets: z.object({
    kcal: z.number(),
    pro: z.number(),
    glu: z.number(),
    lip: z.number(),
  }),
  week: z.array(z.unknown()),
});

const SportPlanInput = z.object({
  programName: z.string(),
  goalStatement: z.string().optional(),
  weeks: z.array(z.unknown()),
});

// ---- Router ----

export const onboardingRouter = router({
  /**
   * Get current user's onboarding status + saved profile/plans.
   * Used by the frontend to decide which screen to show.
   */
  getStatus: protectedProcedure.query(async ({ ctx }) => {
    const user = ctx.user;
    const profile = await db.getUserProfile(user.id);
    const nutritionPlan = await db.getLatestNutritionPlan(user.id);
    const sportPlan = await db.getLatestSportPlan(user.id);

    return {
      onboardingCompleted: user.onboardingCompleted,
      profile: profile ?? null,
      nutritionPlan: nutritionPlan ?? null,
      sportPlan: sportPlan ?? null,
    };
  }),

  /**
   * Save user profile collected during onboarding steps 1-5.
   */
  saveProfile: protectedProcedure
    .input(UserProfileInput)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      await db.upsertUserProfile({
        userId,
        name: input.name,
        age: input.age,
        sex: input.sex,
        weight: input.weight,
        height: input.height,
        goal: input.goal,
        activity: input.activity,
        sports: input.sports,
        diet: input.diet ?? null,
        mealsPerDay: input.mealsPerDay,
        level: input.level,
        sessionsPerWeek: input.sessionsPerWeek,
        targetWeight: input.targetWeight ?? null,
        timeline: input.timeline ?? null,
        avoid: input.avoid ?? null,
        foodPrefs: input.foodPrefs ?? null,
      });
      return { success: true };
    }),

  /**
   * Save AI-generated nutrition plan to DB.
   */
  saveNutritionPlan: protectedProcedure
    .input(NutritionPlanInput)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      await db.insertNutritionPlan({
        userId,
        targets: input.targets,
        week: input.week,
      });
      return { success: true };
    }),

  /**
   * Save AI-generated sport plan to DB.
   */
  saveSportPlan: protectedProcedure
    .input(SportPlanInput)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      await db.insertSportPlan({
        userId,
        programName: input.programName,
        goalStatement: input.goalStatement ?? null,
        weeks: input.weeks,
      });
      return { success: true };
    }),

  /**
   * Mark onboarding as completed. Called after plans are saved.
   */
  complete: protectedProcedure.mutation(async ({ ctx }) => {
    await db.markOnboardingCompleted(ctx.user.id);
    return { success: true };
  }),
});
