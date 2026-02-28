// ============================================================
// MOTEUR NUTRITIONNEL — FitPro v3
// 12 semaines de menus DIFFÉRENTS, rotation intelligente,
// jamais les mêmes plats deux semaines de suite.
// ============================================================

export interface FoodEntry {
  id: string;
  foodId: string;
  foodName: string;
  quantity: number;
  meal: 'breakfast' | 'lunch' | 'snack' | 'dinner' | 'before_sleep';
  proteins: number;
  carbs: number;
  fats: number;
  calories: number;
}

export interface DayLog {
  date: string;
  entries: FoodEntry[];
  notes?: string;
  isTrainingDay: boolean;
  sessionId?: string;
}

export interface DayMacros {
  proteins: number;
  carbs: number;
  fats: number;
  calories: number;
}

export interface DayBalance {
  consumed: DayMacros;
  target: DayMacros;
  surplus: DayMacros;
  proteinAdequacy: number;
  recommendation: string;
  status: 'optimal' | 'surplus' | 'deficit' | 'protein_low';
}

// ============================================================
// MACROS CIBLES
// ============================================================

export const MACRO_TARGETS = {
  training: { calories: 2900, proteins: 140, carbs: 430, fats: 70 },
  rest: { calories: 2600, proteins: 140, carbs: 360, fats: 70 },
};

// ============================================================
// CALCUL DES MACROS D'UN ALIMENT
// ============================================================

export function computeFoodMacros(
  foodId: string,
  foodName: string,
  quantity: number,
  per100g: { proteins: number; carbs: number; fats: number; calories: number }
): Omit<FoodEntry, 'id' | 'meal'> {
  const factor = quantity / 100;
  return {
    foodId,
    foodName,
    quantity,
    proteins: Math.round(per100g.proteins * factor * 10) / 10,
    carbs: Math.round(per100g.carbs * factor * 10) / 10,
    fats: Math.round(per100g.fats * factor * 10) / 10,
    calories: Math.round(per100g.calories * factor),
  };
}

// ============================================================
// CALCUL DU BILAN JOURNALIER
// ============================================================

export function computeDayBalance(log: DayLog): DayBalance {
  const target = log.isTrainingDay ? MACRO_TARGETS.training : MACRO_TARGETS.rest;
  const consumed: DayMacros = log.entries.reduce(
    (acc, e) => ({
      proteins: acc.proteins + e.proteins,
      carbs: acc.carbs + e.carbs,
      fats: acc.fats + e.fats,
      calories: acc.calories + e.calories,
    }),
    { proteins: 0, carbs: 0, fats: 0, calories: 0 }
  );
  const surplus: DayMacros = {
    proteins: Math.round((consumed.proteins - target.proteins) * 10) / 10,
    carbs: Math.round((consumed.carbs - target.carbs) * 10) / 10,
    fats: Math.round((consumed.fats - target.fats) * 10) / 10,
    calories: Math.round(consumed.calories - target.calories),
  };
  const proteinAdequacy = Math.round((consumed.proteins / target.proteins) * 100);

  let status: DayBalance['status'] = 'optimal';
  let recommendation = '';

  if (proteinAdequacy < 80) {
    status = 'protein_low';
    recommendation = `⚠️ Protéines insuffisantes (${Math.round(consumed.proteins)}g / ${target.proteins}g). Ajoute ${Math.round(target.proteins - consumed.proteins)}g de protéines — ex : ${Math.round((target.proteins - consumed.proteins) / 0.27)}g de blanc de poulet.`;
  } else if (surplus.calories > 400) {
    status = 'surplus';
    recommendation = `📊 Surplus de ${surplus.calories} kcal. Réduis les glucides de ${Math.round(surplus.calories / 4)}g demain.`;
  } else if (surplus.calories < -300) {
    status = 'deficit';
    recommendation = `📉 Déficit de ${Math.abs(surplus.calories)} kcal. Ajoute ${Math.round(Math.abs(surplus.calories) / 4)}g de glucides (riz, patate douce). Un déficit freine la prise de muscle.`;
  } else {
    recommendation = `✅ Bilan optimal ! ${Math.round(consumed.proteins)}g de protéines, ${Math.round(consumed.calories)} kcal.`;
  }

  return { consumed, target, surplus, proteinAdequacy, recommendation, status };
}

// ============================================================
// TYPES PLAN ALIMENTAIRE
// ============================================================

export interface MealItem {
  food: string;
  quantity: string;
  proteins: number;
  carbs: number;
  fats: number;
  calories: number;
}

export interface Meal {
  time: string;
  name: string;
  items: MealItem[];
  totalCalories: number;
}

export interface WeeklyMealPlan {
  weekStartDate: string;
  days: Array<{
    date: string;
    dayName: string;
    isTrainingDay: boolean;
    sessionName?: string;
    meals: Meal[];
    totalMacros: DayMacros;
  }>;
  weeklyTotals: DayMacros;
}

// ============================================================
// BIBLIOTHÈQUE DE REPAS — 12 SEMAINES DE ROTATION
// Chaque semaine a ses propres variantes de repas.
// ============================================================

const DAY_NAMES_FR = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

const SESSION_BY_DAY: Record<number, string | null> = {
  0: null, 1: 'Haut du corps A', 2: 'Bas du corps A',
  3: null, 4: 'Haut du corps B', 5: 'Bas du corps B', 6: null,
};

// ============================================================
// PETITS-DÉJEUNERS — 12 variantes (training)
// ============================================================
const BREAKFASTS_TRAINING: Meal[] = [
  { time: '07h00', name: 'Petit-déjeuner', totalCalories: 781, items: [
    { food: 'Flocons d\'avoine', quantity: '100g', proteins: 13, carbs: 60, fats: 7, calories: 389 },
    { food: 'Whey Isolate vanille', quantity: '30g', proteins: 25, carbs: 1, fats: 0, calories: 111 },
    { food: 'Banane', quantity: '1 (120g)', proteins: 1, carbs: 28, fats: 0, calories: 107 },
    { food: 'Amandes', quantity: '30g', proteins: 6, carbs: 7, fats: 15, calories: 174 },
  ]},
  { time: '07h00', name: 'Petit-déjeuner', totalCalories: 760, items: [
    { food: 'Pain complet grillé', quantity: '3 tranches (90g)', proteins: 9, carbs: 48, fats: 3, calories: 252 },
    { food: 'Œufs brouillés', quantity: '3 œufs (180g)', proteins: 23, carbs: 2, fats: 18, calories: 257 },
    { food: 'Banane', quantity: '1 (120g)', proteins: 1, carbs: 28, fats: 0, calories: 107 },
    { food: 'Fromage blanc 0%', quantity: '100g', proteins: 8, carbs: 4, fats: 0, calories: 48 },
  ]},
  { time: '07h00', name: 'Petit-déjeuner', totalCalories: 790, items: [
    { food: 'Porridge (avoine + lait écrémé)', quantity: '100g avoine + 300ml lait', proteins: 22, carbs: 72, fats: 8, calories: 452 },
    { food: 'Whey Isolate chocolat', quantity: '30g', proteins: 25, carbs: 2, fats: 1, calories: 117 },
    { food: 'Myrtilles', quantity: '100g', proteins: 1, carbs: 14, fats: 0, calories: 57 },
    { food: 'Noix de cajou', quantity: '30g', proteins: 5, carbs: 9, fats: 13, calories: 174 },
  ]},
  { time: '07h00', name: 'Petit-déjeuner', totalCalories: 775, items: [
    { food: 'Flocons d\'avoine', quantity: '90g', proteins: 12, carbs: 54, fats: 6, calories: 350 },
    { food: 'Skyr nature', quantity: '200g', proteins: 22, carbs: 8, fats: 0, calories: 120 },
    { food: 'Mangue', quantity: '150g', proteins: 1, carbs: 23, fats: 0, calories: 96 },
    { food: 'Amandes effilées', quantity: '25g', proteins: 5, carbs: 6, fats: 12, calories: 145 },
  ]},
  { time: '07h00', name: 'Petit-déjeuner', totalCalories: 800, items: [
    { food: 'Pancakes protéinés (avoine + œuf + banane)', quantity: '3 pancakes', proteins: 28, carbs: 62, fats: 12, calories: 468 },
    { food: 'Fromage blanc 0%', quantity: '150g', proteins: 12, carbs: 6, fats: 0, calories: 72 },
    { food: 'Framboises', quantity: '100g', proteins: 1, carbs: 12, fats: 0, calories: 52 },
  ]},
  { time: '07h00', name: 'Petit-déjeuner', totalCalories: 770, items: [
    { food: 'Muesli sans sucre ajouté', quantity: '80g', proteins: 10, carbs: 52, fats: 8, calories: 320 },
    { food: 'Lait écrémé', quantity: '300ml', proteins: 10, carbs: 15, fats: 0, calories: 100 },
    { food: 'Whey Isolate fraise', quantity: '30g', proteins: 25, carbs: 1, fats: 0, calories: 111 },
    { food: 'Kiwi', quantity: '2 (150g)', proteins: 2, carbs: 18, fats: 0, calories: 90 },
  ]},
  { time: '07h00', name: 'Petit-déjeuner', totalCalories: 785, items: [
    { food: 'Flocons d\'avoine', quantity: '100g', proteins: 13, carbs: 60, fats: 7, calories: 389 },
    { food: 'Beurre de cacahuète (naturel)', quantity: '20g', proteins: 5, carbs: 3, fats: 10, calories: 120 },
    { food: 'Whey Isolate vanille', quantity: '30g', proteins: 25, carbs: 1, fats: 0, calories: 111 },
    { food: 'Pomme', quantity: '1 (150g)', proteins: 0, carbs: 22, fats: 0, calories: 78 },
  ]},
  { time: '07h00', name: 'Petit-déjeuner', totalCalories: 760, items: [
    { food: 'Riz au lait maison (riz + lait écrémé)', quantity: '200g', proteins: 10, carbs: 58, fats: 2, calories: 292 },
    { food: 'Œufs durs', quantity: '3 (180g)', proteins: 23, carbs: 2, fats: 18, calories: 257 },
    { food: 'Orange', quantity: '1 (180g)', proteins: 1, carbs: 18, fats: 0, calories: 76 },
  ]},
  { time: '07h00', name: 'Petit-déjeuner', totalCalories: 795, items: [
    { food: 'Flocons d\'avoine', quantity: '100g', proteins: 13, carbs: 60, fats: 7, calories: 389 },
    { food: 'Skyr vanille', quantity: '200g', proteins: 22, carbs: 8, fats: 0, calories: 120 },
    { food: 'Pêche', quantity: '1 (150g)', proteins: 1, carbs: 14, fats: 0, calories: 60 },
    { food: 'Noix', quantity: '30g', proteins: 5, carbs: 4, fats: 19, calories: 196 },
  ]},
  { time: '07h00', name: 'Petit-déjeuner', totalCalories: 780, items: [
    { food: 'Toast complet + avocat écrasé', quantity: '2 tranches (60g) + 75g avocat', proteins: 7, carbs: 34, fats: 12, calories: 272 },
    { food: 'Œufs pochés', quantity: '3 (180g)', proteins: 23, carbs: 2, fats: 18, calories: 257 },
    { food: 'Fromage blanc 0%', quantity: '150g', proteins: 12, carbs: 6, fats: 0, calories: 72 },
  ]},
  { time: '07h00', name: 'Petit-déjeuner', totalCalories: 770, items: [
    { food: 'Overnight oats (avoine + lait + chia)', quantity: '100g avoine + 200ml lait + 15g chia', proteins: 20, carbs: 68, fats: 11, calories: 455 },
    { food: 'Whey Isolate caramel', quantity: '30g', proteins: 25, carbs: 1, fats: 0, calories: 111 },
    { food: 'Fraises', quantity: '150g', proteins: 1, carbs: 11, fats: 0, calories: 48 },
  ]},
  { time: '07h00', name: 'Petit-déjeuner', totalCalories: 790, items: [
    { food: 'Galettes de riz + beurre de cajou', quantity: '4 galettes + 25g beurre cajou', proteins: 6, carbs: 36, fats: 12, calories: 272 },
    { food: 'Œufs à la coque', quantity: '3 (180g)', proteins: 23, carbs: 2, fats: 18, calories: 257 },
    { food: 'Banane', quantity: '1 (120g)', proteins: 1, carbs: 28, fats: 0, calories: 107 },
  ]},
];

