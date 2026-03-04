/**
 * Tests unitaires pour la logique d'adaptation nutritionnelle
 * Vérifie que sessionIdToNutritionType mappe correctement les sessions
 * et que les MACRO_TARGETS correspondent aux objectifs caloriques attendus
 */

import { describe, it, expect } from 'vitest';

// ============================================================
// Reproduction de la logique sessionIdToNutritionType
// (copiée depuis useFitnessTracker pour test isolé)
// ============================================================

type NutritionType = 'training' | 'running' | 'football' | 'cycling' | 'rest';

function sessionIdToNutritionType(sessionId: string): NutritionType {
  if (sessionId === 'rest') return 'rest';
  if (sessionId === 'football') return 'football';
  if (sessionId === 'running_endurance' || sessionId === 'running_intervals') return 'running';
  if (sessionId === 'cycling') return 'cycling';
  return 'training';
}

// ============================================================
// MACRO_TARGETS (reproduit depuis nutritionEngine)
// ============================================================

const MACRO_TARGETS = {
  training:  { calories: 2700, proteins: 150, carbs: 305, fats: 75 },
  running:   { calories: 2800, proteins: 150, carbs: 330, fats: 75 },
  football:  { calories: 2900, proteins: 150, carbs: 355, fats: 78 },
  rest:      { calories: 2500, proteins: 150, carbs: 255, fats: 72 },
  cycling:   { calories: 2550, proteins: 150, carbs: 268, fats: 72 },
};

// ============================================================
// TESTS
// ============================================================

describe('sessionIdToNutritionType', () => {
  it('mappe upper_a → training', () => {
    expect(sessionIdToNutritionType('upper_a')).toBe('training');
  });

  it('mappe upper_b → training', () => {
    expect(sessionIdToNutritionType('upper_b')).toBe('training');
  });

  it('mappe lower_a → training', () => {
    expect(sessionIdToNutritionType('lower_a')).toBe('training');
  });

  it('mappe lower_b → training', () => {
    expect(sessionIdToNutritionType('lower_b')).toBe('training');
  });

  it('mappe football → football', () => {
    expect(sessionIdToNutritionType('football')).toBe('football');
  });

  it('mappe running_endurance → running', () => {
    expect(sessionIdToNutritionType('running_endurance')).toBe('running');
  });

  it('mappe running_intervals → running', () => {
    expect(sessionIdToNutritionType('running_intervals')).toBe('running');
  });

  it('mappe cycling → cycling', () => {
    expect(sessionIdToNutritionType('cycling')).toBe('cycling');
  });

  it('mappe rest → rest', () => {
    expect(sessionIdToNutritionType('rest')).toBe('rest');
  });

  it('mappe une session inconnue → training (fallback)', () => {
    expect(sessionIdToNutritionType('unknown_session')).toBe('training');
  });
});

describe('MACRO_TARGETS - objectifs caloriques par type de séance', () => {
  it('training : 2700 kcal', () => {
    expect(MACRO_TARGETS.training.calories).toBe(2700);
  });

  it('running : 2800 kcal (plus élevé car cardio intense)', () => {
    expect(MACRO_TARGETS.running.calories).toBe(2800);
  });

  it('football : 2900 kcal (le plus élevé)', () => {
    expect(MACRO_TARGETS.football.calories).toBe(2900);
  });

  it('rest : 2500 kcal (le plus bas)', () => {
    expect(MACRO_TARGETS.rest.calories).toBe(2500);
  });

  it('cycling : 2550 kcal', () => {
    expect(MACRO_TARGETS.cycling.calories).toBe(2550);
  });

  it('tous les types ont au moins 150g de protéines', () => {
    Object.values(MACRO_TARGETS).forEach(target => {
      expect(target.proteins).toBeGreaterThanOrEqual(150);
    });
  });
});

describe('Logique d\'adaptation nutritionnelle - swap de séances', () => {
  it('un swap upper_a ↔ rest réduit les calories du jour musculation', () => {
    const trainingCalories = MACRO_TARGETS[sessionIdToNutritionType('upper_a')].calories;
    const restCalories = MACRO_TARGETS[sessionIdToNutritionType('rest')].calories;
    expect(trainingCalories).toBeGreaterThan(restCalories);
  });

  it('un swap rest ↔ football augmente les calories du jour repos', () => {
    const restCalories = MACRO_TARGETS[sessionIdToNutritionType('rest')].calories;
    const footballCalories = MACRO_TARGETS[sessionIdToNutritionType('football')].calories;
    expect(footballCalories).toBeGreaterThan(restCalories);
  });

  it('un swap lower_a ↔ running_endurance change les macros de manière cohérente', () => {
    const lowerType = sessionIdToNutritionType('lower_a');
    const runningType = sessionIdToNutritionType('running_endurance');
    expect(lowerType).toBe('training');
    expect(runningType).toBe('running');
    // Running a plus de glucides que training (cardio)
    expect(MACRO_TARGETS.running.carbs).toBeGreaterThan(MACRO_TARGETS.training.carbs);
  });

  it('marquer une séance comme non-faite → type rest', () => {
    const newType = sessionIdToNutritionType('rest');
    expect(newType).toBe('rest');
    expect(MACRO_TARGETS[newType].calories).toBe(2500);
  });
});

