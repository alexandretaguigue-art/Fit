// ============================================================
// DESIGN: "Coach Nocturne" — Hook de gestion du journal fitness
// Gère la persistance des données dans localStorage
// Inclut : adaptation automatique des charges, journal nutritionnel,
// liste de courses hebdomadaire
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import type { SessionLog, ProgressEntry } from '../lib/programData';
import { programData } from '../lib/programData';
import {
  computeAdaptation,
  computeFatigueScore,
  type ExercisePerformance,
  type AdaptationResult,
} from '../lib/adaptationEngine';
import {
  computeDayBalance,
  computeWeeklyNutritionSummary,
  computeWeeklyRecap,
  computeMealAdjustments,
  computeWeeklyCarryover,
  generateWeeklyMealPlan,
  generateShoppingList,
  type DayLog,
  type FoodEntry,
  type WeeklyMealPlan,
  type ShoppingList,
} from '../lib/nutritionEngine';

// ============================================================
// TYPES
// ============================================================

interface FitnessData {
  sessionLogs: SessionLog[];
  progressEntries: ProgressEntry[];
  currentWeek: number;
  startDate: string | null;
  // Adaptations calculées par exercice (exerciseId → dernière adaptation)
  exerciseAdaptations: Record<string, AdaptationResult>;
  // Journal nutritionnel (date ISO → DayLog)
  nutritionLogs: Record<string, DayLog>;
  // Semaine du plan alimentaire affiché
  currentMealPlanWeek: string | null;
  // Override du planning : date ISO (YYYY-MM-DD) → sessionId
  scheduleOverrides: Record<string, string>;
}

const STORAGE_KEY = 'fitpro_data_v2';

const defaultData: FitnessData = {
  sessionLogs: [],
  progressEntries: [],
  currentWeek: 1,
  startDate: null,
  exerciseAdaptations: {},
  nutritionLogs: {},
  currentMealPlanWeek: null,
  scheduleOverrides: {},
};

// ============================================================
// HOOK PRINCIPAL
// ============================================================