// ============================================================
// DÉJEUNERS — 12 variantes (training)
// ============================================================
const LUNCHES_TRAINING: Meal[] = [
  { time: '12h30', name: 'Déjeuner', totalCalories: 617, items: [
    { food: 'Blanc de poulet grillé', quantity: '150g', proteins: 41, carbs: 0, fats: 5, calories: 203 },
    { food: 'Patate douce rôtie', quantity: '300g', proteins: 5, carbs: 60, fats: 0, calories: 258 },
    { food: 'Brocolis vapeur', quantity: '200g', proteins: 6, carbs: 14, fats: 0, calories: 68 },
    { food: 'Huile d\'olive', quantity: '10g', proteins: 0, carbs: 0, fats: 10, calories: 88 },
  ]},
  { time: '12h30', name: 'Déjeuner', totalCalories: 630, items: [
    { food: 'Dinde sautée au wok', quantity: '150g', proteins: 41, carbs: 0, fats: 3, calories: 188 },
    { food: 'Riz basmati', quantity: '100g cru', proteins: 8, carbs: 78, fats: 1, calories: 356 },
    { food: 'Poivrons + courgettes sautés', quantity: '200g', proteins: 3, carbs: 12, fats: 0, calories: 60 },
  ]},
  { time: '12h30', name: 'Déjeuner', totalCalories: 640, items: [
    { food: 'Steak de bœuf 5% MG', quantity: '150g', proteins: 36, carbs: 0, fats: 8, calories: 212 },
    { food: 'Pâtes complètes', quantity: '100g cru', proteins: 13, carbs: 68, fats: 2, calories: 342 },
    { food: 'Épinards sautés à l\'ail', quantity: '200g', proteins: 5, carbs: 6, fats: 1, calories: 57 },
  ]},
  { time: '12h30', name: 'Déjeuner', totalCalories: 620, items: [
    { food: 'Poulet mariné sauce soja + gingembre', quantity: '150g', proteins: 41, carbs: 2, fats: 5, calories: 213 },
    { food: 'Riz thaï', quantity: '100g cru', proteins: 7, carbs: 80, fats: 1, calories: 356 },
    { food: 'Edamame', quantity: '100g', proteins: 11, carbs: 8, fats: 5, calories: 121 },
  ]},
  { time: '12h30', name: 'Déjeuner', totalCalories: 635, items: [
    { food: 'Saumon grillé', quantity: '150g', proteins: 30, carbs: 0, fats: 20, calories: 312 },
    { food: 'Patate douce purée', quantity: '250g', proteins: 4, carbs: 50, fats: 0, calories: 215 },
    { food: 'Haricots verts', quantity: '200g', proteins: 4, carbs: 8, fats: 0, calories: 48 },
  ]},
  { time: '12h30', name: 'Déjeuner', totalCalories: 625, items: [
    { food: 'Blanc de poulet en lanières + curry', quantity: '150g', proteins: 41, carbs: 3, fats: 5, calories: 218 },
    { food: 'Riz basmati complet', quantity: '100g cru', proteins: 8, carbs: 76, fats: 2, calories: 352 },
    { food: 'Courgettes grillées', quantity: '200g', proteins: 3, carbs: 8, fats: 0, calories: 44 },
  ]},
  { time: '12h30', name: 'Déjeuner', totalCalories: 640, items: [
    { food: 'Thon en boîte au naturel', quantity: '160g égoutté', proteins: 36, carbs: 0, fats: 2, calories: 160 },
    { food: 'Pâtes semi-complètes', quantity: '100g cru', proteins: 13, carbs: 68, fats: 2, calories: 342 },
    { food: 'Tomates cerises + basilic', quantity: '150g', proteins: 1, carbs: 5, fats: 0, calories: 27 },
    { food: 'Huile d\'olive', quantity: '10g', proteins: 0, carbs: 0, fats: 10, calories: 88 },
  ]},
  { time: '12h30', name: 'Déjeuner', totalCalories: 620, items: [
    { food: 'Escalope de veau', quantity: '150g', proteins: 35, carbs: 0, fats: 6, calories: 194 },
    { food: 'Patate douce + carottes rôties', quantity: '300g', proteins: 5, carbs: 58, fats: 0, calories: 252 },
    { food: 'Salade verte + vinaigrette légère', quantity: '100g + 10g huile', proteins: 1, carbs: 3, fats: 10, calories: 105 },
  ]},
  { time: '12h30', name: 'Déjeuner', totalCalories: 630, items: [
    { food: 'Poulet rôti aux herbes', quantity: '150g', proteins: 41, carbs: 0, fats: 5, calories: 203 },
    { food: 'Boulgour', quantity: '80g cru', proteins: 10, carbs: 56, fats: 2, calories: 280 },
    { food: 'Ratatouille maison', quantity: '200g', proteins: 3, carbs: 14, fats: 2, calories: 86 },
  ]},
  { time: '12h30', name: 'Déjeuner', totalCalories: 625, items: [
    { food: 'Filet de cabillaud pané maison', quantity: '180g', proteins: 38, carbs: 8, fats: 4, calories: 220 },
    { food: 'Riz pilaf', quantity: '100g cru', proteins: 8, carbs: 78, fats: 1, calories: 356 },
    { food: 'Brocolis + chou-fleur vapeur', quantity: '200g', proteins: 5, carbs: 12, fats: 0, calories: 68 },
  ]},
  { time: '12h30', name: 'Déjeuner', totalCalories: 635, items: [
    { food: 'Poulet tikka masala (sauce tomate + épices)', quantity: '150g poulet + 100g sauce', proteins: 42, carbs: 8, fats: 6, calories: 254 },
    { food: 'Riz basmati', quantity: '100g cru', proteins: 8, carbs: 78, fats: 1, calories: 356 },
    { food: 'Concombre + yaourt 0%', quantity: '100g + 50g', proteins: 3, carbs: 4, fats: 0, calories: 28 },
  ]},
  { time: '12h30', name: 'Déjeuner', totalCalories: 620, items: [
    { food: 'Filet de dinde au citron + thym', quantity: '150g', proteins: 41, carbs: 0, fats: 3, calories: 188 },
    { food: 'Patate douce + lentilles corail', quantity: '200g + 50g cru', proteins: 10, carbs: 58, fats: 1, calories: 284 },
    { food: 'Haricots verts + amandes effilées', quantity: '150g + 10g', proteins: 4, carbs: 6, fats: 6, calories: 90 },
  ]},
];

// ============================================================
// COLLATIONS PRÉ-TRAINING — 12 variantes
// ============================================================
const SNACKS_TRAINING: Meal[] = [
  { time: '16h00', name: 'Collation pré-training', totalCalories: 250, items: [
    { food: 'Œufs durs', quantity: '2 (120g)', proteins: 16, carbs: 1, fats: 12, calories: 172 },
    { food: 'Pomme', quantity: '1 (150g)', proteins: 0, carbs: 22, fats: 0, calories: 78 },
  ]},
  { time: '16h00', name: 'Collation pré-training', totalCalories: 260, items: [
    { food: 'Fromage blanc 0%', quantity: '200g', proteins: 16, carbs: 8, fats: 0, calories: 96 },
    { food: 'Banane', quantity: '1 (120g)', proteins: 1, carbs: 28, fats: 0, calories: 107 },
    { food: 'Amandes', quantity: '15g', proteins: 3, carbs: 3, fats: 8, calories: 87 },
  ]},
  { time: '16h00', name: 'Collation pré-training', totalCalories: 255, items: [
    { food: 'Pain de riz + beurre de cacahuète', quantity: '2 galettes + 20g', proteins: 7, carbs: 22, fats: 11, calories: 215 },
    { food: 'Kiwi', quantity: '2 (150g)', proteins: 2, carbs: 18, fats: 0, calories: 90 },
  ]},
  { time: '16h00', name: 'Collation pré-training', totalCalories: 248, items: [
    { food: 'Skyr nature', quantity: '150g', proteins: 17, carbs: 6, fats: 0, calories: 90 },
    { food: 'Flocons d\'avoine crus', quantity: '40g', proteins: 5, carbs: 24, fats: 3, calories: 156 },
  ]},
  { time: '16h00', name: 'Collation pré-training', totalCalories: 252, items: [
    { food: 'Blanc de poulet froid', quantity: '80g', proteins: 22, carbs: 0, fats: 3, calories: 108 },
    { food: 'Riz soufflé + miel', quantity: '30g + 10g', proteins: 2, carbs: 30, fats: 0, calories: 128 },
  ]},
  { time: '16h00', name: 'Collation pré-training', totalCalories: 258, items: [
    { food: 'Shake maison (lait écrémé + banane + whey)', quantity: '250ml + 1 banane + 20g whey', proteins: 25, carbs: 38, fats: 1, calories: 261 },
  ]},
  { time: '16h00', name: 'Collation pré-training', totalCalories: 245, items: [
    { food: 'Œuf dur', quantity: '2 (120g)', proteins: 16, carbs: 1, fats: 12, calories: 172 },
    { food: 'Dattes', quantity: '3 (30g)', proteins: 1, carbs: 22, fats: 0, calories: 84 },
  ]},
  { time: '16h00', name: 'Collation pré-training', totalCalories: 255, items: [
    { food: 'Fromage blanc 0% + confiture de fruits rouges', quantity: '200g + 15g', proteins: 16, carbs: 20, fats: 0, calories: 144 },
    { food: 'Noix de cajou', quantity: '25g', proteins: 4, carbs: 8, fats: 11, calories: 145 },
  ]},
  { time: '16h00', name: 'Collation pré-training', totalCalories: 250, items: [
    { food: 'Barre protéinée maison (avoine + whey + miel)', quantity: '1 barre (80g)', proteins: 20, carbs: 32, fats: 5, calories: 249 },
  ]},
  { time: '16h00', name: 'Collation pré-training', totalCalories: 260, items: [
    { food: 'Skyr fruits rouges', quantity: '200g', proteins: 22, carbs: 16, fats: 0, calories: 152 },
    { food: 'Galettes de riz', quantity: '2 (20g)', proteins: 1, carbs: 14, fats: 0, calories: 70 },
  ]},
  { time: '16h00', name: 'Collation pré-training', totalCalories: 248, items: [
    { food: 'Yaourt grec 0%', quantity: '200g', proteins: 20, carbs: 8, fats: 0, calories: 112 },
    { food: 'Miel + cannelle', quantity: '15g miel', proteins: 0, carbs: 12, fats: 0, calories: 46 },
    { food: 'Noix', quantity: '20g', proteins: 3, carbs: 3, fats: 13, calories: 131 },
  ]},
  { time: '16h00', name: 'Collation pré-training', totalCalories: 255, items: [
    { food: 'Blanc de dinde froid', quantity: '80g', proteins: 22, carbs: 0, fats: 2, calories: 100 },
    { food: 'Pomme + beurre de cacahuète', quantity: '1 pomme + 15g', proteins: 3, carbs: 26, fats: 8, calories: 184 },
  ]},
];