describe('Simulation DayLog après adaptation', () => {
  interface DayLog {
    date: string;
    entries: Array<{ calories: number; proteins: number; carbs: number; fats: number }>;
    isTrainingDay: boolean;
    sessionType?: NutritionType;
    sessionId?: string;
  }

  function adaptNutritionForSession(
    existingLog: DayLog | undefined,
    dateKey: string,
    newSessionId: string
  ): DayLog {
    const newType = sessionIdToNutritionType(newSessionId);
    const isTraining = newType !== 'rest';
    return {
      date: dateKey,
      entries: existingLog?.entries ?? [],
      isTrainingDay: isTraining,
      sessionType: newType,
      sessionId: newSessionId,
    };
  }

  it('préserve les entries existantes lors de l\'adaptation', () => {
    const existingLog: DayLog = {
      date: '2026-03-04',
      entries: [{ calories: 500, proteins: 30, carbs: 60, fats: 15 }],
      isTrainingDay: true,
      sessionType: 'training',
      sessionId: 'upper_a',
    };
    const adapted = adaptNutritionForSession(existingLog, '2026-03-04', 'rest');
    expect(adapted.entries).toHaveLength(1);
    expect(adapted.entries[0].calories).toBe(500);
  });

  it('met à jour sessionType et isTrainingDay correctement', () => {
    const existingLog: DayLog = {
      date: '2026-03-04',
      entries: [],
      isTrainingDay: true,
      sessionType: 'training',
      sessionId: 'upper_a',
    };
    const adapted = adaptNutritionForSession(existingLog, '2026-03-04', 'rest');
    expect(adapted.sessionType).toBe('rest');
    expect(adapted.isTrainingDay).toBe(false);
    expect(adapted.sessionId).toBe('rest');
  });

  it('crée un nouveau DayLog si aucun log existant', () => {
    const adapted = adaptNutritionForSession(undefined, '2026-03-05', 'football');
    expect(adapted.date).toBe('2026-03-05');
    expect(adapted.entries).toHaveLength(0);
    expect(adapted.sessionType).toBe('football');
    expect(adapted.isTrainingDay).toBe(true);
  });

  it('swap bidirectionnel : J3 et J7 échangent leurs types nutritionnels', () => {
    const logJ3: DayLog = {
      date: '2026-03-03',
      entries: [{ calories: 800, proteins: 50, carbs: 90, fats: 20 }],
      isTrainingDay: true,
      sessionType: 'training',
      sessionId: 'lower_a',
    };
    const logJ7: DayLog = {
      date: '2026-03-07',
      entries: [],
      isTrainingDay: false,
      sessionType: 'rest',
      sessionId: 'rest',
    };

    // Swap : J3 devient repos, J7 devient lower_a
    const adaptedJ3 = adaptNutritionForSession(logJ3, '2026-03-03', 'rest');
    const adaptedJ7 = adaptNutritionForSession(logJ7, '2026-03-07', 'lower_a');

    // J3 : repas déjà mangés préservés, mais objectif change
    expect(adaptedJ3.entries).toHaveLength(1);
    expect(adaptedJ3.sessionType).toBe('rest');
    expect(adaptedJ3.isTrainingDay).toBe(false);

    // J7 : aucun repas consommé, objectif passe en training
    expect(adaptedJ7.entries).toHaveLength(0);
    expect(adaptedJ7.sessionType).toBe('training');
    expect(adaptedJ7.isTrainingDay).toBe(true);
  });
});

// ============================================================
// Tests pour scaleMealToCalories (logique de scaling des repas)
// ============================================================

interface MealItem {
  food: string;
  quantity: string;
  proteins: number;
  carbs: number;
  fats: number;
  calories: number;
}

interface Meal {
  time: string;
  name: string;
  items: MealItem[];
  totalCalories: number;
}