export function useFitnessTracker() {
  const [data, setData] = useState<FitnessData>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Migration depuis ancienne version
        return {
          ...defaultData,
          ...parsed,
          exerciseAdaptations: parsed.exerciseAdaptations ?? {},
          nutritionLogs: parsed.nutritionLogs ?? {},
          scheduleOverrides: parsed.scheduleOverrides ?? {},
        };
      }
    } catch (e) {
      console.error('Error loading fitness data:', e);
    }
    return defaultData;
  });

  // Sauvegarde automatique dans localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Error saving fitness data:', e);
    }
  }, [data]);

  // ============================================================
  // PROGRAMME
  // ============================================================

  const startProgram = useCallback(() => {
    setData(prev => ({
      ...prev,
      startDate: new Date().toISOString(),
      currentWeek: 1,
    }));
  }, []);

  const getCurrentWeek = useCallback((): number => {
    if (!data.startDate) return 1;
    const start = new Date(data.startDate);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return Math.min(Math.max(1, Math.floor(diffDays / 7) + 1), 12);
  }, [data.startDate]);

  // ============================================================
  // SÉANCES & ADAPTATION AUTOMATIQUE
  // ============================================================

  const logSession = useCallback((log: SessionLog) => {
    setData(prev => {
      const weekNumber = prev.startDate
        ? Math.min(Math.max(1, Math.floor((Date.now() - new Date(prev.startDate).getTime()) / (1000 * 60 * 60 * 24 * 7)) + 1), 12)
        : 1;

      // Calculer les nouvelles adaptations pour chaque exercice
      const newAdaptations = { ...prev.exerciseAdaptations };

      // Construire un index de tous les exercices du programme pour récupérer les cibles
      const exerciseIndex: Record<string, { sets: number; repsMin: number; repsMax: number | null }> = {};
      programData.sessions.forEach(session => {
        session.exercises.forEach(ex => {
          exerciseIndex[ex.id] = { sets: ex.sets, repsMin: ex.repsMin, repsMax: ex.repsMax };
        });
      });

      log.exercises.forEach(exLog => {
        const programEx = exerciseIndex[exLog.exerciseId];
        const perf: ExercisePerformance = {
          exerciseId: exLog.exerciseId,
          targetSets: programEx?.sets ?? exLog.sets.length,
          targetRepsMin: programEx?.repsMin ?? (exLog.sets[0]?.reps ?? 8),
          targetRepsMax: programEx?.repsMax ?? null,
          sets: exLog.sets.map(s => ({
            weight: s.weight,
            reps: s.reps,
            completed: s.completed,
          })),
          perceivedDifficulty: log.perceivedDifficulty,
        };

        const previousAdaptation = prev.exerciseAdaptations[exLog.exerciseId];
        const adaptation = computeAdaptation(perf, weekNumber, previousAdaptation);
        newAdaptations[exLog.exerciseId] = adaptation;
      });

      return {
        ...prev,
        sessionLogs: [
          ...prev.sessionLogs.filter(l => !(l.sessionId === log.sessionId && l.date.split('T')[0] === log.date.split('T')[0])),
          log,
        ],
        exerciseAdaptations: newAdaptations,
      };
    });
  }, []);

  const getSessionLogs = useCallback((sessionId: string): SessionLog[] => {
    return data.sessionLogs
      .filter(l => l.sessionId === sessionId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [data.sessionLogs]);

  const getLastSessionLog = useCallback((sessionId: string): SessionLog | null => {
    const logs = getSessionLogs(sessionId);
    return logs.length > 0 ? logs[0] : null;
  }, [getSessionLogs]);

  // Récupérer l'adaptation d'un exercice (charge/reps suggérées)
  const getExerciseAdaptation = useCallback((exerciseId: string): AdaptationResult | null => {
    return data.exerciseAdaptations[exerciseId] ?? null;
  }, [data.exerciseAdaptations]);

  // Toutes les adaptations
  const getAllAdaptations = useCallback((): Record<string, AdaptationResult> => {
    return data.exerciseAdaptations;
  }, [data.exerciseAdaptations]);

  // Score de fatigue basé sur les dernières séances
  const getFatigueScore = useCallback(() => {
    const recentLogs = data.sessionLogs
      .slice(-6)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const difficulties = recentLogs.map(l => l.perceivedDifficulty);
    const energies = recentLogs.map(l => l.energyLevel ?? 7);
    return computeFatigueScore(difficulties, energies);
  }, [data.sessionLogs]);

  // Analyser une séance
  const analyzeSession = useCallback((log: SessionLog): {
    verdict: 'excellent' | 'good' | 'average' | 'poor';
    score: number;
    feedback: string[];
    suggestions: string[];
  } => {
    const completedSets = log.exercises.flatMap(e => e.sets.filter(s => s.completed));
    const totalSets = log.exercises.flatMap(e => e.sets);
    const completionRate = totalSets.length > 0 ? completedSets.length / totalSets.length : 0;

    const score = Math.round(
      (completionRate * 40) +
      (log.perceivedDifficulty >= 7 ? 30 : log.perceivedDifficulty * 3) +
      ((log.energyLevel ?? 7) >= 6 ? 30 : (log.energyLevel ?? 7) * 5)
    );

    const feedback: string[] = [];
    const suggestions: string[] = [];

    if (completionRate < 0.8) {
      feedback.push(`${Math.round(completionRate * 100)}% des séries complétées.`);
      suggestions.push("Réduis légèrement les charges pour compléter toutes les séries.");
    } else if (completionRate === 1) {
      feedback.push("Toutes les séries complétées !");
      if (log.perceivedDifficulty <= 6) {
        suggestions.push("Séance trop facile — augmente les charges de 2.5-5kg.");
      }
    }

    if (log.perceivedDifficulty < 6) {
      suggestions.push("Trop facile. Augmente les charges ou réduis les temps de repos.");
    } else if (log.perceivedDifficulty > 9) {
      suggestions.push("Très difficile. Dors bien et mange suffisamment avant la prochaine séance.");
    }

    if ((log.energyLevel ?? 7) < 5) {
      suggestions.push("Énergie basse — vérifie ton alimentation pré-training et ton sommeil.");
    }

    const verdict: 'excellent' | 'good' | 'average' | 'poor' =
      score >= 85 ? 'excellent' : score >= 70 ? 'good' : score >= 50 ? 'average' : 'poor';

    return { verdict, score, feedback, suggestions };
  }, []);

  // Compatibilité avec l'ancien hook
  const getSuggestedWeight = useCallback((exerciseId: string, currentWeight: number, completedAllSets: boolean, difficulty: number) => {
    const adaptation = data.exerciseAdaptations[exerciseId];
    if (adaptation) {
      return {
        suggestedWeight: adaptation.suggestedWeight,
        message: adaptation.coachMessage,
        direction: adaptation.direction === 'increase_weight' || adaptation.direction === 'increase_reps' ? 'up' as const
          : adaptation.direction === 'decrease' || adaptation.direction === 'deload' ? 'down' as const
          : 'same' as const,
      };
    }
    // Fallback
    if (!completedAllSets) {
      return { suggestedWeight: Math.max(currentWeight - 2.5, 0), message: "Réduis légèrement la charge.", direction: 'down' as const };
    }
    if (difficulty <= 6) {
      const inc = currentWeight >= 40 ? 5 : 2.5;
      return { suggestedWeight: currentWeight + inc, message: `Augmente de ${inc}kg.`, direction: 'up' as const };
    }
    if (difficulty >= 8) {
      return { suggestedWeight: currentWeight + 2.5, message: "Augmente de 2.5kg.", direction: 'up' as const };
    }
    return { suggestedWeight: currentWeight, message: "Garde la même charge.", direction: 'same' as const };
  }, [data.exerciseAdaptations]);

  // Progression d'un exercice
  const getExerciseProgress = useCallback((exerciseId: string) => {
    const allLogs = data.sessionLogs.flatMap(log =>
      log.exercises
        .filter(e => e.exerciseId === exerciseId)
        .map(e => ({
          date: log.date,
          maxWeight: Math.max(...e.sets.map(s => s.weight), 0),
          totalVolume: e.sets.reduce((acc, s) => acc + s.weight * s.reps, 0),
        }))
    );
    return allLogs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [data.sessionLogs]);

  // ============================================================
  // PROGRESSION (MENSURATIONS)
  // ============================================================

  const addProgressEntry = useCallback((entry: ProgressEntry) => {
    setData(prev => ({
      ...prev,
      progressEntries: [...prev.progressEntries, entry].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      ),
    }));
  }, []);

  const getStats = useCallback(() => {
    const totalSessions = data.sessionLogs.length;
    const totalVolume = data.sessionLogs.reduce((acc, log) =>
      acc + log.exercises.reduce((eAcc, e) =>
        eAcc + e.sets.reduce((sAcc, s) => sAcc + (s.completed ? s.weight * s.reps : 0), 0), 0), 0);

    const latestProgress = data.progressEntries[data.progressEntries.length - 1];
    const firstProgress = data.progressEntries[0];

    const weightGain = latestProgress && firstProgress ? latestProgress.weight - firstProgress.weight : 0;
    const armGain = latestProgress?.armCircumference && firstProgress?.armCircumference
      ? latestProgress.armCircumference - firstProgress.armCircumference : 0;
    const thighGain = latestProgress?.thighCircumference && firstProgress?.thighCircumference
      ? latestProgress.thighCircumference - firstProgress.thighCircumference : 0;

    return { totalSessions, totalVolume, weightGain, armGain, thighGain, currentWeek: getCurrentWeek() };
  }, [data, getCurrentWeek]);

  // ============================================================
  // NUTRITION — JOURNAL QUOTIDIEN
  // ============================================================

  const getTodayKey = useCallback((): string => {
    return new Date().toISOString().split('T')[0];
  }, []);

  const getDayLog = useCallback((dateKey: string): DayLog => {
    const dayOfWeek = new Date(dateKey + 'T12:00:00').getDay();
    const trainingDays = [1, 2, 4, 5]; // lun, mar, jeu, ven
    const isTrainingDay = trainingDays.includes(dayOfWeek);

    return data.nutritionLogs[dateKey] ?? {
      date: dateKey,
      entries: [],
      isTrainingDay,
    };
  }, [data.nutritionLogs]);

  const addFoodEntry = useCallback((dateKey: string, entry: FoodEntry) => {
    setData(prev => {
      const existing = prev.nutritionLogs[dateKey] ?? {
        date: dateKey,
        entries: [],
        isTrainingDay: [1, 2, 4, 5].includes(new Date(dateKey + 'T12:00:00').getDay()),
      };
      return {
        ...prev,
        nutritionLogs: {
          ...prev.nutritionLogs,
          [dateKey]: {
            ...existing,
            entries: [...existing.entries, entry],
          },
        },
      };
    });
  }, []);

  const updateFoodEntry = useCallback((dateKey: string, entryId: string, updates: Partial<FoodEntry>) => {
    setData(prev => {
      const existing = prev.nutritionLogs[dateKey];
      if (!existing) return prev;
      return {
        ...prev,
        nutritionLogs: {
          ...prev.nutritionLogs,
          [dateKey]: {
            ...existing,
            entries: existing.entries.map(e => e.id === entryId ? { ...e, ...updates } : e),
          },
        },
      };
    });
  }, []);

  const deleteFoodEntry = useCallback((dateKey: string, entryId: string) => {
    setData(prev => {
      const existing = prev.nutritionLogs[dateKey];
      if (!existing) return prev;
      return {
        ...prev,
        nutritionLogs: {
          ...prev.nutritionLogs,
          [dateKey]: {
            ...existing,
            entries: existing.entries.filter(e => e.id !== entryId),
          },
        },
      };
    });
  }, []);

  const getDayBalance = useCallback((dateKey: string) => {
    const log = getDayLog(dateKey);
    return computeDayBalance(log);
  }, [getDayLog]);

  // Résumé nutritionnel de la semaine
  const getWeeklyNutritionSummary = useCallback((weekStartDate: string) => {
    const start = new Date(weekStartDate + 'T12:00:00');
    const logs: DayLog[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const key = d.toISOString().split('T')[0];
      if (data.nutritionLogs[key]) {
        logs.push(data.nutritionLogs[key]);
      }
    }
    return computeWeeklyNutritionSummary(logs, getCurrentWeek());
  }, [data.nutritionLogs, getCurrentWeek]);

  // ============================================================
  // PLAN ALIMENTAIRE HEBDOMADAIRE & LISTE DE COURSES
  // ============================================================

  const getWeeklyMealPlan = useCallback((weekStartMonday: Date): WeeklyMealPlan => {
    return generateWeeklyMealPlan(weekStartMonday);
  }, []);

  const getShoppingList = useCallback((weekStartMonday: Date): ShoppingList => {
    const plan = generateWeeklyMealPlan(weekStartMonday);
    return generateShoppingList(plan);
  }, []);

  // Calculer le lundi de la semaine prochaine (pour la liste de courses du samedi)
  const getNextWeekMonday = useCallback((): Date => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysUntilNextMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
    const nextMonday = new Date(today);
    nextMonday.setDate(today.getDate() + daysUntilNextMonday);
    nextMonday.setHours(0, 0, 0, 0);
    return nextMonday;
  }, []);

  // Lundi de la semaine courante
  const getCurrentWeekMonday = useCallback((): Date => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + daysToMonday);
    monday.setHours(0, 0, 0, 0);
    return monday;
  }, []);

  // ============================================================
  // RÉCAP HEBDOMADAIRE & AJUSTEMENTS REPAS
  // ============================================================

  const getWeeklyRecap = useCallback((weekStartMonday: Date) => {
    const allLogs = Object.values(data.nutritionLogs);
    return computeWeeklyRecap(allLogs, weekStartMonday);
  }, [data.nutritionLogs]);

  const getMealAdjustments = useCallback((dateKey: string, completedMeals: string[]) => {
    const log = getDayLog(dateKey);
    const consumed = log.entries.reduce(
      (acc, e) => ({
        proteins: acc.proteins + e.proteins,
        carbs: acc.carbs + e.carbs,
        fats: acc.fats + e.fats,
        calories: acc.calories + e.calories,
      }),
      { proteins: 0, carbs: 0, fats: 0, calories: 0 }
    );
    const allLogs = Object.values(data.nutritionLogs);
    const weeklyCarryover = computeWeeklyCarryover(allLogs, dateKey);
    return computeMealAdjustments(consumed, completedMeals, log.isTrainingDay, weeklyCarryover);
  }, [data.nutritionLogs, getDayLog]);

  // ============================================================
  // Planning personnalisé (override par date)
  // ============================================================

  const setScheduleOverride = useCallback((dateKey: string, sessionId: string | null) => {
    setData(prev => {
      const overrides = { ...prev.scheduleOverrides };
      if (sessionId === null) {
        delete overrides[dateKey];
      } else {
        overrides[dateKey] = sessionId;
      }
      return { ...prev, scheduleOverrides: overrides };
    });
  }, []);

  const getScheduleOverride = useCallback((dateKey: string): string | null => {
    return data.scheduleOverrides[dateKey] ?? null;
  }, [data.scheduleOverrides]);

  return {
    data,
    startProgram,
    getCurrentWeek,
    // Séances
    logSession,
    getSessionLogs,
    getLastSessionLog,
    analyzeSession,
    getSuggestedWeight,
    getExerciseProgress,
    // Adaptation automatique
    getExerciseAdaptation,
    getAllAdaptations,
    getFatigueScore,
    // Progression
    addProgressEntry,
    getStats,
    // Nutrition
    getTodayKey,
    getDayLog,
    addFoodEntry,
    updateFoodEntry,
    deleteFoodEntry,
    getDayBalance,
    getWeeklyNutritionSummary,
    // Plan alimentaire & courses
    getWeeklyMealPlan,
    getShoppingList,
    getNextWeekMonday,
    getCurrentWeekMonday,
    // Planning personnalisé
    setScheduleOverride,
    getScheduleOverride,
    // Récap hebdomadaire
    getWeeklyRecap,
    getMealAdjustments,
  };
}