// ============================================================
// DÎNERS POST-TRAINING — 12 variantes
// ============================================================
const DINNERS_TRAINING: Meal[] = [
  { time: '19h30', name: 'Dîner post-training', totalCalories: 716, items: [
    { food: 'Saumon grillé', quantity: '150g', proteins: 30, carbs: 0, fats: 20, calories: 312 },
    { food: 'Riz basmati', quantity: '100g cru', proteins: 8, carbs: 78, fats: 1, calories: 356 },
    { food: 'Haricots verts', quantity: '200g', proteins: 4, carbs: 8, fats: 0, calories: 48 },
  ]},
  { time: '19h30', name: 'Dîner post-training', totalCalories: 720, items: [
    { food: 'Poulet rôti', quantity: '180g', proteins: 49, carbs: 0, fats: 6, calories: 244 },
    { food: 'Patate douce au four', quantity: '300g', proteins: 5, carbs: 60, fats: 0, calories: 258 },
    { food: 'Brocolis + carottes vapeur', quantity: '200g', proteins: 4, carbs: 14, fats: 0, calories: 72 },
  ]},
  { time: '19h30', name: 'Dîner post-training', totalCalories: 710, items: [
    { food: 'Steak haché 5% MG', quantity: '180g', proteins: 43, carbs: 0, fats: 9, calories: 254 },
    { food: 'Pâtes complètes', quantity: '100g cru', proteins: 13, carbs: 68, fats: 2, calories: 342 },
    { food: 'Sauce tomate maison', quantity: '100g', proteins: 2, carbs: 8, fats: 1, calories: 52 },
  ]},
  { time: '19h30', name: 'Dîner post-training', totalCalories: 718, items: [
    { food: 'Thon frais poêlé', quantity: '150g', proteins: 36, carbs: 0, fats: 5, calories: 189 },
    { food: 'Riz thaï + lait de coco léger', quantity: '100g cru + 50ml', proteins: 8, carbs: 80, fats: 4, calories: 388 },
    { food: 'Épinards sautés', quantity: '150g', proteins: 4, carbs: 5, fats: 1, calories: 46 },
  ]},
  { time: '19h30', name: 'Dîner post-training', totalCalories: 722, items: [
    { food: 'Cabillaud en papillote + citron', quantity: '200g', proteins: 46, carbs: 0, fats: 2, calories: 164 },
    { food: 'Patate douce + lentilles', quantity: '200g + 60g cru', proteins: 13, carbs: 68, fats: 1, calories: 337 },
    { food: 'Courgettes grillées', quantity: '150g', proteins: 2, carbs: 5, fats: 0, calories: 27 },
  ]},
  { time: '19h30', name: 'Dîner post-training', totalCalories: 715, items: [
    { food: 'Escalope de poulet panée maison', quantity: '150g', proteins: 40, carbs: 8, fats: 6, calories: 246 },
    { food: 'Riz basmati complet', quantity: '100g cru', proteins: 8, carbs: 76, fats: 2, calories: 352 },
    { food: 'Poêlée de légumes (poivrons, oignons)', quantity: '200g', proteins: 3, carbs: 14, fats: 0, calories: 68 },
  ]},
  { time: '19h30', name: 'Dîner post-training', totalCalories: 720, items: [
    { food: 'Saumon teriyaki', quantity: '150g + 20g sauce soja', proteins: 31, carbs: 4, fats: 20, calories: 320 },
    { food: 'Nouilles soba', quantity: '100g cru', proteins: 14, carbs: 72, fats: 1, calories: 356 },
    { food: 'Brocolis + sésame', quantity: '200g + 5g', proteins: 7, carbs: 14, fats: 3, calories: 111 },
  ]},
  { time: '19h30', name: 'Dîner post-training', totalCalories: 718, items: [
    { food: 'Dinde hachée bolognaise', quantity: '180g', proteins: 49, carbs: 0, fats: 4, calories: 228 },
    { food: 'Pâtes semi-complètes', quantity: '100g cru', proteins: 13, carbs: 68, fats: 2, calories: 342 },
    { food: 'Sauce tomate + basilic', quantity: '100g', proteins: 2, carbs: 8, fats: 1, calories: 52 },
  ]},
  { time: '19h30', name: 'Dîner post-training', totalCalories: 712, items: [
    { food: 'Crevettes sautées à l\'ail', quantity: '200g', proteins: 38, carbs: 2, fats: 3, calories: 190 },
    { food: 'Riz basmati', quantity: '100g cru', proteins: 8, carbs: 78, fats: 1, calories: 356 },
    { food: 'Poivrons + courgettes', quantity: '200g', proteins: 3, carbs: 12, fats: 0, calories: 60 },
  ]},
  { time: '19h30', name: 'Dîner post-training', totalCalories: 720, items: [
    { food: 'Filet de bœuf grillé', quantity: '150g', proteins: 36, carbs: 0, fats: 8, calories: 212 },
    { food: 'Patate douce + haricots rouges', quantity: '200g + 80g cuit', proteins: 11, carbs: 62, fats: 1, calories: 300 },
    { food: 'Salade de roquette', quantity: '80g + 10g huile', proteins: 2, carbs: 3, fats: 10, calories: 110 },
  ]},
  { time: '19h30', name: 'Dîner post-training', totalCalories: 715, items: [
    { food: 'Poulet au citron + herbes de Provence', quantity: '180g', proteins: 49, carbs: 0, fats: 6, calories: 244 },
    { food: 'Boulgour', quantity: '100g cru', proteins: 12, carbs: 70, fats: 2, calories: 350 },
    { food: 'Ratatouille', quantity: '200g', proteins: 3, carbs: 14, fats: 2, calories: 86 },
  ]},
  { time: '19h30', name: 'Dîner post-training', totalCalories: 718, items: [
    { food: 'Maquereau grillé', quantity: '150g', proteins: 27, carbs: 0, fats: 18, calories: 270 },
    { food: 'Riz complet', quantity: '100g cru', proteins: 8, carbs: 74, fats: 2, calories: 352 },
    { food: 'Épinards + ail + citron', quantity: '200g', proteins: 5, carbs: 6, fats: 1, calories: 57 },
  ]},
];

// ============================================================
// AVANT DE DORMIR — 12 variantes
// ============================================================
const BEFORE_SLEEP: Meal[] = [
  { time: '22h00', name: 'Avant de dormir', totalCalories: 172, items: [
    { food: 'Fromage blanc 0%', quantity: '250g', proteins: 20, carbs: 10, fats: 0, calories: 120 },
    { food: 'Fruits rouges', quantity: '100g', proteins: 1, carbs: 12, fats: 0, calories: 52 },
  ]},
  { time: '22h00', name: 'Avant de dormir', totalCalories: 180, items: [
    { food: 'Skyr nature', quantity: '200g', proteins: 22, carbs: 8, fats: 0, calories: 120 },
    { food: 'Myrtilles', quantity: '80g', proteins: 1, carbs: 11, fats: 0, calories: 46 },
  ]},
  { time: '22h00', name: 'Avant de dormir', totalCalories: 175, items: [
    { food: 'Fromage blanc 0% + cacao non sucré', quantity: '250g + 5g', proteins: 21, carbs: 12, fats: 1, calories: 141 },
    { food: 'Noix', quantity: '15g', proteins: 2, carbs: 2, fats: 10, calories: 98 },
  ]},
  { time: '22h00', name: 'Avant de dormir', totalCalories: 170, items: [
    { food: 'Yaourt grec 0%', quantity: '200g', proteins: 20, carbs: 8, fats: 0, calories: 112 },
    { food: 'Fraises', quantity: '100g', proteins: 1, carbs: 8, fats: 0, calories: 32 },
  ]},
  { time: '22h00', name: 'Avant de dormir', totalCalories: 178, items: [
    { food: 'Fromage blanc 0%', quantity: '250g', proteins: 20, carbs: 10, fats: 0, calories: 120 },
    { food: 'Kiwi', quantity: '1 (75g)', proteins: 1, carbs: 9, fats: 0, calories: 45 },
  ]},
  { time: '22h00', name: 'Avant de dormir', totalCalories: 182, items: [
    { food: 'Skyr vanille', quantity: '200g', proteins: 22, carbs: 12, fats: 0, calories: 136 },
    { food: 'Amandes', quantity: '15g', proteins: 3, carbs: 3, fats: 8, calories: 87 },
  ]},
  { time: '22h00', name: 'Avant de dormir', totalCalories: 168, items: [
    { food: 'Fromage blanc 0% + miel', quantity: '250g + 10g', proteins: 20, carbs: 18, fats: 0, calories: 152 },
  ]},
  { time: '22h00', name: 'Avant de dormir', totalCalories: 175, items: [
    { food: 'Yaourt grec 0% + graines de chia', quantity: '200g + 10g', proteins: 21, carbs: 10, fats: 3, calories: 151 },
  ]},
  { time: '22h00', name: 'Avant de dormir', totalCalories: 180, items: [
    { food: 'Fromage blanc 0%', quantity: '200g', proteins: 16, carbs: 8, fats: 0, calories: 96 },
    { food: 'Framboises', quantity: '100g', proteins: 1, carbs: 12, fats: 0, calories: 52 },
  ]},
  { time: '22h00', name: 'Avant de dormir', totalCalories: 172, items: [
    { food: 'Skyr nature + cannelle', quantity: '200g + 1g', proteins: 22, carbs: 8, fats: 0, calories: 121 },
    { food: 'Noix de cajou', quantity: '15g', proteins: 2, carbs: 5, fats: 7, calories: 87 },
  ]},
  { time: '22h00', name: 'Avant de dormir', totalCalories: 176, items: [
    { food: 'Fromage blanc 0% + compote sans sucre', quantity: '200g + 100g', proteins: 16, carbs: 20, fats: 0, calories: 144 },
  ]},
  { time: '22h00', name: 'Avant de dormir', totalCalories: 174, items: [
    { food: 'Yaourt grec 0% + fruits rouges + chia', quantity: '200g + 80g + 8g', proteins: 21, carbs: 14, fats: 2, calories: 162 },
  ]},
];

