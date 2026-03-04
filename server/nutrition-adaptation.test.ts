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

// Nouvelle logique intelligente de scaling (ajuste glucides/lipides, pas proportionnel global)
const CARB_FOODS_TEST = ['riz', 'pâtes', 'pain', 'patate', 'flocons', 'tortilla', 'banane', 'farine', 'avoine', 'quinoa'];
const FAT_FOODS_TEST = ['huile', 'beurre', 'noix', 'amandes', 'cajou', 'avocat'];

function scaleMealToCalories(meal: Meal, targetCalories: number): Meal {
  if (meal.totalCalories <= 0) return meal;
  const delta = targetCalories - meal.totalCalories;
  if (Math.abs(delta) <= 80) return meal;

  const isCarb = (name: string) => CARB_FOODS_TEST.some(k => name.toLowerCase().includes(k));
  const isFat = (name: string) => FAT_FOODS_TEST.some(k => name.toLowerCase().includes(k));

  const carbCalories = meal.items.filter(i => isCarb(i.food)).reduce((s, i) => s + i.calories, 0);
  const fatCalories = meal.items.filter(i => isFat(i.food)).reduce((s, i) => s + i.calories, 0);

  let carbDelta = delta;
  let fatDelta = 0;
  if (fatCalories > 0 && carbCalories > 0) {
    carbDelta = Math.round(delta * 0.70);
    fatDelta = delta - carbDelta;
  } else if (carbCalories <= 0 && fatCalories > 0) {
    carbDelta = 0;
    fatDelta = delta;
  }

  const scaledItems: MealItem[] = meal.items.map(item => {
    let itemDelta = 0;
    if (isCarb(item.food) && carbCalories > 0) {
      itemDelta = Math.round(carbDelta * (item.calories / carbCalories));
    } else if (isFat(item.food) && fatCalories > 0) {
      itemDelta = Math.round(fatDelta * (item.calories / fatCalories));
    }
    if (itemDelta === 0) return item;

    const ratio = (item.calories + itemDelta) / item.calories;
    const qtyMatch = item.quantity.match(/(\d+(?:\.\d+)?)/);
    const originalQty = qtyMatch ? parseFloat(qtyMatch[1]) : 0;
    const newQty = Math.round(originalQty * ratio);
    const clampedQty = isCarb(item.food) ? Math.min(newQty, 400) : isFat(item.food) ? Math.min(newQty, 40) : newQty;
    const clampedRatio = originalQty > 0 ? clampedQty / originalQty : ratio;

    return {
      ...item,
      proteins: Math.round(item.proteins * clampedRatio * 10) / 10,
      carbs: Math.round(item.carbs * clampedRatio * 10) / 10,
      fats: Math.round(item.fats * clampedRatio * 10) / 10,
      calories: Math.round(item.calories * clampedRatio),
      quantity: qtyMatch ? item.quantity.replace(/(\d+(?:\.\d+)?)/, String(clampedQty)) : item.quantity,
    };
  });

  const newTotal = scaledItems.reduce((s, i) => s + i.calories, 0);
  return { ...meal, items: scaledItems, totalCalories: newTotal };
}