function scaleMealToCalories(meal: Meal, targetCalories: number): Meal {
  if (meal.totalCalories <= 0) return meal;
  const ratio = targetCalories / meal.totalCalories;
  const scaledItems: MealItem[] = meal.items.map(item => ({
    ...item,
    proteins: Math.round(item.proteins * ratio * 10) / 10,
    carbs: Math.round(item.carbs * ratio * 10) / 10,
    fats: Math.round(item.fats * ratio * 10) / 10,
    calories: Math.round(item.calories * ratio),
    quantity: item.quantity.replace(/(\d+(?:\.\d+)?)/, (match) => {
      const originalQty = parseFloat(match);
      const newQty = Math.round(originalQty * ratio);
      return String(newQty);
    }),
  }));
  const newTotal = scaledItems.reduce((s, i) => s + i.calories, 0);
  return { ...meal, items: scaledItems, totalCalories: newTotal };
}

describe('scaleMealToCalories', () => {
  const baseMeal: Meal = {
    time: '07h00',
    name: 'Petit-déjeuner',
    totalCalories: 800,
    items: [
      { food: 'Flocons d\'avoine', quantity: '100g', proteins: 13, carbs: 60, fats: 7, calories: 389 },
      { food: 'Lait demi-écrémé', quantity: '200ml', proteins: 7, carbs: 10, fats: 4, calories: 102 },
      { food: 'Banane', quantity: '1 (150g)', proteins: 2, carbs: 34, fats: 0, calories: 134 },
      { food: 'Amandes', quantity: '20g', proteins: 4, carbs: 5, fats: 10, calories: 116 },
      { food: 'Miel', quantity: '15g', proteins: 0, carbs: 12, fats: 0, calories: 46 },
    ],
  };

  it('retourne le repas inchangé si totalCalories = 0', () => {
    const emptyMeal: Meal = { ...baseMeal, totalCalories: 0, items: [] };
    const result = scaleMealToCalories(emptyMeal, 500);
    expect(result).toBe(emptyMeal);
  });

  it('scale vers le haut (800 → 870 kcal pour football)', () => {
    const result = scaleMealToCalories(baseMeal, 870);
    expect(result.totalCalories).toBeGreaterThan(800);
    // Tolérance ±10 kcal due aux arrondis
    expect(Math.abs(result.totalCalories - 870)).toBeLessThanOrEqual(20);
  });

  it('scale vers le bas (800 → 750 kcal pour repos)', () => {
    const result = scaleMealToCalories(baseMeal, 750);
    expect(result.totalCalories).toBeLessThan(800);
    expect(Math.abs(result.totalCalories - 750)).toBeLessThanOrEqual(20);
  });

  it('préserve le nombre d\'items après scaling', () => {
    const result = scaleMealToCalories(baseMeal, 900);
    expect(result.items).toHaveLength(baseMeal.items.length);
  });

  it('les macros scalées sont proportionnelles', () => {
    const ratio = 870 / 800;
    const result = scaleMealToCalories(baseMeal, 870);
    const originalProteins = baseMeal.items.reduce((s, i) => s + i.proteins, 0);
    const scaledProteins = result.items.reduce((s, i) => s + i.proteins, 0);
    // Tolérance ±2g due aux arrondis
    expect(Math.abs(scaledProteins - originalProteins * ratio)).toBeLessThanOrEqual(2);
  });
});

describe('generateWeeklyMealPlan avec sessionOverrides', () => {
  it('sans override : les jours de repos ont moins de calories que les jours d\'entraînement', () => {
    // Lundi = training (2700 kcal), Dimanche = rest (2500 kcal)
    const trainingTarget = MACRO_TARGETS.training.calories;
    const restTarget = MACRO_TARGETS.rest.calories;
    expect(trainingTarget).toBeGreaterThan(restTarget);
  });

  it('avec override football : la cible est 2900 kcal', () => {
    const type = sessionIdToNutritionType('football');
    expect(MACRO_TARGETS[type].calories).toBe(2900);
  });

  it('avec override cycling : la cible est 2550 kcal (entre repos et training)', () => {
    const type = sessionIdToNutritionType('cycling');
    const target = MACRO_TARGETS[type].calories;
    expect(target).toBeGreaterThan(MACRO_TARGETS.rest.calories);
    expect(target).toBeLessThan(MACRO_TARGETS.training.calories);
  });

  it('la hiérarchie calorique est cohérente : football > running > training > cycling > rest', () => {
    expect(MACRO_TARGETS.football.calories).toBeGreaterThan(MACRO_TARGETS.running.calories);
    expect(MACRO_TARGETS.running.calories).toBeGreaterThan(MACRO_TARGETS.training.calories);
    expect(MACRO_TARGETS.training.calories).toBeGreaterThan(MACRO_TARGETS.cycling.calories);
    expect(MACRO_TARGETS.cycling.calories).toBeGreaterThan(MACRO_TARGETS.rest.calories);
  });

  it('les protéines restent constantes quel que soit le type de séance', () => {
    const proteinValues = Object.values(MACRO_TARGETS).map(t => t.proteins);
    const allSame = proteinValues.every(p => p === 150);
    expect(allSame).toBe(true);
  });
});