// ============================================================
// PETITS-DÉJEUNERS REPOS — 12 variantes
// ============================================================
const BREAKFASTS_REST: Meal[] = [
  { time: '07h00', name: 'Petit-déjeuner', totalCalories: 646, items: [
    { food: 'Flocons d\'avoine', quantity: '80g', proteins: 10, carbs: 48, fats: 6, calories: 311 },
    { food: 'Œufs entiers brouillés', quantity: '3 (180g)', proteins: 23, carbs: 2, fats: 18, calories: 257 },
    { food: 'Fruits rouges', quantity: '150g', proteins: 2, carbs: 18, fats: 0, calories: 78 },
  ]},
  { time: '07h00', name: 'Petit-déjeuner', totalCalories: 640, items: [
    { food: 'Omelette 3 œufs + fromage blanc', quantity: '3 œufs + 100g', proteins: 31, carbs: 4, fats: 18, calories: 302 },
    { food: 'Pain complet', quantity: '2 tranches (60g)', proteins: 6, carbs: 32, fats: 2, calories: 168 },
    { food: 'Kiwi', quantity: '2 (150g)', proteins: 2, carbs: 18, fats: 0, calories: 90 },
  ]},
  { time: '07h00', name: 'Petit-déjeuner', totalCalories: 652, items: [
    { food: 'Skyr + flocons d\'avoine + miel', quantity: '200g + 60g + 10g', proteins: 24, carbs: 56, fats: 4, calories: 360 },
    { food: 'Œufs durs', quantity: '2 (120g)', proteins: 16, carbs: 1, fats: 12, calories: 172 },
    { food: 'Pomme', quantity: '1 (150g)', proteins: 0, carbs: 22, fats: 0, calories: 78 },
  ]},
  { time: '07h00', name: 'Petit-déjeuner', totalCalories: 638, items: [
    { food: 'Porridge avoine + lait écrémé + banane', quantity: '80g + 250ml + 1 banane', proteins: 19, carbs: 72, fats: 7, calories: 435 },
    { food: 'Amandes', quantity: '25g', proteins: 5, carbs: 6, fats: 12, calories: 145 },
  ]},
  { time: '07h00', name: 'Petit-déjeuner', totalCalories: 648, items: [
    { food: 'Œufs à la coque', quantity: '3 (180g)', proteins: 23, carbs: 2, fats: 18, calories: 257 },
    { food: 'Toast complet + avocat', quantity: '2 tranches + 75g', proteins: 7, carbs: 34, fats: 12, calories: 272 },
    { food: 'Pamplemousse', quantity: '1/2 (150g)', proteins: 1, carbs: 14, fats: 0, calories: 60 },
  ]},
  { time: '07h00', name: 'Petit-déjeuner', totalCalories: 642, items: [
    { food: 'Pancakes avoine + œuf', quantity: '3 pancakes', proteins: 22, carbs: 52, fats: 12, calories: 408 },
    { food: 'Yaourt grec 0%', quantity: '150g', proteins: 15, carbs: 6, fats: 0, calories: 84 },
    { food: 'Fraises', quantity: '100g', proteins: 1, carbs: 8, fats: 0, calories: 32 },
  ]},
  { time: '07h00', name: 'Petit-déjeuner', totalCalories: 650, items: [
    { food: 'Muesli + lait écrémé', quantity: '80g + 250ml', proteins: 15, carbs: 60, fats: 8, calories: 376 },
    { food: 'Œufs pochés', quantity: '2 (120g)', proteins: 15, carbs: 1, fats: 12, calories: 172 },
  ]},
  { time: '07h00', name: 'Petit-déjeuner', totalCalories: 644, items: [
    { food: 'Overnight oats + chia + lait', quantity: '80g + 15g + 200ml', proteins: 17, carbs: 60, fats: 10, calories: 402 },
    { food: 'Fromage blanc 0%', quantity: '150g', proteins: 12, carbs: 6, fats: 0, calories: 72 },
    { food: 'Myrtilles', quantity: '80g', proteins: 1, carbs: 11, fats: 0, calories: 46 },
  ]},
  { time: '07h00', name: 'Petit-déjeuner', totalCalories: 648, items: [
    { food: 'Flocons d\'avoine + beurre de cacahuète', quantity: '80g + 20g', proteins: 15, carbs: 51, fats: 13, calories: 381 },
    { food: 'Skyr nature', quantity: '150g', proteins: 17, carbs: 6, fats: 0, calories: 90 },
    { food: 'Banane', quantity: '1 (120g)', proteins: 1, carbs: 28, fats: 0, calories: 107 },
  ]},
  { time: '07h00', name: 'Petit-déjeuner', totalCalories: 640, items: [
    { food: 'Galettes de riz + beurre de cajou + miel', quantity: '4 galettes + 25g + 10g', proteins: 6, carbs: 44, fats: 12, calories: 308 },
    { food: 'Œufs brouillés', quantity: '3 (180g)', proteins: 23, carbs: 2, fats: 18, calories: 257 },
  ]},
  { time: '07h00', name: 'Petit-déjeuner', totalCalories: 646, items: [
    { food: 'Porridge avoine + noix + miel', quantity: '80g + 20g + 10g', proteins: 13, carbs: 58, fats: 14, calories: 410 },
    { food: 'Yaourt grec 0%', quantity: '150g', proteins: 15, carbs: 6, fats: 0, calories: 84 },
  ]},
  { time: '07h00', name: 'Petit-déjeuner', totalCalories: 652, items: [
    { food: 'Riz au lait maison', quantity: '200g', proteins: 10, carbs: 58, fats: 2, calories: 292 },
    { food: 'Œufs à la coque', quantity: '3 (180g)', proteins: 23, carbs: 2, fats: 18, calories: 257 },
  ]},
];

// ============================================================
// DÉJEUNERS REPOS — 12 variantes
// ============================================================
const LUNCHES_REST: Meal[] = [
  { time: '12h30', name: 'Déjeuner', totalCalories: 650, items: [
    { food: 'Blanc de dinde', quantity: '150g', proteins: 41, carbs: 0, fats: 3, calories: 188 },
    { food: 'Quinoa', quantity: '80g cru', proteins: 11, carbs: 55, fats: 4, calories: 296 },
    { food: 'Épinards + avocat', quantity: '150g + 75g', proteins: 6, carbs: 10, fats: 11, calories: 155 },
  ]},
  { time: '12h30', name: 'Déjeuner', totalCalories: 640, items: [
    { food: 'Saumon fumé', quantity: '100g', proteins: 20, carbs: 0, fats: 13, calories: 197 },
    { food: 'Riz complet', quantity: '80g cru', proteins: 6, carbs: 59, fats: 2, calories: 281 },
    { food: 'Salade verte + tomates + concombre', quantity: '200g', proteins: 3, carbs: 8, fats: 0, calories: 44 },
    { food: 'Huile d\'olive', quantity: '10g', proteins: 0, carbs: 0, fats: 10, calories: 88 },
  ]},
  { time: '12h30', name: 'Déjeuner', totalCalories: 648, items: [
    { food: 'Poulet rôti froid', quantity: '150g', proteins: 41, carbs: 0, fats: 5, calories: 203 },
    { food: 'Patate douce + haricots rouges', quantity: '150g + 80g cuit', proteins: 9, carbs: 52, fats: 1, calories: 253 },
    { food: 'Courgettes grillées', quantity: '150g', proteins: 2, carbs: 5, fats: 0, calories: 27 },
    { food: 'Huile d\'olive', quantity: '10g', proteins: 0, carbs: 0, fats: 10, calories: 88 },
  ]},
  { time: '12h30', name: 'Déjeuner', totalCalories: 645, items: [
    { food: 'Thon au naturel', quantity: '160g égoutté', proteins: 36, carbs: 0, fats: 2, calories: 160 },
    { food: 'Boulgour', quantity: '80g cru', proteins: 10, carbs: 56, fats: 2, calories: 280 },
    { food: 'Tomates + poivrons + basilic', quantity: '200g', proteins: 2, carbs: 10, fats: 0, calories: 48 },
    { food: 'Huile d\'olive', quantity: '10g', proteins: 0, carbs: 0, fats: 10, calories: 88 },
  ]},
  { time: '12h30', name: 'Déjeuner', totalCalories: 652, items: [
    { food: 'Cabillaud vapeur', quantity: '200g', proteins: 46, carbs: 0, fats: 2, calories: 164 },
    { food: 'Lentilles vertes', quantity: '80g cru', proteins: 14, carbs: 44, fats: 1, calories: 241 },
    { food: 'Épinards + ail', quantity: '200g', proteins: 5, carbs: 6, fats: 1, calories: 57 },
    { food: 'Huile d\'olive', quantity: '10g', proteins: 0, carbs: 0, fats: 10, calories: 88 },
  ]},
  { time: '12h30', name: 'Déjeuner', totalCalories: 644, items: [
    { food: 'Escalope de dinde + champignons', quantity: '150g + 100g', proteins: 43, carbs: 3, fats: 3, calories: 211 },
    { food: 'Quinoa + pois chiches', quantity: '60g + 80g cuit', proteins: 14, carbs: 52, fats: 4, calories: 300 },
    { food: 'Roquette + tomates cerises', quantity: '100g', proteins: 2, carbs: 5, fats: 0, calories: 28 },
  ]},
  { time: '12h30', name: 'Déjeuner', totalCalories: 648, items: [
    { food: 'Filet de maquereau', quantity: '150g', proteins: 27, carbs: 0, fats: 18, calories: 270 },
    { food: 'Riz basmati complet', quantity: '80g cru', proteins: 6, carbs: 61, fats: 2, calories: 281 },
    { food: 'Brocolis + carottes', quantity: '200g', proteins: 5, carbs: 14, fats: 0, calories: 76 },
  ]},
  { time: '12h30', name: 'Déjeuner', totalCalories: 642, items: [
    { food: 'Blanc de poulet + sauce yaourt + concombre', quantity: '150g + 100g sauce', proteins: 44, carbs: 5, fats: 5, calories: 241 },
    { food: 'Patate douce', quantity: '250g', proteins: 4, carbs: 50, fats: 0, calories: 215 },
    { food: 'Salade de chou + citron', quantity: '150g', proteins: 2, carbs: 8, fats: 0, calories: 40 },
  ]},
  { time: '12h30', name: 'Déjeuner', totalCalories: 650, items: [
    { food: 'Crevettes + sauce tomate épicée', quantity: '200g + 80g', proteins: 40, carbs: 8, fats: 3, calories: 222 },
    { food: 'Riz complet', quantity: '80g cru', proteins: 6, carbs: 59, fats: 2, calories: 281 },
    { food: 'Poivrons grillés', quantity: '150g', proteins: 2, carbs: 9, fats: 0, calories: 44 },
  ]},
  { time: '12h30', name: 'Déjeuner', totalCalories: 645, items: [
    { food: 'Steak de bœuf 5% MG', quantity: '150g', proteins: 36, carbs: 0, fats: 8, calories: 212 },
    { food: 'Lentilles corail', quantity: '80g cru', proteins: 16, carbs: 48, fats: 1, calories: 265 },
    { food: 'Épinards + tomates', quantity: '200g', proteins: 5, carbs: 8, fats: 0, calories: 52 },
  ]},
  { time: '12h30', name: 'Déjeuner', totalCalories: 648, items: [
    { food: 'Dinde hachée + sauce bolognaise légère', quantity: '150g + 100g', proteins: 43, carbs: 8, fats: 4, calories: 240 },
    { food: 'Pâtes complètes', quantity: '80g cru', proteins: 10, carbs: 54, fats: 2, calories: 274 },
    { food: 'Salade verte', quantity: '100g + 10g huile', proteins: 1, carbs: 3, fats: 10, calories: 105 },
  ]},
  { time: '12h30', name: 'Déjeuner', totalCalories: 642, items: [
    { food: 'Poulet au citron + herbes', quantity: '150g', proteins: 41, carbs: 0, fats: 5, calories: 203 },
    { food: 'Quinoa + légumes rôtis', quantity: '80g cru + 150g', proteins: 13, carbs: 58, fats: 4, calories: 324 },
  ]},
];