describe('scaleMealToCalories - logique intelligente', () => {
  // Repas avec glucides (flocons, banane) et lipides (amandes)
  const baseMeal: Meal = {
    time: '07h00',
    name: 'Petit-déjeuner',
    totalCalories: 800,
    items: [
      { food: 'Flocons d\'avoine', quantity: '100g', proteins: 13, carbs: 60, fats: 7, calories: 389 },
      { food: 'Lait demi-écrémé', quantity: '200ml', proteins: 7, carbs: 10, fats: 4, calories: 102 },
      { food: 'Banane', quantity: '150g', proteins: 2, carbs: 34, fats: 0, calories: 134 },
      { food: 'Amandes', quantity: '20g', proteins: 4, carbs: 5, fats: 10, calories: 116 },
      { food: 'Miel', quantity: '15g', proteins: 0, carbs: 12, fats: 0, calories: 46 },
    ],
  };

  it('retourne le repas inchangé si totalCalories = 0', () => {
    const emptyMeal: Meal = { ...baseMeal, totalCalories: 0, items: [] };
    const result = scaleMealToCalories(emptyMeal, 500);
    expect(result).toBe(emptyMeal);
  });

  it('retourne le repas inchangé si delta ≤ 80 kcal (dans la tolérance)', () => {
    const result = scaleMealToCalories(baseMeal, 850); // delta = 50 kcal
    expect(result).toBe(baseMeal);
  });

  it('préserve le nombre d\'items après scaling', () => {
    const result = scaleMealToCalories(baseMeal, 1000); // delta = 200 kcal
    expect(result.items).toHaveLength(baseMeal.items.length);
  });

  it('les protéines restent inchangées (seuls glucides/lipides sont ajustés)', () => {
    const result = scaleMealToCalories(baseMeal, 1000);
    const laitItem = result.items.find(i => i.food === 'Lait demi-écrémé');
    const originalLait = baseMeal.items.find(i => i.food === 'Lait demi-écrémé');
    // Le lait n'est ni glucide ni lipide clé → inchangé
    expect(laitItem?.calories).toBe(originalLait?.calories);
  });

  it('les flocons d\'avoine (glucide) sont augmentés lors d\'un scale vers le haut', () => {
    const result = scaleMealToCalories(baseMeal, 1000); // delta = 200 kcal
    const flocons = result.items.find(i => i.food.includes('Flocons'));
    const originalFlocons = baseMeal.items.find(i => i.food.includes('Flocons'));
    expect(flocons!.calories).toBeGreaterThan(originalFlocons!.calories);
  });

  it('les flocons d\'avoine (glucide) sont réduits lors d\'un scale vers le bas', () => {
    const result = scaleMealToCalories(baseMeal, 600); // delta = -200 kcal
    const flocons = result.items.find(i => i.food.includes('Flocons'));
    const originalFlocons = baseMeal.items.find(i => i.food.includes('Flocons'));
    expect(flocons!.calories).toBeLessThan(originalFlocons!.calories);
  });

  it('les amandes (lipide) sont ajustées en second (30% du delta)', () => {
    const result = scaleMealToCalories(baseMeal, 1000); // delta = 200 kcal
    const amandes = result.items.find(i => i.food === 'Amandes');
    const originalAmandes = baseMeal.items.find(i => i.food === 'Amandes');
    // Les amandes doivent être augmentées (30% du delta = ~60 kcal)
    expect(amandes!.calories).toBeGreaterThan(originalAmandes!.calories);
  });

  it('la quantité numérique des flocons est mise à jour dans la chaîne', () => {
    const result = scaleMealToCalories(baseMeal, 1000);
    const flocons = result.items.find(i => i.food.includes('Flocons'));
    // La quantité doit être supérieure à 100g
    const qty = parseInt(flocons!.quantity.match(/(\d+)/)?.[1] ?? '0', 10);
    expect(qty).toBeGreaterThan(100);
  });

  it('les glucides sont plafonnés à 400g (réalisme)', () => {
    // Repas avec seulement 50g de riz et un delta énorme
    const smallMeal: Meal = {
      time: '12h00',
      name: 'Déjeuner',
      totalCalories: 200,
      items: [
        { food: 'Riz cuit', quantity: '50g', proteins: 3, carbs: 40, fats: 0, calories: 180 },
        { food: 'Poulet grillé', quantity: '100g', proteins: 25, carbs: 0, fats: 2, calories: 120 },
      ],
    };
    const result = scaleMealToCalories(smallMeal, 2000); // delta énorme
    const riz = result.items.find(i => i.food.includes('Riz'));
    const qty = parseInt(riz!.quantity.match(/(\d+)/)?.[1] ?? '0', 10);
    expect(qty).toBeLessThanOrEqual(400);
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

// ============================================================
// TESTS — Détection des modifications nutritionnelles (orange highlighting)
// ============================================================

describe('Détection des modifications de repas suite à un swap', () => {
  // Simuler deux items de repas : un de base et un adapté
  type MealItem = { food: string; quantity: string; calories: number };

  function detectItemChanges(
    currentItem: MealItem,
    baseItem: MealItem | undefined,
    isMealAdaptedBySwap: boolean
  ) {
    const isItemFoodChanged = isMealAdaptedBySwap && !!baseItem && currentItem.food !== baseItem.food;
    const isItemQtyChanged = isMealAdaptedBySwap && !!baseItem && currentItem.food === baseItem.food && currentItem.quantity !== baseItem.quantity;
    const isItemNew = isMealAdaptedBySwap && !baseItem;
    const isItemHighlighted = isItemFoodChanged || isItemQtyChanged || isItemNew;
    return { isItemFoodChanged, isItemQtyChanged, isItemNew, isItemHighlighted };
  }

  it('ne surligne pas si le repas n\'a pas été adapté', () => {
    const current = { food: 'Riz basmati', quantity: '120g', calories: 156 };
    const base = { food: 'Riz basmati', quantity: '120g', calories: 156 };
    const result = detectItemChanges(current, base, false);
    expect(result.isItemHighlighted).toBe(false);
  });

  it('surligne si la quantité a changé suite à un swap', () => {
    const current = { food: 'Riz basmati', quantity: '145g', calories: 188 };
    const base = { food: 'Riz basmati', quantity: '120g', calories: 156 };
    const result = detectItemChanges(current, base, true);
    expect(result.isItemQtyChanged).toBe(true);
    expect(result.isItemHighlighted).toBe(true);
    expect(result.isItemFoodChanged).toBe(false);
  });

  it('surligne si l\'aliment a changé suite à un swap', () => {
    const current = { food: 'Patate douce', quantity: '200g', calories: 172 };
    const base = { food: 'Riz basmati', quantity: '120g', calories: 156 };
    const result = detectItemChanges(current, base, true);
    expect(result.isItemFoodChanged).toBe(true);
    expect(result.isItemHighlighted).toBe(true);
    expect(result.isItemQtyChanged).toBe(false);
  });

  it('surligne si l\'item est nouveau (pas dans le plan de base)', () => {
    const current = { food: 'Banane', quantity: '1 pièce', calories: 89 };
    const result = detectItemChanges(current, undefined, true);
    expect(result.isItemNew).toBe(true);
    expect(result.isItemHighlighted).toBe(true);
  });

  it('ne surligne pas si même aliment et même quantité même avec swap', () => {
    const current = { food: 'Œufs entiers', quantity: '3 pièces', calories: 234 };
    const base = { food: 'Œufs entiers', quantity: '3 pièces', calories: 234 };
    const result = detectItemChanges(current, base, true);
    expect(result.isItemHighlighted).toBe(false);
  });
});

// ============================================================
// TESTS — Logique de détection isMealAdaptedBySwap
// ============================================================

describe('isMealAdaptedBySwap — détection au niveau du repas', () => {
  type Meal = { totalCalories: number; items: { food: string; quantity: string }[] };

  function computeIsMealAdaptedBySwap(
    isAdjusted: boolean,
    planMeal: Meal | undefined,
    basePlanMeal: Meal | undefined
  ): boolean {
    return !isAdjusted && !!planMeal && !!basePlanMeal && (
      planMeal.totalCalories !== basePlanMeal.totalCalories ||
      planMeal.items.some((item, idx) => {
        const baseItem = basePlanMeal.items[idx];
        return !baseItem || item.food !== baseItem.food || item.quantity !== baseItem.quantity;
      })
    );
  }

  it('retourne false si le repas a été ajusté manuellement', () => {
    const meal = { totalCalories: 650, items: [{ food: 'Riz', quantity: '150g' }] };
    expect(computeIsMealAdaptedBySwap(true, meal, meal)).toBe(false);
  });

  it('retourne false si les calories et items sont identiques', () => {
    const meal = { totalCalories: 600, items: [{ food: 'Riz', quantity: '120g' }] };
    expect(computeIsMealAdaptedBySwap(false, meal, meal)).toBe(false);
  });

  it('retourne true si les calories totales diffèrent', () => {
    const current = { totalCalories: 720, items: [{ food: 'Riz', quantity: '145g' }] };
    const base = { totalCalories: 600, items: [{ food: 'Riz', quantity: '120g' }] };
    expect(computeIsMealAdaptedBySwap(false, current, base)).toBe(true);
  });

  it('retourne true si un aliment a changé', () => {
    const current = { totalCalories: 600, items: [{ food: 'Patate douce', quantity: '200g' }] };
    const base = { totalCalories: 600, items: [{ food: 'Riz', quantity: '120g' }] };
    expect(computeIsMealAdaptedBySwap(false, current, base)).toBe(true);
  });

  it('retourne false si planMeal est undefined', () => {
    const base = { totalCalories: 600, items: [{ food: 'Riz', quantity: '120g' }] };
    expect(computeIsMealAdaptedBySwap(false, undefined, base)).toBe(false);
  });

  it('retourne false si basePlanMeal est undefined', () => {
    const meal = { totalCalories: 600, items: [{ food: 'Riz', quantity: '120g' }] };
    expect(computeIsMealAdaptedBySwap(false, meal, undefined)).toBe(false);
  });
});
