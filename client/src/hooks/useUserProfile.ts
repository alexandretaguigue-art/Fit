/**
 * useUserProfile — Store persisté (localStorage) pour le profil utilisateur
 * et les plans IA générés (nutrition 7 jours + programme sport).
 *
 * Partagé entre NutritionPage, TipsPage et WorkoutPage.
 */

import { useState, useCallback } from 'react';

// ============================================================
// TYPES
// ============================================================

export interface UserProfile {
  name: string;
  age: number;
  sex: 'homme' | 'femme' | 'autre';
  weight: number;       // kg
  height: number;       // cm
  goal: string;         // lean_bulk | cut | recomp | perf | maintain
  activity: string;     // sedentaire | leger | modere | actif
  sports: string[];     // ['muscu', 'football', 'running', 'cycling', ...]
  diet?: string;        // vegetarien | vegan | sans_gluten | ...
  avoid?: string;       // aliments à éviter
  foodPrefs?: string;   // préférences alimentaires
  mealsPerDay: number;  // 3 | 4 | 5
  level: string;        // debutant | intermediaire | avance
  sessionsPerWeek: number;
  targetWeight?: number | null;
  timeline?: number;    // semaines
}

export interface AiNutritionPlan {
  targets: { kcal: number; pro: number; glu: number; lip: number };
  rationale: string;
  week: unknown[];
  generatedAt: string; // ISO date
}

export interface AiSportPlan {
  program_name: string;
  goal_statement: string;
  weeks: unknown[];
  generatedAt: string;
}

interface ProfileStore {
  profile: UserProfile | null;
  aiNutritionPlan: AiNutritionPlan | null;
  aiSportPlan: AiSportPlan | null;
}

// ============================================================
// STORAGE
// ============================================================

function getProfileKey(): string {
  try {
    const userInfo = localStorage.getItem('manus-runtime-user-info');
    if (userInfo) {
      const parsed = JSON.parse(userInfo);
      const openId = parsed?.openId ?? parsed?.id ?? null;
      if (openId) return `fitpro_profile_v1_${openId}`;
    }
  } catch { /* ignore */ }
  return 'fitpro_profile_v1';
}

function loadStore(): ProfileStore {
  try {
    const raw = localStorage.getItem(getProfileKey());
    if (raw) return JSON.parse(raw) as ProfileStore;
  } catch { /* ignore */ }
  return { profile: null, aiNutritionPlan: null, aiSportPlan: null };
}

function saveStore(store: ProfileStore): void {
  try {
    localStorage.setItem(getProfileKey(), JSON.stringify(store));
  } catch { /* ignore */ }
}

// ============================================================
// HOOK
// ============================================================

export function useUserProfile() {
  const [store, setStore] = useState<ProfileStore>(() => loadStore());

  const updateStore = useCallback((updater: (prev: ProfileStore) => ProfileStore) => {
    setStore(prev => {
      const next = updater(prev);
      saveStore(next);
      return next;
    });
  }, []);

  const setProfile = useCallback((profile: UserProfile) => {
    updateStore(prev => ({ ...prev, profile }));
  }, [updateStore]);

  const setAiNutritionPlan = useCallback((plan: Omit<AiNutritionPlan, 'generatedAt'>) => {
    updateStore(prev => ({
      ...prev,
      aiNutritionPlan: { ...plan, generatedAt: new Date().toISOString() },
    }));
  }, [updateStore]);

  const setAiSportPlan = useCallback((plan: Omit<AiSportPlan, 'generatedAt'>) => {
    updateStore(prev => ({
      ...prev,
      aiSportPlan: { ...plan, generatedAt: new Date().toISOString() },
    }));
  }, [updateStore]);

  const clearPlans = useCallback(() => {
    updateStore(prev => ({ ...prev, aiNutritionPlan: null, aiSportPlan: null }));
  }, [updateStore]);

  return {
    profile: store.profile,
    aiNutritionPlan: store.aiNutritionPlan,
    aiSportPlan: store.aiSportPlan,
    hasProfile: store.profile !== null,
    setProfile,
    setAiNutritionPlan,
    setAiSportPlan,
    clearPlans,
  };
}