// ============================================================
// COLLATIONS REPOS — 12 variantes
// ============================================================
const SNACKS_REST: Meal[] = [
  { time: '15h30', name: 'Collation', totalCalories: 292, items: [
    { food: 'Fromage blanc 0%', quantity: '200g', proteins: 16, carbs: 8, fats: 0, calories: 96 },
    { food: 'Noix', quantity: '30g', proteins: 5, carbs: 4, fats: 19, calories: 196 },
  ]},
  { time: '15h30', name: 'Collation', totalCalories: 288, items: [
    { food: 'Skyr nature', quantity: '200g', proteins: 22, carbs: 8, fats: 0, calories: 120 },
    { food: 'Amandes', quantity: '25g', proteins: 5, carbs: 6, fats: 12, calories: 145 },
  ]},
  { time: '15h30', name: 'Collation', totalCalories: 295, items: [
    { food: 'Yaourt grec 0%', quantity: '200g', proteins: 20, carbs: 8, fats: 0, calories: 112 },
    { food: 'Noix de cajou', quantity: '30g', proteins: 5, carbs: 9, fats: 13, calories: 174 },
  ]},
  { time: '15h30', name: 'Collation', totalCalories: 285, items: [
    { food: 'Fromage blanc 0% + fruits rouges', quantity: '200g + 100g', proteins: 17, carbs: 20, fats: 0, calories: 148 },
    { food: 'Amandes', quantity: '20g', proteins: 4, carbs: 5, fats: 10, calories: 116 },
  ]},
  { time: '15h30', name: 'Collation', totalCalories: 290, items: [
    { food: 'Skyr + myrtilles + chia', quantity: '200g + 80g + 10g', proteins: 23, carbs: 18, fats: 2, calories: 182 },
    { food: 'Noix', quantity: '15g', proteins: 2, carbs: 2, fats: 10, calories: 98 },
  ]},
  { time: '15h30', name: 'Collation', totalCalories: 294, items: [
    { food: 'Fromage blanc 0% + cacao + miel', quantity: '200g + 5g + 10g', proteins: 17, carbs: 20, fats: 1, calories: 157 },
    { food: 'Noix de cajou', quantity: '25g', proteins: 4, carbs: 8, fats: 11, calories: 145 },
  ]},
  { time: '15h30', name: 'Collation', totalCalories: 288, items: [
    { food: 'Yaourt grec 0% + kiwi', quantity: '200g + 2 kiwis', proteins: 22, carbs: 26, fats: 0, calories: 192 },
    { food: 'Amandes', quantity: '15g', proteins: 3, carbs: 3, fats: 8, calories: 87 },
  ]},
  { time: '15h30', name: 'Collation', totalCalories: 292, items: [
    { food: 'Skyr + pomme râpée + cannelle', quantity: '200g + 1 pomme', proteins: 22, carbs: 30, fats: 0, calories: 208 },
  ]},
  { time: '15h30', name: 'Collation', totalCalories: 286, items: [
    { food: 'Fromage blanc 0%', quantity: '200g', proteins: 16, carbs: 8, fats: 0, calories: 96 },
    { food: 'Noix + raisins secs', quantity: '20g + 20g', proteins: 3, carbs: 16, fats: 13, calories: 189 },
  ]},
  { time: '15h30', name: 'Collation', totalCalories: 290, items: [
    { food: 'Yaourt grec 0% + framboises', quantity: '200g + 100g', proteins: 21, carbs: 20, fats: 0, calories: 164 },
    { food: 'Amandes effilées', quantity: '20g', proteins: 4, carbs: 5, fats: 10, calories: 116 },
  ]},
  { time: '15h30', name: 'Collation', totalCalories: 288, items: [
    { food: 'Skyr nature + miel + noix', quantity: '200g + 10g + 20g', proteins: 23, carbs: 16, fats: 13, calories: 265 },
  ]},
  { time: '15h30', name: 'Collation', totalCalories: 294, items: [
    { food: 'Fromage blanc 0% + compote pomme-poire', quantity: '200g + 100g', proteins: 16, carbs: 24, fats: 0, calories: 160 },
    { food: 'Noix de cajou', quantity: '20g', proteins: 3, carbs: 6, fats: 9, calories: 116 },
  ]},
];

// ============================================================
// DÎNERS REPOS — 12 variantes
// ============================================================
const DINNERS_REST: Meal[] = [
  { time: '19h30', name: 'Dîner', totalCalories: 492, items: [
    { food: 'Cabillaud', quantity: '200g', proteins: 46, carbs: 0, fats: 2, calories: 164 },
    { food: 'Patate douce', quantity: '200g', proteins: 3, carbs: 40, fats: 0, calories: 172 },
    { food: 'Brocolis', quantity: '200g', proteins: 6, carbs: 14, fats: 0, calories: 68 },
    { food: 'Huile d\'olive', quantity: '10g', proteins: 0, carbs: 0, fats: 10, calories: 88 },
  ]},
  { time: '19h30', name: 'Dîner', totalCalories: 488, items: [
    { food: 'Saumon vapeur', quantity: '150g', proteins: 30, carbs: 0, fats: 20, calories: 312 },
    { food: 'Lentilles vertes', quantity: '80g cru', proteins: 14, carbs: 44, fats: 1, calories: 241 },
    { food: 'Épinards', quantity: '150g', proteins: 4, carbs: 5, fats: 1, calories: 46 },
  ]},
  { time: '19h30', name: 'Dîner', totalCalories: 495, items: [
    { food: 'Blanc de poulet', quantity: '180g', proteins: 49, carbs: 0, fats: 6, calories: 244 },
    { food: 'Haricots blancs + tomates', quantity: '100g cuit + 100g', proteins: 8, carbs: 22, fats: 0, calories: 120 },
    { food: 'Courgettes grillées', quantity: '200g', proteins: 3, carbs: 8, fats: 0, calories: 44 },
    { food: 'Huile d\'olive', quantity: '10g', proteins: 0, carbs: 0, fats: 10, calories: 88 },
  ]},
  { time: '19h30', name: 'Dîner', totalCalories: 490, items: [
    { food: 'Maquereau grillé', quantity: '150g', proteins: 27, carbs: 0, fats: 18, calories: 270 },
    { food: 'Patate douce + carottes', quantity: '200g + 100g', proteins: 5, carbs: 46, fats: 0, calories: 200 },
    { food: 'Salade verte', quantity: '100g', proteins: 1, carbs: 3, fats: 0, calories: 15 },
  ]},
  { time: '19h30', name: 'Dîner', totalCalories: 494, items: [
    { food: 'Dinde hachée + champignons', quantity: '180g + 100g', proteins: 51, carbs: 3, fats: 4, calories: 252 },
    { food: 'Quinoa', quantity: '60g cru', proteins: 8, carbs: 41, fats: 3, calories: 222 },
    { food: 'Brocolis vapeur', quantity: '200g', proteins: 6, carbs: 14, fats: 0, calories: 68 },
  ]},
  { time: '19h30', name: 'Dîner', totalCalories: 488, items: [
    { food: 'Filet de bar au four', quantity: '200g', proteins: 44, carbs: 0, fats: 4, calories: 212 },
    { food: 'Patate douce + lentilles corail', quantity: '150g + 50g cru', proteins: 10, carbs: 50, fats: 1, calories: 249 },
    { food: 'Haricots verts', quantity: '150g', proteins: 3, carbs: 6, fats: 0, calories: 36 },
  ]},
  { time: '19h30', name: 'Dîner', totalCalories: 492, items: [
    { food: 'Steak haché 5% MG', quantity: '150g', proteins: 36, carbs: 0, fats: 8, calories: 212 },
    { food: 'Pois chiches rôtis', quantity: '100g cuit', proteins: 9, carbs: 27, fats: 3, calories: 164 },
    { food: 'Épinards + ail', quantity: '200g', proteins: 5, carbs: 6, fats: 1, calories: 57 },
  ]},
  { time: '19h30', name: 'Dîner', totalCalories: 490, items: [
    { food: 'Crevettes sautées', quantity: '200g', proteins: 38, carbs: 2, fats: 3, calories: 190 },
    { food: 'Riz complet', quantity: '70g cru', proteins: 5, carbs: 52, fats: 1, calories: 246 },
    { food: 'Poivrons + courgettes', quantity: '200g', proteins: 3, carbs: 12, fats: 0, calories: 60 },
  ]},
  { time: '19h30', name: 'Dîner', totalCalories: 495, items: [
    { food: 'Poulet au citron + thym', quantity: '180g', proteins: 49, carbs: 0, fats: 6, calories: 244 },
    { food: 'Patate douce + brocolis', quantity: '200g + 150g', proteins: 7, carbs: 44, fats: 0, calories: 192 },
    { food: 'Huile d\'olive', quantity: '10g', proteins: 0, carbs: 0, fats: 10, calories: 88 },
  ]},
  { time: '19h30', name: 'Dîner', totalCalories: 488, items: [
    { food: 'Cabillaud + sauce vierge', quantity: '200g + 50g', proteins: 47, carbs: 4, fats: 3, calories: 231 },
    { food: 'Lentilles beluga', quantity: '80g cru', proteins: 14, carbs: 44, fats: 1, calories: 241 },
    { food: 'Salade de roquette', quantity: '100g', proteins: 2, carbs: 3, fats: 0, calories: 25 },
  ]},
  { time: '19h30', name: 'Dîner', totalCalories: 492, items: [
    { food: 'Saumon en papillote + légumes', quantity: '150g + 200g', proteins: 33, carbs: 14, fats: 20, calories: 368 },
    { food: 'Patate douce', quantity: '150g', proteins: 2, carbs: 30, fats: 0, calories: 129 },
  ]},
  { time: '19h30', name: 'Dîner', totalCalories: 490, items: [
    { food: 'Blanc de dinde + sauce champignons', quantity: '180g + 80g', proteins: 51, carbs: 4, fats: 4, calories: 256 },
    { food: 'Haricots blancs', quantity: '100g cuit', proteins: 8, carbs: 22, fats: 0, calories: 120 },
    { food: 'Brocolis vapeur', quantity: '150g', proteins: 5, carbs: 10, fats: 0, calories: 51 },
  ]},
];

// ============================================================
// AVANT DE DORMIR REPOS — mêmes que training (casein = casein)
// ============================================================
const BEFORE_SLEEP_REST = BEFORE_SLEEP;

// ============================================================
// GÉNÉRATION DU PLAN HEBDOMADAIRE
// Utilise le numéro de semaine pour sélectionner les variantes
// ============================================================

function getWeekIndex(weekStartMonday: Date): number {
  // Calcule un index 0-11 basé sur la date (stable et reproductible)
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const epoch = new Date('2026-01-05'); // Premier lundi de référence
  const diff = weekStartMonday.getTime() - epoch.getTime();
  const weeksSinceEpoch = Math.floor(diff / msPerWeek);
  return ((weeksSinceEpoch % 12) + 12) % 12; // toujours 0-11
}

function computeMealMacros(meal: Meal): DayMacros {
  return meal.items.reduce(
    (acc, item) => ({
      proteins: acc.proteins + item.proteins,
      carbs: acc.carbs + item.carbs,
      fats: acc.fats + item.fats,
      calories: acc.calories + item.calories,
    }),
    { proteins: 0, carbs: 0, fats: 0, calories: 0 }
  );
}

export function generateWeeklyMealPlan(weekStartMonday: Date): WeeklyMealPlan {
  const weekIdx = getWeekIndex(weekStartMonday);
  const days = [];
  let weeklyTotals: DayMacros = { proteins: 0, carbs: 0, fats: 0, calories: 0 };

  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStartMonday);
    date.setDate(weekStartMonday.getDate() + i);
    const dayOfWeek = date.getDay();
    const sessionName = SESSION_BY_DAY[dayOfWeek];
    const isTrainingDay = sessionName !== null;

    // Chaque jour de la semaine utilise un décalage différent pour varier les repas au sein de la semaine
    const dayShift = (weekIdx + i) % 12;

    let meals: Meal[];
    if (isTrainingDay) {
      meals = [
        BREAKFASTS_TRAINING[dayShift],
        LUNCHES_TRAINING[dayShift],
        SNACKS_TRAINING[dayShift],
        DINNERS_TRAINING[dayShift],
        BEFORE_SLEEP[dayShift],
      ];
    } else {
      meals = [
        BREAKFASTS_REST[dayShift],
        LUNCHES_REST[dayShift],
        SNACKS_REST[dayShift],
        DINNERS_REST[dayShift],
        BEFORE_SLEEP_REST[dayShift],
      ];
    }

    const totalMacros = meals.reduce(
      (acc, meal) => {
        const m = computeMealMacros(meal);
        return {
          proteins: acc.proteins + m.proteins,
          carbs: acc.carbs + m.carbs,
          fats: acc.fats + m.fats,
          calories: acc.calories + m.calories,
        };
      },
      { proteins: 0, carbs: 0, fats: 0, calories: 0 }
    );

    weeklyTotals = {
      proteins: weeklyTotals.proteins + totalMacros.proteins,
      carbs: weeklyTotals.carbs + totalMacros.carbs,
      fats: weeklyTotals.fats + totalMacros.fats,
      calories: weeklyTotals.calories + totalMacros.calories,
    };

    days.push({
      date: date.toISOString().split('T')[0],
      dayName: DAY_NAMES_FR[dayOfWeek],
      isTrainingDay,
      sessionName: sessionName ?? undefined,
      meals,
      totalMacros,
    });
  }

  return {
    weekStartDate: weekStartMonday.toISOString().split('T')[0],
    days,
    weeklyTotals,
  };
}

// ============================================================
// LISTE DE COURSES — générée dynamiquement depuis le plan
// ============================================================

export interface ShoppingItem {
  category: string;
  name: string;
  quantity: string;
  unit: string;
  estimatedPrice: string;
  notes: string;
  priority: 'essential' | 'recommended' | 'optional';
}

export interface ShoppingList {
  weekStartDate: string;
  generatedOn: string;
  items: ShoppingItem[];
  totalEstimatedBudget: string;
  storeTips: string[];
}

// Agrège les ingrédients du plan et génère la liste de courses
export function generateShoppingList(weekPlan: WeeklyMealPlan): ShoppingList {
  // Comptage des occurrences d'ingrédients sur la semaine
  const ingredientCount: Record<string, { count: number; category: string }> = {};

  weekPlan.days.forEach(day => {
    day.meals.forEach(meal => {
      meal.items.forEach(item => {
        const key = item.food.split(' (')[0].split(' +')[0].split(' +')[0].trim();
        if (!ingredientCount[key]) {
          ingredientCount[key] = { count: 0, category: classifyIngredient(key) };
        }
        ingredientCount[key].count++;
      });
    });
  });

  // Construire la liste de courses avec quantités calculées
  const items: ShoppingItem[] = buildShoppingItems(weekPlan, ingredientCount);

  const storeTips = [
    '🛒 Commande le samedi pour récupération le lundi — les produits frais seront parfaits pour toute la semaine.',
    '❄️ Achète viandes et poissons en grande quantité, congèle en portions individuelles de 150-180g.',
    '🍳 Prépare riz, patates douces et légumineuses en batch le dimanche soir (gain de temps majeur).',
    '💰 Surgelés (poissons, légumes, fruits rouges) = aussi nutritifs que le frais, moins chers.',
    '📦 Whey et compléments : commande en ligne (Myprotein, Bulk) — 2× moins cher qu\'en magasin.',
    '🥚 Œufs plein air ou bio : meilleur profil oméga-3. Achète en boîte de 18 ou 24.',
  ];

  return {
    weekStartDate: weekPlan.weekStartDate,
    generatedOn: new Date().toISOString().split('T')[0],
    items,
    totalEstimatedBudget: '~60-80€/semaine',
    storeTips,
  };
}

function classifyIngredient(name: string): string {
  const lower = name.toLowerCase();
  if (/poulet|dinde|bœuf|veau|steak|viande|blanc de/.test(lower)) return 'Viandes';
  if (/saumon|cabillaud|thon|maquereau|bar|crevettes|poisson|filet de/.test(lower)) return 'Poissons & Fruits de mer';
  if (/œuf|fromage blanc|skyr|yaourt|lait|whey/.test(lower)) return 'Produits laitiers & Œufs';
  if (/riz|patate|pâtes|quinoa|avoine|flocons|boulgour|lentilles|haricots|pois|pain|galette/.test(lower)) return 'Féculents & Légumineuses';
  if (/brocoli|épinard|courgette|poivron|tomate|haricot vert|carotte|salade|roquette|concombre|chou|champignon|edamame/.test(lower)) return 'Légumes';
  if (/banane|pomme|kiwi|fraise|myrtille|framboise|fruits rouges|mangue|pêche|orange|pamplemousse|datte|raisin/.test(lower)) return 'Fruits';
  if (/amande|noix|cajou|beurre de|avocat|huile/.test(lower)) return 'Lipides & Oléagineux';
  if (/miel|confiture|compote|sauce|soja|curry|herbes|épices|sel|poivre|cacao|cannelle|chia|sésame/.test(lower)) return 'Condiments & Divers';
  return 'Divers';
}

function buildShoppingItems(
  weekPlan: WeeklyMealPlan,
  ingredientCount: Record<string, { count: number; category: string }>
): ShoppingItem[] {
  // Quantités agrégées par ingrédient clé
  const quantities: Record<string, { totalG: number; category: string; notes: string }> = {};

  weekPlan.days.forEach(day => {
    day.meals.forEach(meal => {
      meal.items.forEach(item => {
        const key = item.food.split(' (')[0].trim();
        // Extraire la quantité en grammes
        const qtyMatch = item.quantity.match(/(\d+(?:\.\d+)?)/);
        const qty = qtyMatch ? parseFloat(qtyMatch[1]) : 100;

        if (!quantities[key]) {
          quantities[key] = {
            totalG: 0,
            category: classifyIngredient(key),
            notes: '',
          };
        }
        quantities[key].totalG += qty;
      });
    });
  });

  // Convertir en liste de courses avec unités pratiques
  const items: ShoppingItem[] = [];
  const categoryOrder = ['Viandes', 'Poissons & Fruits de mer', 'Produits laitiers & Œufs', 'Féculents & Légumineuses', 'Légumes', 'Fruits', 'Lipides & Oléagineux', 'Condiments & Divers'];

  // Regroupements intelligents
  const groups: Record<string, { names: string[]; totalG: number; category: string }> = {};

  Object.entries(quantities).forEach(([name, data]) => {
    const groupKey = getGroupKey(name);
    if (!groups[groupKey]) {
      groups[groupKey] = { names: [], totalG: 0, category: data.category };
    }
    groups[groupKey].names.push(name);
    groups[groupKey].totalG += data.totalG;
  });

  // Générer les items de courses
  Object.entries(groups).forEach(([groupKey, group]) => {
    const item = formatShoppingItem(groupKey, group.totalG, group.category, group.names);
    if (item) items.push(item);
  });

  // Ajouter les essentiels fixes
  items.push({
    category: 'Produits laitiers & Œufs',
    name: 'Whey Protein Isolate',
    quantity: '1 kg',
    unit: '(commande en ligne)',
    estimatedPrice: '~25-35€ (dure ~1 mois)',
    notes: 'Myprotein, Bulk ou Foodspring. Commande en ligne, pas en drive.',
    priority: 'recommended',
  });

  // Trier par catégorie
  items.sort((a, b) => {
    const ai = categoryOrder.indexOf(a.category);
    const bi = categoryOrder.indexOf(b.category);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  return items;
}

function getGroupKey(name: string): string {
  const lower = name.toLowerCase();
  if (/blanc de poulet|poulet/.test(lower)) return 'Poulet (blanc/filet)';
  if (/blanc de dinde|dinde/.test(lower)) return 'Dinde (blanc/filet)';
  if (/steak|bœuf|veau|escalope de veau/.test(lower)) return 'Bœuf / Veau';
  if (/saumon/.test(lower)) return 'Saumon';
  if (/cabillaud|bar|maquereau/.test(lower)) return 'Poisson blanc (cabillaud/bar/maquereau)';
  if (/thon/.test(lower)) return 'Thon au naturel (boîte)';
  if (/crevettes/.test(lower)) return 'Crevettes';
  if (/œuf/.test(lower)) return 'Œufs (bio ou plein air)';
  if (/fromage blanc/.test(lower)) return 'Fromage blanc 0%';
  if (/skyr/.test(lower)) return 'Skyr nature';
  if (/yaourt grec/.test(lower)) return 'Yaourt grec 0%';
  if (/lait/.test(lower)) return 'Lait écrémé';
  if (/flocons d'avoine|avoine/.test(lower)) return 'Flocons d\'avoine (gros)';
  if (/riz/.test(lower)) return 'Riz basmati / complet';
  if (/patate douce/.test(lower)) return 'Patates douces';
  if (/pâtes/.test(lower)) return 'Pâtes complètes / semi-complètes';
  if (/quinoa/.test(lower)) return 'Quinoa';
  if (/lentilles/.test(lower)) return 'Lentilles (vertes/corail)';
  if (/haricots blancs|haricots rouges|pois chiches/.test(lower)) return 'Légumineuses (boîte ou sec)';
  if (/boulgour/.test(lower)) return 'Boulgour';
  if (/pain complet|pain de riz|galette de riz/.test(lower)) return 'Pain complet / galettes de riz';
  if (/brocoli/.test(lower)) return 'Brocolis (frais ou surgelés)';
  if (/épinard/.test(lower)) return 'Épinards (frais ou surgelés)';
  if (/haricot vert/.test(lower)) return 'Haricots verts (surgelés)';
  if (/courgette/.test(lower)) return 'Courgettes';
  if (/poivron/.test(lower)) return 'Poivrons';
  if (/tomate/.test(lower)) return 'Tomates';
  if (/carotte/.test(lower)) return 'Carottes';
  if (/champignon/.test(lower)) return 'Champignons';
  if (/salade|roquette/.test(lower)) return 'Salade / Roquette';
  if (/concombre/.test(lower)) return 'Concombres';
  if (/banane/.test(lower)) return 'Bananes';
  if (/pomme/.test(lower)) return 'Pommes';
  if (/kiwi/.test(lower)) return 'Kiwis';
  if (/fruits rouges|fraise|myrtille|framboise/.test(lower)) return 'Fruits rouges (frais ou surgelés)';
  if (/mangue/.test(lower)) return 'Mangues';
  if (/orange|pamplemousse/.test(lower)) return 'Agrumes';
  if (/datte/.test(lower)) return 'Dattes';
  if (/avocat/.test(lower)) return 'Avocats';
  if (/amande/.test(lower)) return 'Amandes (nature)';
  if (/noix de cajou/.test(lower)) return 'Noix de cajou';
  if (/noix/.test(lower)) return 'Noix (cerneaux)';
  if (/beurre de cacahuète|beurre de cajou/.test(lower)) return 'Beurre de cacahuète / cajou (naturel)';
  if (/huile d'olive/.test(lower)) return 'Huile d\'olive extra vierge';
  if (/miel/.test(lower)) return 'Miel';
  if (/chia/.test(lower)) return 'Graines de chia';
  if (/sauce soja/.test(lower)) return 'Sauce soja (faible en sel)';
  return name;
}

function formatShoppingItem(
  groupKey: string,
  totalG: number,
  category: string,
  names: string[]
): ShoppingItem | null {
  // Ignorer les micro-ingrédients
  if (totalG < 20 && !['Condiments & Divers'].includes(category)) return null;

  const qty = Math.ceil(totalG / 50) * 50; // Arrondi à 50g supérieur
  let quantity = '';
  let unit = 'g';
  let estimatedPrice = '';
  let notes = '';
  let priority: 'essential' | 'recommended' | 'optional' = 'essential';

  // Formatage intelligent selon la catégorie
  if (totalG >= 1000) {
    quantity = `${(qty / 1000).toFixed(1)}`;
    unit = 'kg';
  } else if (totalG >= 100) {
    quantity = `${qty}`;
    unit = 'g';
  } else {
    quantity = `${Math.ceil(totalG)}`;
    unit = 'g';
  }

  // Prix et notes par type
  if (category === 'Viandes') {
    estimatedPrice = `~${Math.ceil(totalG / 100)}€`;
    notes = 'Achète en gros et congèle en portions de 150-180g.';
    priority = 'essential';
  } else if (category === 'Poissons & Fruits de mer') {
    estimatedPrice = `~${Math.ceil(totalG / 80)}€`;
    notes = 'Frais ou surgelé. Congèle en portions individuelles.';
    priority = 'essential';
  } else if (category === 'Produits laitiers & Œufs') {
    if (groupKey.includes('Œuf')) {
      quantity = `${Math.ceil(totalG / 60)}`;
      unit = 'pièces';
      estimatedPrice = '~4-6€';
      notes = 'Boîte de 18 ou 24. Plein air ou bio de préférence.';
    } else if (groupKey.includes('Fromage blanc')) {
      quantity = `${Math.ceil(totalG / 500)}`;
      unit = 'pots (500g)';
      estimatedPrice = '~2-3€/pot';
      notes = 'Marque distributeur OK. Pour avant de dormir tous les soirs.';
    } else if (groupKey.includes('Skyr')) {
      quantity = `${Math.ceil(totalG / 500)}`;
      unit = 'pots (500g)';
      estimatedPrice = '~2-3€/pot';
      notes = 'Riche en caséine. Idéal avant de dormir.';
    } else {
      estimatedPrice = '~2-4€';
      notes = 'Marque distributeur OK.';
    }
    priority = 'essential';
  } else if (category === 'Féculents & Légumineuses') {
    estimatedPrice = '~2-5€';
    notes = 'Prépare en batch le dimanche pour gagner du temps.';
    priority = 'essential';
  } else if (category === 'Légumes') {
    estimatedPrice = '~1-4€';
    notes = 'Surgelé OK et aussi nutritif que le frais.';
    priority = 'essential';
  } else if (category === 'Fruits') {
    estimatedPrice = '~2-4€';
    notes = 'Achète à différents stades de maturité.';
    priority = 'essential';
  } else if (category === 'Lipides & Oléagineux') {
    estimatedPrice = '~3-6€';
    notes = 'Non salés, non grillés. Achète en vrac si possible.';
    priority = 'recommended';
  } else {
    estimatedPrice = '~1-3€';
    notes = 'Pour varier les saveurs.';
    priority = 'optional';
  }

  return {
    category,
    name: groupKey,
    quantity,
    unit,
    estimatedPrice,
    notes,
    priority,
  };
}

// ============================================================
// RÉGULATION NUTRITIONNELLE HEBDOMADAIRE
// ============================================================

export interface WeeklyNutritionSummary {
  weekNumber: number;
  avgDailyCalories: number;
  avgDailyProteins: number;
  totalSurplusCalories: number;
  proteinAdequacyAvg: number;
  recommendation: string;
  nextWeekAdjustment: {
    calories: number;
    proteins: number;
    carbs: number;
    fats: number;
  };
}

export function computeWeeklyNutritionSummary(
  dayLogs: DayLog[],
  weekNumber: number
): WeeklyNutritionSummary {
  if (dayLogs.length === 0) {
    return {
      weekNumber,
      avgDailyCalories: 0,
      avgDailyProteins: 0,
      totalSurplusCalories: 0,
      proteinAdequacyAvg: 0,
      recommendation: 'Aucune donnée nutritionnelle cette semaine.',
      nextWeekAdjustment: MACRO_TARGETS.training,
    };
  }

  const balances = dayLogs.map(log => computeDayBalance(log));
  const avgCalories = Math.round(balances.reduce((acc, b) => acc + b.consumed.calories, 0) / balances.length);
  const avgProteins = Math.round(balances.reduce((acc, b) => acc + b.consumed.proteins, 0) / balances.length);
  const totalSurplus = balances.reduce((acc, b) => acc + b.surplus.calories, 0);
  const avgProteinAdequacy = Math.round(balances.reduce((acc, b) => acc + b.proteinAdequacy, 0) / balances.length);

  let recommendation = '';
  const adjustment = { ...MACRO_TARGETS.training };

  if (totalSurplus > 1500) {
    recommendation = `📊 Surplus hebdomadaire élevé (+${totalSurplus} kcal). Réduis les glucides de 30g/jour la semaine prochaine pour limiter la prise de gras.`;
    adjustment.carbs -= 30;
    adjustment.calories -= 120;
  } else if (totalSurplus < -1000) {
    recommendation = `📉 Déficit hebdomadaire important (${totalSurplus} kcal). Augmente les glucides de 30g/jour la semaine prochaine pour ne pas freiner la prise de muscle.`;
    adjustment.carbs += 30;
    adjustment.calories += 120;
  } else if (avgProteinAdequacy < 85) {
    recommendation = `⚠️ Protéines insuffisantes en moyenne (${avgProteins}g/j). Ajoute une source de protéines à chaque repas la semaine prochaine.`;
    adjustment.proteins += 20;
  } else {
    recommendation = `✅ Nutrition optimale cette semaine ! Bilan calorique : ${totalSurplus > 0 ? '+' : ''}${totalSurplus} kcal. Continue comme ça.`;
  }

  return {
    weekNumber,
    avgDailyCalories: avgCalories,
    avgDailyProteins: avgProteins,
    totalSurplusCalories: totalSurplus,
    proteinAdequacyAvg: avgProteinAdequacy,
    recommendation,
    nextWeekAdjustment: adjustment,
  };
}

// ============================================================
// RÉÉQUILIBRAGE AUTOMATIQUE DES REPAS
// Quand un repas est validé ou modifié, les repas suivants
// de la journée s'ajustent pour compenser l'écart calorique.
// ============================================================

export interface MealValidation {
  meal: 'breakfast' | 'lunch' | 'snack' | 'dinner' | 'before_sleep';
  validated: boolean; // true = mangé comme prévu, false = modifié
  actualEntries?: FoodEntry[]; // si modifié, les vrais aliments consommés
}

export interface DayMealStatus {
  date: string;
  mealValidations: Record<string, MealValidation>;
  // Repas restants ajustés automatiquement
  adjustedMeals: Record<string, { calorieBudget: number; proteinTarget: number; carbTarget: number; fatTarget: number; message: string }>;
}

const MEAL_ORDER_LIST = ['breakfast', 'lunch', 'snack', 'dinner', 'before_sleep'] as const;

/**
 * Calcule les ajustements des repas restants de la journée
 * en fonction de ce qui a déjà été consommé.
 */
export function computeMealAdjustments(
  consumedSoFar: DayMacros,
  completedMeals: string[],
  isTrainingDay: boolean,
  weeklyCarryover: number = 0 // surplus/déficit des jours précédents de la semaine
): Record<string, { calorieBudget: number; proteinTarget: number; carbTarget: number; fatTarget: number; message: string }> {
  const dailyTarget = isTrainingDay ? MACRO_TARGETS.training : MACRO_TARGETS.rest;

  // Ajustement si surplus/déficit hebdomadaire
  const adjustedDailyCalories = dailyTarget.calories - Math.round(weeklyCarryover / 6); // étale sur 6 jours restants
  const adjustedDailyProteins = dailyTarget.proteins;
  const adjustedDailyCarbs = dailyTarget.carbs - Math.round(weeklyCarryover / 6 / 4); // glucides = 4 kcal/g
  const adjustedDailyFats = dailyTarget.fats;

  const remainingMeals = MEAL_ORDER_LIST.filter(m => !completedMeals.includes(m));
  if (remainingMeals.length === 0) return {};

  // Calcul des macros restantes à consommer
  const remainingCalories = Math.max(0, adjustedDailyCalories - consumedSoFar.calories);
  const remainingProteins = Math.max(0, adjustedDailyProteins - consumedSoFar.proteins);
  const remainingCarbs = Math.max(0, adjustedDailyCarbs - consumedSoFar.carbs);
  const remainingFats = Math.max(0, adjustedDailyFats - consumedSoFar.fats);

  // Distribution des macros restantes selon le poids de chaque repas
  const MEAL_WEIGHTS: Record<string, number> = {
    breakfast: 0.25,
    lunch: 0.30,
    snack: 0.10,
    dinner: 0.25,
    before_sleep: 0.10,
  };

  const totalRemainingWeight = remainingMeals.reduce((acc, m) => acc + (MEAL_WEIGHTS[m] ?? 0.15), 0);

  const adjustments: Record<string, { calorieBudget: number; proteinTarget: number; carbTarget: number; fatTarget: number; message: string }> = {};

  remainingMeals.forEach(meal => {
    const weight = (MEAL_WEIGHTS[meal] ?? 0.15) / totalRemainingWeight;
    const calBudget = Math.round(remainingCalories * weight);
    const protTarget = Math.round(remainingProteins * weight);
    const carbTarget = Math.round(remainingCarbs * weight);
    const fatTarget = Math.round(remainingFats * weight);

    let message = '';
    const originalCalBudget = Math.round(adjustedDailyCalories * (MEAL_WEIGHTS[meal] ?? 0.15));
    const diff = calBudget - originalCalBudget;

    if (diff < -100) {
      message = `⬇️ Réduis de ~${Math.abs(diff)} kcal (surplus du matin)`;
    } else if (diff > 100) {
      message = `⬆️ Ajoute ~${diff} kcal (déficit à compenser)`;
    } else {
      message = `✅ Budget normal`;
    }

    adjustments[meal] = { calorieBudget: calBudget, proteinTarget: protTarget, carbTarget: carbTarget, fatTarget: fatTarget, message };
  });

  return adjustments;
}

/**
 * Calcule le surplus/déficit cumulé des jours précédents de la semaine courante.
 * Utilisé pour étaler la compensation sur les jours restants.
 */
export function computeWeeklyCarryover(
  dayLogs: DayLog[],
  currentDateKey: string
): number {
  const currentDate = new Date(currentDateKey + 'T12:00:00');
  const dayOfWeek = currentDate.getDay();
  const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const weekStart = new Date(currentDate);
  weekStart.setDate(currentDate.getDate() + daysToMonday);

  let totalSurplus = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    const key = d.toISOString().split('T')[0];
    if (key >= currentDateKey) break; // ne compte que les jours passés
    const log = dayLogs.find(l => l.date === key);
    if (log) {
      const balance = computeDayBalance(log);
      totalSurplus += balance.surplus.calories;
    }
  }
  return totalSurplus;
}

/**
 * Récapitulatif hebdomadaire détaillé : réalité vs objectif
 */
export interface WeeklyRecap {
  weekLabel: string;
  days: Array<{
    date: string;
    dayName: string;
    isTrainingDay: boolean;
    consumed: DayMacros;
    target: DayMacros;
    status: 'optimal' | 'surplus' | 'deficit' | 'protein_low' | 'no_data';
    surplusCalories: number;
  }>;
  totals: {
    consumed: DayMacros;
    target: DayMacros;
    surplusCalories: number;
    proteinAdequacy: number;
  };
  verdict: 'excellent' | 'good' | 'average' | 'poor';
  verdictMessage: string;
  nextWeekRecommendation: string;
}

export function computeWeeklyRecap(
  dayLogs: DayLog[],
  weekStartMonday: Date
): WeeklyRecap {
  const DAY_NAMES = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const days = [];
  let totalConsumed: DayMacros = { proteins: 0, carbs: 0, fats: 0, calories: 0 };
  let totalTarget: DayMacros = { proteins: 0, carbs: 0, fats: 0, calories: 0 };
  let daysWithData = 0;

  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStartMonday);
    date.setDate(weekStartMonday.getDate() + i);
    const dateKey = date.toISOString().split('T')[0];
    const dayOfWeek = date.getDay();
    const isTrainingDay = [1, 2, 4, 5].includes(dayOfWeek);
    const target = isTrainingDay ? MACRO_TARGETS.training : MACRO_TARGETS.rest;

    const log = dayLogs.find(l => l.date === dateKey);
    if (!log || log.entries.length === 0) {
      days.push({
        date: dateKey,
        dayName: DAY_NAMES[dayOfWeek],
        isTrainingDay,
        consumed: { proteins: 0, carbs: 0, fats: 0, calories: 0 },
        target,
        status: 'no_data' as const,
        surplusCalories: 0,
      });
      totalTarget = {
        proteins: totalTarget.proteins + target.proteins,
        carbs: totalTarget.carbs + target.carbs,
        fats: totalTarget.fats + target.fats,
        calories: totalTarget.calories + target.calories,
      };
      continue;
    }

    const balance = computeDayBalance(log);
    daysWithData++;
    days.push({
      date: dateKey,
      dayName: DAY_NAMES[dayOfWeek],
      isTrainingDay,
      consumed: balance.consumed,
      target: balance.target,
      status: balance.status,
      surplusCalories: balance.surplus.calories,
    });

    totalConsumed = {
      proteins: totalConsumed.proteins + balance.consumed.proteins,
      carbs: totalConsumed.carbs + balance.consumed.carbs,
      fats: totalConsumed.fats + balance.consumed.fats,
      calories: totalConsumed.calories + balance.consumed.calories,
    };
    totalTarget = {
      proteins: totalTarget.proteins + target.proteins,
      carbs: totalTarget.carbs + target.carbs,
      fats: totalTarget.fats + target.fats,
      calories: totalTarget.calories + target.calories,
    };
  }

  const totalSurplus = totalConsumed.calories - totalTarget.calories;
  const proteinAdequacy = totalTarget.proteins > 0
    ? Math.round((totalConsumed.proteins / totalTarget.proteins) * 100)
    : 0;

  // Verdict global
  let verdict: WeeklyRecap['verdict'] = 'excellent';
  let verdictMessage = '';
  let nextWeekRecommendation = '';

  if (daysWithData === 0) {
    verdict = 'poor';
    verdictMessage = 'Aucune donnée cette semaine.';
    nextWeekRecommendation = 'Commence à enregistrer tes repas pour voir ta progression.';
  } else if (proteinAdequacy < 80) {
    verdict = 'poor';
    verdictMessage = `Protéines insuffisantes — ${Math.round(totalConsumed.proteins / daysWithData)}g/j en moyenne (objectif : ${MACRO_TARGETS.training.proteins}g).`;
    nextWeekRecommendation = `Ajoute une source de protéines à chaque repas. Priorité : poulet, œufs, fromage blanc.`;
  } else if (Math.abs(totalSurplus) > 2000) {
    verdict = totalSurplus > 0 ? 'average' : 'average';
    verdictMessage = totalSurplus > 0
      ? `Surplus de ${totalSurplus} kcal sur la semaine — risque de prise de gras.`
      : `Déficit de ${Math.abs(totalSurplus)} kcal — risque de freiner la prise de muscle.`;
    nextWeekRecommendation = totalSurplus > 0
      ? `Réduis les glucides de 30-40g/jour la semaine prochaine.`
      : `Augmente les glucides de 30-40g/jour (riz, patate douce, avoine).`;
  } else if (proteinAdequacy >= 90 && Math.abs(totalSurplus) <= 1000) {
    verdict = 'excellent';
    verdictMessage = `Semaine parfaite ! ${Math.round(totalConsumed.proteins / daysWithData)}g de protéines/j, bilan calorique équilibré.`;
    nextWeekRecommendation = `Continue exactement comme ça. Légère augmentation possible si tu veux accélérer la prise de masse.`;
  } else {
    verdict = 'good';
    verdictMessage = `Bonne semaine. Quelques ajustements mineurs à faire.`;
    nextWeekRecommendation = `Maintiens les protéines et ajuste les glucides selon tes séances.`;
  }

  const weekLabel = weekStartMonday.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });

  return {
    weekLabel,
    days,
    totals: {
      consumed: totalConsumed,
      target: totalTarget,
      surplusCalories: totalSurplus,
      proteinAdequacy,
    },
    verdict,
    verdictMessage,
    nextWeekRecommendation,
  };
}
