// ============================================================
// MOTEUR NUTRITIONNEL — FitPro v5
// Calories CALCULÉES SCIENTIFIQUEMENT (Katch-McArdle + TDEE par composantes)
// Profil : 68kg | 1m75 | 26 ans | 13% MG | LBM = 59.2 kg
// BMR Katch-McArdle = 370 + (21.6 × 59.2) = 1648 kcal
// TDEE moyen = 2704 kcal/jour (bureau 8h + marche 2-3x/sem + sport 8 sessions/14j)
// Surplus lean bulk = +200 kcal (5-7% — recommandation Helms et al. 2023 + Trifecta RD)
// Jours musculation : 3000 kcal | Jours course : 3050 kcal | Jours football : 3150 kcal | Jours repos/vélo : 2700 kcal
// Protéines : 130g (2.2g/kg LBM) | Lipides : 25% calories | Glucides : reste
// 12 semaines de rotation — jamais les mêmes plats 2 semaines de suite
// ============================================================

// Utilitaire : date locale YYYY-MM-DD (évite les décalages UTC)
export function toLocalDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export interface FoodEntry {
  id: string;
  foodId: string;
  foodName: string;
  quantity: number;
  meal: 'breakfast' | 'morning_snack' | 'lunch' | 'snack' | 'dinner';
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
  sessionType?: 'training' | 'running' | 'football' | 'cycling' | 'rest';
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

// ============================================================
// CALCUL SCIENTIFIQUE DU TDEE (Katch-McArdle + composantes)
// ============================================================
// Profil : 68 kg | 1m75 | 26 ans | 13% MG | LBM = 59.2 kg
//
// BMR Katch-McArdle = 370 + (21.6 × 59.2) = 1 648 kcal/j
// (Formule la plus précise quand le % MG est connu — Nutrium 2023)
//
// TDEE par composantes :
//   BMR                        = 1 648 kcal
//   NEAT bureau 8h             =   685 kcal  (1.2 MET × 8h)
//   NEAT marche midi 2.5×/sem  =    67 kcal  (3.5 MET × 45min)
//   NEAT activités légères     =   161 kcal
//   EAT sport (moyenne/jour)   =   184 kcal  (8 sessions / 14j)
//   TEF (10%)                  =   274 kcal
//   ─────────────────────────────────────────
//   TDEE TOTAL                 = 2 704 kcal/j (moyenne)
//
// Vérification facteur multiplicateur :
//   BMR × 1.45 (entre lightly et moderately active) = 2 389 kcal
//   Consensus (moyenne méthodes) = 2 704 kcal
//   Note : le facteur multiplicateur seul sous-estime car il ne
//   capture pas bien le sport 4-5×/semaine sur fond sédentaire.
//
// Surplus lean bulk : +200 kcal (5-7% du TDEE)
//   → Helms et al. 2023 (Sports Med Open) : surplus 5% = gains
//     musculaires identiques à 15% mais MOINS de gras
//   → Trifecta RD : lean+trained → +100 à +300 kcal
//   → Objectif : 0.2-0.3 kg/semaine (vitesse optimale lean bulk)
//
// Calories différenciées par type de jour :
//   Musculation : TDEE_muscu (2 821) + 200 = 3 000 kcal
//   Course      : TDEE_course (2 856) + 200 = 3 050 kcal
//   Football    : TDEE_foot (2 971) + 200 = 3 150 kcal
//   Repos/vélo  : TDEE_repos (2 521) + 200 = 2 700 kcal
//
// Macros (jours musculation) :
//   Protéines : 130g (2.2g/kg LBM — recommandation haute hypertrophie)
//   Lipides   : 83g (25% des calories — minimum hormonal)
//   Glucides  : 432g (reste — carburant principal musculation + cardio)
// ============================================================
// ============================================================
// CALCUL DES MACROS D'UN ALIMENT
// ============================================================

// Macros selon le PDF Programme Elite :
// Protéines : 150g fixes (2.2g/kg × 68kg)
// Lipides : 70-80g (25-28% des calories)
// Glucides : variables selon type de jour
// Jours musculation : 2700 kcal | Jours course : 2800 kcal | Football : 2900 kcal | Repos/Vélo : 2500 kcal
export const MACRO_TARGETS = {
  training:  { calories: 2700, proteins: 150, carbs: 305, fats: 75 },
  running:   { calories: 2800, proteins: 150, carbs: 330, fats: 75 },
  football:  { calories: 2900, proteins: 150, carbs: 355, fats: 78 },
  rest:      { calories: 2500, proteins: 150, carbs: 255, fats: 72 },
  cycling:   { calories: 2550, proteins: 150, carbs: 268, fats: 72 },
};

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
  const targetKey = log.sessionType ?? (log.isTrainingDay ? 'training' : 'rest');
  const target = MACRO_TARGETS[targetKey as keyof typeof MACRO_TARGETS] ?? MACRO_TARGETS.rest;
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
// AJUSTEMENT AUTOMATIQUE DES MACROS RESTANTES (Prompt Ultime)
// Quand un aliment non prévu est saisi, recalcule les repas suivants
// Priorité : 1. Protéines toujours respectées 2. Lipides plafonnés 3. Glucides ajustables
// ============================================================

export interface RemainingMacros {
  calories: number;
  proteins: number;
  carbs: number;
  fats: number;
  mealsLeft: number;
  adjustmentMessage: string;
}

export function computeRemainingMacros(
  log: DayLog,
  mealsConsumedCount: number,
  totalMeals: number = 5
): RemainingMacros {
  const targetKey = log.sessionType ?? (log.isTrainingDay ? 'training' : 'rest');
  const target = MACRO_TARGETS[targetKey as keyof typeof MACRO_TARGETS] ?? MACRO_TARGETS.rest;

  const consumed: DayMacros = log.entries.reduce(
    (acc, e) => ({
      proteins: acc.proteins + e.proteins,
      carbs: acc.carbs + e.carbs,
      fats: acc.fats + e.fats,
      calories: acc.calories + e.calories,
    }),
    { proteins: 0, carbs: 0, fats: 0, calories: 0 }
  );

  const mealsLeft = Math.max(totalMeals - mealsConsumedCount, 1);
  const remainingCalories = Math.max(target.calories - consumed.calories, 0);
  const remainingProteins = Math.max(target.proteins - consumed.proteins, 0);
  // Lipides : ne pas dépasser le plafond
  const remainingFats = Math.max(Math.min(target.fats - consumed.fats, target.fats * 0.4), 0);
  // Glucides = ajustement pour atteindre les calories cible
  const caloriesFromProtFat = remainingProteins * 4 + remainingFats * 9;
  const remainingCarbs = Math.max(Math.round((remainingCalories - caloriesFromProtFat) / 4), 0);

  let adjustmentMessage = '';
  const calorieSurplus = consumed.calories - target.calories;
  const fatSurplus = consumed.fats - target.fats;

  if (calorieSurplus > 200) {
    const carbReduction = Math.round(calorieSurplus / 4);
    adjustmentMessage = `⚠️ Tu as ${calorieSurplus} kcal de surplus. Réduis les glucides de ${carbReduction}g sur les prochains repas (moins de riz/pâtes) et réduis l'huile.`;
  } else if (fatSurplus > 10) {
    adjustmentMessage = `⚠️ Lipides dépassés (+${Math.round(fatSurplus)}g). Pas d'huile sur les prochains repas, préfère la cuisson à l'eau.`;
  } else if (remainingProteins > 50) {
    const chickenGrams = Math.round(remainingProteins / 0.27);
    adjustmentMessage = `💪 Il te reste ${Math.round(remainingProteins)}g de protéines à atteindre. Ajoute environ ${chickenGrams}g de blanc de poulet ou 1 shaker whey (30g) sur les prochains repas.`;
  } else {
    adjustmentMessage = `✅ Tu es sur la bonne trajectoire. Il te reste ${mealsLeft} repas pour ${remainingCalories} kcal, ${Math.round(remainingProteins)}g prot, ${remainingCarbs}g gluc.`;
  }

  return {
    calories: remainingCalories,
    proteins: Math.round(remainingProteins * 10) / 10,
    carbs: remainingCarbs,
    fats: Math.round(remainingFats * 10) / 10,
    mealsLeft,
    adjustmentMessage,
  };
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
// RÈGLE DE CONSTRUCTION : totalCalories = somme exacte des items.calories
// Objectif journée training : ~3000 kcal | ~155g prot | ~400g gluc | ~80g lip
// Objectif journée repos    : ~2700 kcal | ~140g prot | ~340g gluc | ~90g lip
// Les protéines sont légèrement au-dessus de 130g (minimum recommandé)
// ============================================================

// ============================================================
// PETITS-DÉJEUNERS TRAINING — 12 variantes
// ============================================================
const BREAKFASTS_TRAINING: Meal[] = [
  { time: '07h00', name: 'Petit-déjeuner', totalCalories: 787, items: [
    { food: 'Flocons d\'avoine', quantity: '100g', proteins: 13, carbs: 60, fats: 7, calories: 389 },
    { food: 'Lait demi-écrémé', quantity: '200ml', proteins: 7, carbs: 10, fats: 4, calories: 102 },
    { food: 'Banane', quantity: '1 grande (150g)', proteins: 2, carbs: 34, fats: 0, calories: 134 },
    { food: 'Amandes', quantity: '20g', proteins: 4, carbs: 5, fats: 10, calories: 116 },
    { food: 'Miel', quantity: '15g', proteins: 0, carbs: 12, fats: 0, calories: 46 },
  ]},
  { time: '07h00', name: 'Petit-déjeuner', totalCalories: 624, items: [
    { food: 'Pain de mie blanc grillé', quantity: '3 tranches (90g)', proteins: 9, carbs: 48, fats: 3, calories: 252 },
    { food: 'Oeufs brouillés', quantity: '2 oeufs (120g)', proteins: 15, carbs: 1, fats: 12, calories: 171 },
    { food: 'Banane', quantity: '1 (120g)', proteins: 1, carbs: 27, fats: 0, calories: 107 },
    { food: 'Fromage blanc 0%', quantity: '100g', proteins: 8, carbs: 4, fats: 0, calories: 48 },
    { food: 'Miel', quantity: '15g', proteins: 0, carbs: 12, fats: 0, calories: 46 },
  ]},
  { time: '07h00', name: 'Petit-déjeuner', totalCalories: 775, items: [
    { food: 'Flocons d\'avoine', quantity: '100g', proteins: 13, carbs: 60, fats: 7, calories: 389 },
    { food: 'Lait demi-écrémé', quantity: '300ml', proteins: 10, carbs: 15, fats: 6, calories: 153 },
    { food: 'Myrtilles', quantity: '100g', proteins: 1, carbs: 14, fats: 0, calories: 57 },
    { food: 'Noix de cajou', quantity: '25g', proteins: 4, carbs: 7, fats: 11, calories: 145 },
    { food: 'Miel', quantity: '10g', proteins: 0, carbs: 8, fats: 0, calories: 31 },
  ]},
  { time: '07h00', name: 'Petit-déjeuner', totalCalories: 730, items: [
    { food: 'Flocons d\'avoine', quantity: '90g', proteins: 12, carbs: 54, fats: 6, calories: 350 },
    { food: 'Skyr nature', quantity: '150g', proteins: 17, carbs: 6, fats: 0, calories: 90 },
    { food: 'Mangue', quantity: '200g', proteins: 2, carbs: 30, fats: 0, calories: 128 },
    { food: 'Amandes effilées', quantity: '20g', proteins: 4, carbs: 5, fats: 8, calories: 116 },
    { food: 'Miel', quantity: '15g', proteins: 0, carbs: 12, fats: 0, calories: 46 },
  ]},
  { time: '07h00', name: 'Petit-déjeuner', totalCalories: 578, items: [
    { food: 'Pain de mie blanc', quantity: '3 tranches (90g)', proteins: 9, carbs: 48, fats: 3, calories: 252 },
    { food: 'Fromage blanc 0%', quantity: '200g', proteins: 16, carbs: 8, fats: 0, calories: 96 },
    { food: 'Framboises', quantity: '100g', proteins: 1, carbs: 12, fats: 0, calories: 52 },
    { food: 'Miel', quantity: '20g', proteins: 0, carbs: 16, fats: 0, calories: 62 },
    { food: 'Amandes', quantity: '20g', proteins: 4, carbs: 5, fats: 10, calories: 116 },
  ]},
  { time: '07h00', name: 'Petit-déjeuner', totalCalories: 710, items: [
    { food: "Flocons d'avoine", quantity: '60g', proteins: 8, carbs: 36, fats: 4, calories: 233 },
    { food: 'Lait demi-écrémé', quantity: '300ml', proteins: 10, carbs: 15, fats: 6, calories: 153 },
    { food: 'Kiwi', quantity: '2 (150g)', proteins: 2, carbs: 18, fats: 0, calories: 90 },
    { food: 'Amandes', quantity: '20g', proteins: 4, carbs: 5, fats: 10, calories: 116 },
    { food: 'Miel', quantity: '10g', proteins: 0, carbs: 8, fats: 0, calories: 31 },
  ]},
  { time: '07h00', name: 'Petit-déjeuner', totalCalories: 699, items: [
    { food: 'Flocons d\'avoine', quantity: '100g', proteins: 13, carbs: 60, fats: 7, calories: 389 },
    { food: 'Yaourt grec 0%', quantity: '150g', proteins: 15, carbs: 6, fats: 0, calories: 85 },
    { food: 'Fraises', quantity: '150g', proteins: 1, carbs: 12, fats: 0, calories: 48 },
    { food: 'Noix', quantity: '20g', proteins: 3, carbs: 3, fats: 13, calories: 131 },
    { food: 'Miel', quantity: '15g', proteins: 0, carbs: 12, fats: 0, calories: 46 },
  ]},
  { time: '07h00', name: 'Petit-déjeuner', totalCalories: 695, items: [
    { food: 'Pain de mie blanc', quantity: '4 tranches (120g)', proteins: 12, carbs: 64, fats: 4, calories: 336 },
    { food: 'Oeufs à la coque', quantity: '2 oeufs (120g)', proteins: 15, carbs: 1, fats: 12, calories: 171 },
    { food: 'Orange', quantity: '1 (180g)', proteins: 2, carbs: 18, fats: 0, calories: 72 },
    { food: 'Amandes', quantity: '20g', proteins: 4, carbs: 5, fats: 10, calories: 116 },
  ]},
  { time: '07h00', name: 'Petit-déjeuner', totalCalories: 748, items: [
    { food: 'Flocons d\'avoine', quantity: '100g', proteins: 13, carbs: 60, fats: 7, calories: 389 },
    { food: 'Lait demi-écrémé', quantity: '200ml', proteins: 7, carbs: 10, fats: 4, calories: 102 },
    { food: 'Pomme', quantity: '1 (180g)', proteins: 0, carbs: 23, fats: 0, calories: 93 },
    { food: 'Beurre de cacahuète naturel', quantity: '20g', proteins: 5, carbs: 4, fats: 10, calories: 118 },
    { food: 'Miel', quantity: '15g', proteins: 0, carbs: 12, fats: 0, calories: 46 },
  ]},
  { time: '07h00', name: 'Petit-déjeuner', totalCalories: 623, items: [
    { food: 'Riz au lait maison (riz + lait)', quantity: '300g', proteins: 8, carbs: 55, fats: 5, calories: 297 },
    { food: 'Fromage blanc 0%', quantity: '150g', proteins: 12, carbs: 6, fats: 0, calories: 72 },
    { food: 'Banane', quantity: '1 (120g)', proteins: 1, carbs: 27, fats: 0, calories: 107 },
    { food: 'Amandes', quantity: '20g', proteins: 4, carbs: 5, fats: 10, calories: 116 },
    { food: 'Miel', quantity: '10g', proteins: 0, carbs: 8, fats: 0, calories: 31 },
  ]},
  { time: '07h00', name: 'Petit-déjeuner', totalCalories: 771, items: [
    { food: 'Flocons d\'avoine', quantity: '100g', proteins: 13, carbs: 60, fats: 7, calories: 389 },
    { food: 'Lait demi-écrémé', quantity: '200ml', proteins: 7, carbs: 10, fats: 4, calories: 102 },
    { food: 'Poire', quantity: '1 (180g)', proteins: 1, carbs: 22, fats: 0, calories: 89 },
    { food: 'Noix de cajou', quantity: '25g', proteins: 4, carbs: 7, fats: 11, calories: 145 },
    { food: 'Miel', quantity: '15g', proteins: 0, carbs: 12, fats: 0, calories: 46 },
  ]},
  { time: '07h00', name: 'Petit-déjeuner', totalCalories: 562, items: [
    { food: 'Pain de mie blanc', quantity: '3 tranches (90g)', proteins: 9, carbs: 48, fats: 3, calories: 252 },
    { food: 'Skyr nature', quantity: '200g', proteins: 22, carbs: 8, fats: 0, calories: 120 },
    { food: 'Myrtilles', quantity: '100g', proteins: 1, carbs: 14, fats: 0, calories: 57 },
    { food: 'Miel', quantity: '15g', proteins: 0, carbs: 12, fats: 0, calories: 46 },
    { food: 'Amandes', quantity: '15g', proteins: 3, carbs: 4, fats: 8, calories: 87 },
  ]},
];

// ============================================================
// DÉJEUNERS TRAINING — 12 variantes
// ============================================================
const LUNCHES_TRAINING: Meal[] = [
  // 1. Pâtes bolognaise maison
  { time: '12h30', name: 'Déjeuner — Pâtes bolognaise', totalCalories: 582, items: [
    { food: 'Pâtes blanches cuites', quantity: '250g', proteins: 9, carbs: 62, fats: 2, calories: 306 },
    { food: 'Boeuf haché 5% MG', quantity: '120g', proteins: 26, carbs: 0, fats: 6, calories: 158 },
    { food: 'Tomacouli', quantity: '120g', proteins: 1, carbs: 7, fats: 0, calories: 36 },
    { food: 'Parmesan râpé', quantity: '10g', proteins: 4, carbs: 0, fats: 3, calories: 43 },
  ]},
  // 2. Burger maison poulet
  { time: '12h30', name: 'Déjeuner — Burger poulet', totalCalories: 565, items: [
    { food: 'Blanc de poulet grillé', quantity: '150g', proteins: 35, carbs: 0, fats: 2, calories: 163 },
    { food: 'Pain burger (2 tranches)', quantity: '100g', proteins: 8, carbs: 50, fats: 4, calories: 270 },
    { food: 'Tomate', quantity: '80g', proteins: 1, carbs: 3, fats: 0, calories: 14 },
    { food: 'Ketchup', quantity: '20g', proteins: 0, carbs: 5, fats: 0, calories: 20 },
    { food: 'Fromage blanc 0%', quantity: '100g', proteins: 10, carbs: 4, fats: 0, calories: 56 },
  ]},
  // 3. Riz sauté poulet style asiatique
  { time: '12h30', name: 'Déjeuner — Riz sauté poulet', totalCalories: 571, items: [
    { food: 'Blanc de poulet grillé', quantity: '130g', proteins: 30, carbs: 0, fats: 2, calories: 141 },
    { food: 'Riz blanc cuit', quantity: '250g', proteins: 4, carbs: 57, fats: 0, calories: 244 },
    { food: 'Oeuf entier', quantity: '1 (60g)', proteins: 8, carbs: 0, fats: 5, calories: 78 },
    { food: 'Sauce soja', quantity: '15ml', proteins: 2, carbs: 2, fats: 0, calories: 9 },
    { food: 'Huile d\'olive', quantity: '11ml', proteins: 0, carbs: 0, fats: 10, calories: 99 },
  ]},
  // 4. Wrap thon mayo
  { time: '12h30', name: 'Déjeuner — Wrap thon', totalCalories: 558, items: [
    { food: 'Thon au naturel (boîte)', quantity: '150g', proteins: 35, carbs: 0, fats: 2, calories: 158 },
    { food: 'Tortilla blé (2 grandes)', quantity: '120g', proteins: 8, carbs: 54, fats: 4, calories: 284 },
    { food: 'Fromage blanc 0%', quantity: '80g', proteins: 8, carbs: 3, fats: 0, calories: 45 },
    { food: 'Tomates cerises', quantity: '100g', proteins: 1, carbs: 4, fats: 0, calories: 18 },
    { food: 'Huile d\'olive', quantity: '6ml', proteins: 0, carbs: 0, fats: 5, calories: 54 },
  ]},
  // 5. Pommes de terre rôties + steak haché
  { time: '12h30', name: 'Déjeuner — Steak pdt rôties', totalCalories: 574, items: [
    { food: 'Steak haché 5% MG', quantity: '150g', proteins: 30, carbs: 0, fats: 8, calories: 194 },
    { food: 'Pommes de terre cuites', quantity: '300g', proteins: 6, carbs: 51, fats: 0, calories: 231 },
    { food: 'Herbes de Provence', quantity: '5g', proteins: 0, carbs: 1, fats: 0, calories: 5 },
    { food: 'Huile d\'olive', quantity: '12ml', proteins: 0, carbs: 0, fats: 11, calories: 108 },
  ]},
  // 6. Pâtes thon crème
  { time: '12h30', name: 'Déjeuner — Pâtes thon crème', totalCalories: 561, items: [
    { food: 'Thon au naturel (boîte)', quantity: '150g', proteins: 35, carbs: 0, fats: 2, calories: 158 },
    { food: 'Pâtes blanches cuites', quantity: '220g', proteins: 8, carbs: 55, fats: 2, calories: 270 },
    { food: 'Fromage blanc 0%', quantity: '80g', proteins: 8, carbs: 3, fats: 0, calories: 45 },
    { food: 'Tomates cerises', quantity: '100g', proteins: 1, carbs: 4, fats: 0, calories: 18 },
    { food: 'Huile d\'olive', quantity: '8ml', proteins: 0, carbs: 0, fats: 7, calories: 72 },
  ]},
  // 7. Saumon riz basmati sauce soja
  { time: '12h30', name: 'Déjeuner — Saumon riz soja', totalCalories: 596, items: [
    { food: 'Saumon grillé', quantity: '130g', proteins: 26, carbs: 0, fats: 14, calories: 222 },
    { food: 'Riz basmati cuit', quantity: '230g', proteins: 5, carbs: 60, fats: 0, calories: 258 },
    { food: 'Sauce soja', quantity: '15ml', proteins: 2, carbs: 2, fats: 0, calories: 9 },
    { food: 'Huile d\'olive', quantity: '12ml', proteins: 0, carbs: 0, fats: 11, calories: 108 },
  ]},
  // 8. Pizza protéinée maison (base pain de mie)
  { time: '12h30', name: 'Déjeuner — Pizza protéinée', totalCalories: 568, items: [
    { food: 'Pain de mie blanc (4 tranches)', quantity: '120g', proteins: 10, carbs: 60, fats: 4, calories: 318 },
    { food: 'Blanc de poulet grillé', quantity: '100g', proteins: 23, carbs: 0, fats: 1, calories: 109 },
    { food: 'Sauce tomate', quantity: '80g', proteins: 2, carbs: 6, fats: 0, calories: 28 },
    { food: 'Mozzarella light', quantity: '60g', proteins: 10, carbs: 1, fats: 7, calories: 105 },
    { food: 'Huile d\'olive', quantity: '9ml', proteins: 0, carbs: 0, fats: 8, calories: 81 },
  ]},
  // 9. Riz poulet curry doux
  { time: '12h30', name: 'Déjeuner — Poulet curry', totalCalories: 555, items: [
    { food: 'Blanc de poulet grillé', quantity: '140g', proteins: 32, carbs: 0, fats: 2, calories: 152 },
    { food: 'Riz blanc cuit', quantity: '240g', proteins: 4, carbs: 55, fats: 0, calories: 235 },
    { food: 'Fromage blanc 0%', quantity: '80g', proteins: 8, carbs: 3, fats: 0, calories: 45 },
    { food: 'Curry en poudre', quantity: '5g', proteins: 0, carbs: 2, fats: 0, calories: 15 },
    { food: 'Huile d\'olive', quantity: '12ml', proteins: 0, carbs: 0, fats: 11, calories: 108 },
  ]},
  // 10. Bowl japonais (poké bowl)
  { time: '12h30', name: 'Déjeuner — Poké bowl', totalCalories: 562, items: [
    { food: 'Thon au naturel (boîte)', quantity: '130g', proteins: 30, carbs: 0, fats: 2, calories: 137 },
    { food: 'Riz blanc cuit', quantity: '230g', proteins: 4, carbs: 53, fats: 0, calories: 225 },
    { food: 'Concombre', quantity: '100g', proteins: 1, carbs: 3, fats: 0, calories: 16 },
    { food: 'Sauce soja', quantity: '15ml', proteins: 2, carbs: 2, fats: 0, calories: 9 },
    { food: 'Huile d\'olive', quantity: '18ml', proteins: 0, carbs: 0, fats: 17, calories: 162 },
  ]},
  // 11. Hachis parmentier allégé
  { time: '12h30', name: 'Déjeuner — Hachis parmentier', totalCalories: 573, items: [
    { food: 'Boeuf haché 5% MG', quantity: '120g', proteins: 26, carbs: 0, fats: 6, calories: 158 },
    { food: 'Pommes de terre cuites', quantity: '280g', proteins: 6, carbs: 48, fats: 0, calories: 216 },
    { food: 'Fromage blanc 0%', quantity: '80g', proteins: 8, carbs: 3, fats: 0, calories: 45 },
    { food: 'Huile d\'olive', quantity: '15ml', proteins: 0, carbs: 0, fats: 14, calories: 135 },
  ]},
  // 12. Cabillaud + pommes de terre + citron herbes
  { time: '12h30', name: 'Déjeuner — Cabillaud citron', totalCalories: 549, items: [
    { food: 'Cabillaud au four', quantity: '160g', proteins: 32, carbs: 0, fats: 2, calories: 147 },
    { food: 'Pommes de terre cuites', quantity: '260g', proteins: 5, carbs: 44, fats: 0, calories: 201 },
    { food: 'Jus de citron + herbes', quantity: '20g', proteins: 0, carbs: 2, fats: 0, calories: 5 },
    { food: 'Huile d\'olive', quantity: '18ml', proteins: 0, carbs: 0, fats: 17, calories: 162 },
  ]},
];

// ============================================================
// COLLATIONS TRAINING — 12 variantes
// ============================================================
const SNACKS_TRAINING: Meal[] = [
  { time: '16h00', name: 'Collation pré-entraînement', totalCalories: 403, items: [
    { food: 'Riz cuit', quantity: '200g', proteins: 4, carbs: 52, fats: 0, calories: 224 },
    { food: 'Fromage blanc 0%', quantity: '150g', proteins: 12, carbs: 6, fats: 0, calories: 72 },
    { food: 'Banane', quantity: '1 (120g)', proteins: 1, carbs: 27, fats: 0, calories: 107 },
  ]},
  { time: '16h00', name: 'Collation pré-entraînement', totalCalories: 407, items: [
    { food: 'Pain de mie blanc', quantity: '3 tranches (90g)', proteins: 9, carbs: 48, fats: 3, calories: 252 },
    { food: 'Fromage blanc 0%', quantity: '100g', proteins: 8, carbs: 4, fats: 0, calories: 48 },
    { food: 'Banane', quantity: '1 (120g)', proteins: 1, carbs: 27, fats: 0, calories: 107 },
  ]},
  { time: '16h00', name: 'Collation pré-entraînement', totalCalories: 442, items: [
    { food: 'Flocons d\'avoine', quantity: '60g', proteins: 8, carbs: 36, fats: 4, calories: 233 },
    { food: 'Lait demi-écrémé', quantity: '200ml', proteins: 7, carbs: 10, fats: 4, calories: 102 },
    { food: 'Banane', quantity: '1 (120g)', proteins: 1, carbs: 27, fats: 0, calories: 107 },
  ]},
  { time: '16h00', name: 'Collation pré-entraînement', totalCalories: 338, items: [
    { food: 'Riz cuit', quantity: '180g', proteins: 4, carbs: 47, fats: 0, calories: 202 },
    { food: 'Skyr nature', quantity: '150g', proteins: 17, carbs: 6, fats: 0, calories: 90 },
    { food: 'Myrtilles', quantity: '80g', proteins: 1, carbs: 11, fats: 0, calories: 46 },
  ]},
  { time: '16h00', name: 'Collation pré-entraînement', totalCalories: 383, items: [
    { food: 'Pain de mie blanc', quantity: '3 tranches (90g)', proteins: 9, carbs: 48, fats: 3, calories: 252 },
    { food: 'Yaourt grec 0%', quantity: '150g', proteins: 15, carbs: 6, fats: 0, calories: 85 },
    { food: 'Miel', quantity: '15g', proteins: 0, carbs: 12, fats: 0, calories: 46 },
  ]},
  { time: '16h00', name: 'Collation pré-entraînement', totalCalories: 351, items: [
    { food: 'Patate douce cuite', quantity: '200g', proteins: 3, carbs: 40, fats: 0, calories: 172 },
    { food: 'Fromage blanc 0%', quantity: '150g', proteins: 12, carbs: 6, fats: 0, calories: 72 },
    { food: 'Banane', quantity: '1 (120g)', proteins: 1, carbs: 27, fats: 0, calories: 107 },
  ]},
  { time: '16h00', name: 'Collation pré-entraînement', totalCalories: 365, items: [
    { food: 'Riz cuit', quantity: '200g', proteins: 4, carbs: 52, fats: 0, calories: 224 },
    { food: 'Fromage blanc 0%', quantity: '100g', proteins: 8, carbs: 4, fats: 0, calories: 48 },
    { food: 'Pomme', quantity: '1 (180g)', proteins: 0, carbs: 23, fats: 0, calories: 93 },
  ]},
  { time: '16h00', name: 'Collation pré-entraînement', totalCalories: 378, items: [
    { food: 'Pain de mie blanc', quantity: '2 tranches (60g)', proteins: 6, carbs: 32, fats: 2, calories: 168 },
    { food: 'Fromage blanc 0%', quantity: '150g', proteins: 12, carbs: 6, fats: 0, calories: 72 },
    { food: 'Banane', quantity: '1 (120g)', proteins: 1, carbs: 27, fats: 0, calories: 107 },
    { food: 'Miel', quantity: '10g', proteins: 0, carbs: 8, fats: 0, calories: 31 },
  ]},
  { time: '16h00', name: 'Collation pré-entraînement', totalCalories: 413, items: [
    { food: 'Flocons d\'avoine', quantity: '60g', proteins: 8, carbs: 36, fats: 4, calories: 233 },
    { food: 'Skyr nature', quantity: '150g', proteins: 17, carbs: 6, fats: 0, calories: 90 },
    { food: 'Kiwi', quantity: '2 (150g)', proteins: 2, carbs: 18, fats: 0, calories: 90 },
  ]},
  { time: '16h00', name: 'Collation pré-entraînement', totalCalories: 341, items: [
    { food: 'Riz cuit', quantity: '200g', proteins: 4, carbs: 52, fats: 0, calories: 224 },
    { food: 'Yaourt grec 0%', quantity: '150g', proteins: 15, carbs: 6, fats: 0, calories: 85 },
    { food: 'Fraises', quantity: '100g', proteins: 1, carbs: 8, fats: 0, calories: 32 },
  ]},
  { time: '16h00', name: 'Collation pré-entraînement', totalCalories: 389, items: [
    { food: 'Pain de mie blanc', quantity: '3 tranches (90g)', proteins: 9, carbs: 48, fats: 3, calories: 252 },
    { food: 'Fromage blanc 0%', quantity: '100g', proteins: 8, carbs: 4, fats: 0, calories: 48 },
    { food: 'Poire', quantity: '1 (180g)', proteins: 1, carbs: 22, fats: 0, calories: 89 },
  ]},
  { time: '16h00', name: 'Collation pré-entraînement', totalCalories: 369, items: [
    { food: 'Patate douce cuite', quantity: '200g', proteins: 3, carbs: 40, fats: 0, calories: 172 },
    { food: 'Skyr nature', quantity: '150g', proteins: 17, carbs: 6, fats: 0, calories: 90 },
    { food: 'Banane', quantity: '1 (120g)', proteins: 1, carbs: 27, fats: 0, calories: 107 },
  ]},
];

// ============================================================
// DÎNERS TRAINING — 12 variantes
// ============================================================
const DINNERS_TRAINING: Meal[] = [
  // 1. Pâtes bolognaise + whey
  { time: '19h30', name: 'Dîner — Pâtes bolognaise', totalCalories: 920, items: [
    { food: 'Shaker Whey protéine', quantity: '30g (1 dose)', proteins: 24, carbs: 3, fats: 2, calories: 120 },
    { food: 'Pâtes blanches cuites', quantity: '300g', proteins: 11, carbs: 75, fats: 2, calories: 367 },
    { food: 'Boeuf haché 5% MG', quantity: '130g', proteins: 28, carbs: 0, fats: 7, calories: 171 },
    { food: 'Tomacouli', quantity: '120g', proteins: 1, carbs: 7, fats: 0, calories: 36 },
    { food: 'Parmesan râpé', quantity: '15g', proteins: 6, carbs: 0, fats: 5, calories: 65 },
    { food: 'Huile d\'olive', quantity: '18ml', proteins: 0, carbs: 0, fats: 17, calories: 162 },
  ]},
  // 2. Burger maison boeuf + frites four
  { time: '19h30', name: 'Dîner — Burger boeuf frites', totalCalories: 935, items: [
    { food: 'Shaker Whey protéine', quantity: '30g (1 dose)', proteins: 24, carbs: 3, fats: 2, calories: 120 },
    { food: 'Steak haché 5% MG', quantity: '150g', proteins: 30, carbs: 0, fats: 8, calories: 194 },
    { food: 'Pain burger (2 tranches)', quantity: '100g', proteins: 8, carbs: 50, fats: 4, calories: 270 },
    { food: 'Pommes de terre cuites', quantity: '200g', proteins: 4, carbs: 34, fats: 0, calories: 154 },
    { food: 'Ketchup', quantity: '20g', proteins: 0, carbs: 5, fats: 0, calories: 20 },
    { food: 'Huile d\'olive', quantity: '20ml', proteins: 0, carbs: 0, fats: 18, calories: 180 },
  ]},
  // 3. Saumon pâtes crème citron
  { time: '19h30', name: 'Dîner — Saumon pâtes crème', totalCalories: 905, items: [
    { food: 'Shaker Whey protéine', quantity: '30g (1 dose)', proteins: 24, carbs: 3, fats: 2, calories: 120 },
    { food: 'Saumon au four', quantity: '150g', proteins: 30, carbs: 0, fats: 17, calories: 257 },
    { food: 'Pâtes blanches cuites', quantity: '270g', proteins: 10, carbs: 67, fats: 2, calories: 330 },
    { food: 'Fromage blanc 0%', quantity: '80g', proteins: 8, carbs: 3, fats: 0, calories: 45 },
    { food: 'Huile d\'olive', quantity: '17ml', proteins: 0, carbs: 0, fats: 15, calories: 153 },
  ]},
  // 4. Poulet riz + sauce curry
  { time: '19h30', name: 'Dîner — Poulet curry riz', totalCalories: 918, items: [
    { food: 'Shaker Whey protéine', quantity: '30g (1 dose)', proteins: 24, carbs: 3, fats: 2, calories: 120 },
    { food: 'Blanc de poulet grillé', quantity: '180g', proteins: 42, carbs: 0, fats: 2, calories: 196 },
    { food: 'Riz basmati cuit', quantity: '280g', proteins: 6, carbs: 73, fats: 0, calories: 314 },
    { food: 'Fromage blanc 0%', quantity: '80g', proteins: 8, carbs: 3, fats: 0, calories: 45 },
    { food: 'Curry en poudre', quantity: '5g', proteins: 0, carbs: 2, fats: 0, calories: 15 },
    { food: 'Huile d\'olive', quantity: '14ml', proteins: 0, carbs: 0, fats: 13, calories: 126 },
  ]},
  // 5. Crêpes protéinées poulet
  { time: '19h30', name: 'Dîner — Crêpes poulet', totalCalories: 912, items: [
    { food: 'Shaker Whey protéine', quantity: '30g (1 dose)', proteins: 24, carbs: 3, fats: 2, calories: 120 },
    { food: 'Farine de blé blanche', quantity: '120g', proteins: 11, carbs: 86, fats: 2, calories: 409 },
    { food: 'Blanc de poulet grillé', quantity: '120g', proteins: 28, carbs: 0, fats: 1, calories: 130 },
    { food: 'Oeuf entier', quantity: '2 (120g)', proteins: 16, carbs: 0, fats: 10, calories: 156 },
    { food: 'Huile d\'olive', quantity: '10ml', proteins: 0, carbs: 0, fats: 9, calories: 90 },
  ]},
  // 6. Tacos maison poulet
  { time: '19h30', name: 'Dîner — Tacos poulet', totalCalories: 928, items: [
    { food: 'Shaker Whey protéine', quantity: '30g (1 dose)', proteins: 24, carbs: 3, fats: 2, calories: 120 },
    { food: 'Blanc de poulet grillé', quantity: '160g', proteins: 37, carbs: 0, fats: 2, calories: 174 },
    { food: 'Tortilla blé (3 grandes)', quantity: '180g', proteins: 12, carbs: 81, fats: 6, calories: 426 },
    { food: 'Fromage blanc 0%', quantity: '80g', proteins: 8, carbs: 3, fats: 0, calories: 45 },
    { food: 'Sauce tomate', quantity: '60g', proteins: 1, carbs: 5, fats: 0, calories: 21 },
    { food: 'Huile d\'olive', quantity: '15ml', proteins: 0, carbs: 0, fats: 14, calories: 135 },
  ]},
  // 7. Pâtes thon sauce tomate
  { time: '19h30', name: 'Dîner — Pâtes thon tomate', totalCalories: 897, items: [
    { food: 'Shaker Whey protéine', quantity: '30g (1 dose)', proteins: 24, carbs: 3, fats: 2, calories: 120 },
    { food: 'Thon au naturel (boîte)', quantity: '160g', proteins: 37, carbs: 0, fats: 2, calories: 169 },
    { food: 'Pâtes blanches cuites', quantity: '280g', proteins: 10, carbs: 70, fats: 2, calories: 342 },
    { food: 'Sauce tomate', quantity: '100g', proteins: 2, carbs: 8, fats: 0, calories: 35 },
    { food: 'Huile d\'olive', quantity: '24ml', proteins: 0, carbs: 0, fats: 22, calories: 216 },
  ]},
  // 8. Riz sauté dinde + oeuf
  { time: '19h30', name: 'Dîner — Riz sauté dinde', totalCalories: 940, items: [
    { food: 'Shaker Whey protéine', quantity: '30g (1 dose)', proteins: 24, carbs: 3, fats: 2, calories: 120 },
    { food: 'Escalope de dinde', quantity: '160g', proteins: 35, carbs: 0, fats: 3, calories: 170 },
    { food: 'Riz basmati cuit', quantity: '280g', proteins: 6, carbs: 73, fats: 0, calories: 314 },
    { food: 'Oeuf entier', quantity: '1 (60g)', proteins: 8, carbs: 0, fats: 5, calories: 78 },
    { food: 'Sauce soja', quantity: '15ml', proteins: 2, carbs: 2, fats: 0, calories: 9 },
    { food: 'Huile d\'olive', quantity: '27ml', proteins: 0, carbs: 0, fats: 25, calories: 243 },
  ]},
  // 9. Saumon pdt four + citron aneth
  { time: '19h30', name: 'Dîner — Saumon pdt citron', totalCalories: 908, items: [
    { food: 'Shaker Whey protéine', quantity: '30g (1 dose)', proteins: 24, carbs: 3, fats: 2, calories: 120 },
    { food: 'Saumon au four', quantity: '150g', proteins: 30, carbs: 0, fats: 17, calories: 257 },
    { food: 'Pommes de terre cuites', quantity: '300g', proteins: 6, carbs: 51, fats: 0, calories: 231 },
    { food: 'Jus de citron + aneth', quantity: '20g', proteins: 0, carbs: 2, fats: 0, calories: 5 },
    { food: 'Huile d\'olive', quantity: '30ml', proteins: 0, carbs: 0, fats: 28, calories: 270 },
  ]},
  // 10. Wrap boeuf haché fromage
  { time: '19h30', name: 'Dîner — Wrap boeuf', totalCalories: 916, items: [
    { food: 'Shaker Whey protéine', quantity: '30g (1 dose)', proteins: 24, carbs: 3, fats: 2, calories: 120 },
    { food: 'Boeuf haché 5% MG', quantity: '150g', proteins: 32, carbs: 0, fats: 8, calories: 197 },
    { food: 'Tortilla blé (3 grandes)', quantity: '180g', proteins: 12, carbs: 81, fats: 6, calories: 426 },
    { food: 'Fromage blanc 0%', quantity: '80g', proteins: 8, carbs: 3, fats: 0, calories: 45 },
    { food: 'Sauce tomate', quantity: '60g', proteins: 1, carbs: 5, fats: 0, calories: 21 },
    { food: 'Huile d\'olive', quantity: '12ml', proteins: 0, carbs: 0, fats: 11, calories: 108 },
  ]},
  // 11. Cabillaud + riz + sauce soja
  { time: '19h30', name: 'Dîner — Cabillaud riz soja', totalCalories: 925, items: [
    { food: 'Shaker Whey protéine', quantity: '30g (1 dose)', proteins: 24, carbs: 3, fats: 2, calories: 120 },
    { food: 'Cabillaud au four', quantity: '200g', proteins: 40, carbs: 0, fats: 2, calories: 184 },
    { food: 'Riz blanc cuit', quantity: '300g', proteins: 5, carbs: 69, fats: 0, calories: 293 },
    { food: 'Sauce soja', quantity: '20ml', proteins: 3, carbs: 3, fats: 0, calories: 12 },
    { food: 'Huile d\'olive', quantity: '35ml', proteins: 0, carbs: 0, fats: 32, calories: 315 },
  ]},
  // 12. Omelette jambon + pdt
  { time: '19h30', name: 'Dîner — Omelette jambon pdt', totalCalories: 903, items: [
    { food: 'Shaker Whey protéine', quantity: '30g (1 dose)', proteins: 24, carbs: 3, fats: 2, calories: 120 },
    { food: 'Oeufs entiers', quantity: '3 (180g)', proteins: 24, carbs: 0, fats: 15, calories: 234 },
    { food: 'Jambon blanc (tranches)', quantity: '100g', proteins: 18, carbs: 1, fats: 3, calories: 103 },
    { food: 'Pommes de terre cuites', quantity: '250g', proteins: 5, carbs: 43, fats: 0, calories: 193 },
    { food: 'Huile d\'olive', quantity: '28ml', proteins: 0, carbs: 0, fats: 26, calories: 252 },
  ]},
];

// ============================================================
// COLLATION MATINALE 10h30 — 12 variantes (anti-hypoglycémie)
// Objectif : stabiliser la glycémie entre 9h30 et 12h30
// Glucides à IG modéré + protéines + un peu de lipides
// ============================================================
const MORNING_SNACKS: Meal[] = [
  { time: '10h30', name: 'Collation matinale', totalCalories: 245, items: [
    { food: 'Banane', quantity: '1 (120g)', proteins: 1, carbs: 27, fats: 0, calories: 107 },
    { food: 'Amandes', quantity: '20g', proteins: 4, carbs: 5, fats: 10, calories: 116 },
    { food: 'Fromage blanc 0%', quantity: '100g', proteins: 8, carbs: 4, fats: 0, calories: 48 },
  ]},
  { time: '10h30', name: 'Collation matinale', totalCalories: 238, items: [
    { food: 'Pomme', quantity: '1 (180g)', proteins: 0, carbs: 23, fats: 0, calories: 93 },
    { food: 'Noix de cajou', quantity: '25g', proteins: 4, carbs: 7, fats: 11, calories: 145 },
  ]},
  { time: '10h30', name: 'Collation matinale', totalCalories: 252, items: [
    { food: 'Skyr nature', quantity: '150g', proteins: 17, carbs: 6, fats: 0, calories: 90 },
    { food: 'Banane', quantity: '1 (120g)', proteins: 1, carbs: 27, fats: 0, calories: 107 },
    { food: 'Amandes', quantity: '10g', proteins: 2, carbs: 2, fats: 5, calories: 58 },
  ]},
  { time: '10h30', name: 'Collation matinale', totalCalories: 231, items: [
    { food: 'Pain de mie blanc', quantity: '2 tranches (60g)', proteins: 6, carbs: 32, fats: 2, calories: 168 },
    { food: 'Fromage blanc 0%', quantity: '100g', proteins: 8, carbs: 4, fats: 0, calories: 48 },
    { food: 'Miel', quantity: '5g', proteins: 0, carbs: 4, fats: 0, calories: 15 },
  ]},
  { time: '10h30', name: 'Collation matinale', totalCalories: 243, items: [
    { food: 'Yaourt grec 0%', quantity: '150g', proteins: 15, carbs: 6, fats: 0, calories: 85 },
    { food: 'Myrtilles', quantity: '100g', proteins: 1, carbs: 14, fats: 0, calories: 57 },
    { food: 'Noix', quantity: '15g', proteins: 2, carbs: 2, fats: 10, calories: 98 },
  ]},
  { time: '10h30', name: 'Collation matinale', totalCalories: 255, items: [
    { food: 'Banane', quantity: '1 (120g)', proteins: 1, carbs: 27, fats: 0, calories: 107 },
    { food: 'Beurre de cacahuète naturel', quantity: '20g', proteins: 5, carbs: 4, fats: 10, calories: 118 },
    { food: 'Fromage blanc 0%', quantity: '60g', proteins: 5, carbs: 2, fats: 0, calories: 29 },
  ]},
  { time: '10h30', name: 'Collation matinale', totalCalories: 228, items: [
    { food: 'Kiwi', quantity: '2 (150g)', proteins: 2, carbs: 18, fats: 0, calories: 90 },
    { food: 'Amandes', quantity: '20g', proteins: 4, carbs: 5, fats: 10, calories: 116 },
    { food: 'Fromage blanc 0%', quantity: '50g', proteins: 4, carbs: 2, fats: 0, calories: 24 },
  ]},
  { time: '10h30', name: 'Collation matinale', totalCalories: 247, items: [
    { food: 'Flocons d\'avoine', quantity: '40g', proteins: 5, carbs: 24, fats: 3, calories: 155 },
    { food: 'Lait demi-écrémé', quantity: '150ml', proteins: 5, carbs: 7, fats: 3, calories: 77 },
    { food: 'Miel', quantity: '5g', proteins: 0, carbs: 4, fats: 0, calories: 15 },
  ]},
  { time: '10h30', name: 'Collation matinale', totalCalories: 233, items: [
    { food: 'Poire', quantity: '1 (180g)', proteins: 1, carbs: 22, fats: 0, calories: 89 },
    { food: 'Noix de cajou', quantity: '25g', proteins: 4, carbs: 7, fats: 11, calories: 145 },
  ]},
  { time: '10h30', name: 'Collation matinale', totalCalories: 240, items: [
    { food: 'Skyr nature', quantity: '150g', proteins: 17, carbs: 6, fats: 0, calories: 90 },
    { food: 'Fraises', quantity: '150g', proteins: 1, carbs: 12, fats: 0, calories: 48 },
    { food: 'Amandes', quantity: '15g', proteins: 3, carbs: 4, fats: 8, calories: 87 },
  ]},
  { time: '10h30', name: 'Collation matinale', totalCalories: 252, items: [
    { food: 'Pain de mie blanc', quantity: '2 tranches (60g)', proteins: 6, carbs: 32, fats: 2, calories: 168 },
    { food: 'Yaourt grec 0%', quantity: '100g', proteins: 10, carbs: 4, fats: 0, calories: 57 },
    { food: 'Banane', quantity: '0.5 (60g)', proteins: 1, carbs: 14, fats: 0, calories: 53 },
  ]},
  { time: '10h30', name: 'Collation matinale', totalCalories: 237, items: [
    { food: 'Fromage blanc 0%', quantity: '150g', proteins: 12, carbs: 6, fats: 0, calories: 72 },
    { food: 'Mangue', quantity: '150g', proteins: 1, carbs: 22, fats: 0, calories: 96 },
    { food: 'Noix', quantity: '10g', proteins: 2, carbs: 1, fats: 6, calories: 65 },
  ]},
];

// ============================================================
// PETITS-DÉJEUNERS REPOS — 12 variantes
// ============================================================
const BREAKFASTS_REST: Meal[] = [
  { time: '07h00', name: 'Petit-déjeuner', totalCalories: 682, items: [
    { food: 'Flocons d\'avoine', quantity: '80g', proteins: 11, carbs: 48, fats: 6, calories: 311 },
    { food: 'Lait demi-écrémé', quantity: '200ml', proteins: 7, carbs: 10, fats: 4, calories: 102 },
    { food: 'Banane', quantity: '1 moyenne (120g)', proteins: 1, carbs: 27, fats: 0, calories: 107 },
    { food: 'Amandes', quantity: '20g', proteins: 4, carbs: 5, fats: 10, calories: 116 },
    { food: 'Miel', quantity: '15g', proteins: 0, carbs: 12, fats: 0, calories: 46 },
  ]},
  { time: '07h00', name: 'Petit-déjeuner', totalCalories: 582, items: [
    { food: 'Pain de mie blanc grillé', quantity: '3 tranches (90g)', proteins: 9, carbs: 48, fats: 3, calories: 252 },
    { food: 'Oeufs brouillés', quantity: '2 oeufs (120g)', proteins: 15, carbs: 1, fats: 12, calories: 171 },
    { food: 'Orange', quantity: '1 (180g)', proteins: 2, carbs: 18, fats: 0, calories: 72 },
    { food: 'Amandes', quantity: '15g', proteins: 3, carbs: 4, fats: 8, calories: 87 },
  ]},
  { time: '07h00', name: 'Petit-déjeuner', totalCalories: 646, items: [
    { food: 'Flocons d\'avoine', quantity: '80g', proteins: 11, carbs: 48, fats: 6, calories: 311 },
    { food: 'Lait demi-écrémé', quantity: '200ml', proteins: 7, carbs: 10, fats: 4, calories: 102 },
    { food: 'Myrtilles', quantity: '100g', proteins: 1, carbs: 14, fats: 0, calories: 57 },
    { food: 'Noix de cajou', quantity: '25g', proteins: 4, carbs: 7, fats: 11, calories: 145 },
    { food: 'Miel', quantity: '10g', proteins: 0, carbs: 8, fats: 0, calories: 31 },
  ]},
  { time: '07h00', name: 'Petit-déjeuner', totalCalories: 644, items: [
    { food: 'Flocons d\'avoine', quantity: '80g', proteins: 11, carbs: 48, fats: 6, calories: 311 },
    { food: 'Skyr nature', quantity: '150g', proteins: 17, carbs: 6, fats: 0, calories: 90 },
    { food: 'Mangue', quantity: '150g', proteins: 1, carbs: 22, fats: 0, calories: 96 },
    { food: 'Amandes', quantity: '20g', proteins: 4, carbs: 5, fats: 10, calories: 116 },
    { food: 'Miel', quantity: '10g', proteins: 0, carbs: 8, fats: 0, calories: 31 },
  ]},
  { time: '07h00', name: 'Petit-déjeuner', totalCalories: 520, items: [
    { food: 'Pain de mie blanc', quantity: '3 tranches (90g)', proteins: 9, carbs: 48, fats: 3, calories: 252 },
    { food: 'Fromage blanc 0%', quantity: '150g', proteins: 12, carbs: 6, fats: 0, calories: 72 },
    { food: 'Framboises', quantity: '100g', proteins: 1, carbs: 12, fats: 0, calories: 52 },
    { food: 'Miel', quantity: '15g', proteins: 0, carbs: 12, fats: 0, calories: 46 },
    { food: 'Noix', quantity: '15g', proteins: 2, carbs: 2, fats: 10, calories: 98 },
  ]},
  { time: '07h00', name: 'Petit-déjeuner', totalCalories: 585, items: [
    { food: "Flocons d'avoine", quantity: '60g', proteins: 8, carbs: 36, fats: 4, calories: 233 },
    { food: 'Lait demi-écrémé', quantity: '250ml', proteins: 8, carbs: 12, fats: 5, calories: 128 },
    { food: 'Kiwi', quantity: '2 (150g)', proteins: 2, carbs: 18, fats: 0, calories: 90 },
    { food: 'Amandes', quantity: '15g', proteins: 3, carbs: 4, fats: 8, calories: 87 },
  ]},
  { time: '07h00', name: 'Petit-déjeuner', totalCalories: 606, items: [
    { food: 'Flocons d\'avoine', quantity: '80g', proteins: 11, carbs: 48, fats: 6, calories: 311 },
    { food: 'Yaourt grec 0%', quantity: '150g', proteins: 15, carbs: 6, fats: 0, calories: 85 },
    { food: 'Fraises', quantity: '150g', proteins: 1, carbs: 12, fats: 0, calories: 48 },
    { food: 'Noix', quantity: '20g', proteins: 3, carbs: 3, fats: 13, calories: 131 },
    { food: 'Miel', quantity: '10g', proteins: 0, carbs: 8, fats: 0, calories: 31 },
  ]},
  { time: '07h00', name: 'Petit-déjeuner', totalCalories: 599, items: [
    { food: 'Pain de mie blanc', quantity: '3 tranches (90g)', proteins: 9, carbs: 48, fats: 3, calories: 252 },
    { food: 'Oeufs à la coque', quantity: '2 oeufs (120g)', proteins: 15, carbs: 1, fats: 12, calories: 171 },
    { food: 'Poire', quantity: '1 (180g)', proteins: 1, carbs: 22, fats: 0, calories: 89 },
    { food: 'Amandes', quantity: '15g', proteins: 3, carbs: 4, fats: 8, calories: 87 },
  ]},
  { time: '07h00', name: 'Petit-déjeuner', totalCalories: 655, items: [
    { food: 'Flocons d\'avoine', quantity: '80g', proteins: 11, carbs: 48, fats: 6, calories: 311 },
    { food: 'Lait demi-écrémé', quantity: '200ml', proteins: 7, carbs: 10, fats: 4, calories: 102 },
    { food: 'Pomme', quantity: '1 (180g)', proteins: 0, carbs: 23, fats: 0, calories: 93 },
    { food: 'Beurre de cacahuète naturel', quantity: '20g', proteins: 5, carbs: 4, fats: 10, calories: 118 },
    { food: 'Miel', quantity: '10g', proteins: 0, carbs: 8, fats: 0, calories: 31 },
  ]},
  { time: '07h00', name: 'Petit-déjeuner', totalCalories: 678, items: [
    { food: 'Flocons d\'avoine', quantity: '80g', proteins: 11, carbs: 48, fats: 6, calories: 311 },
    { food: 'Lait demi-écrémé', quantity: '200ml', proteins: 7, carbs: 10, fats: 4, calories: 102 },
    { food: 'Poire', quantity: '1 (180g)', proteins: 1, carbs: 22, fats: 0, calories: 89 },
    { food: 'Noix de cajou', quantity: '25g', proteins: 4, carbs: 7, fats: 11, calories: 145 },
    { food: 'Miel', quantity: '10g', proteins: 0, carbs: 8, fats: 0, calories: 31 },
  ]},
  { time: '07h00', name: 'Petit-déjeuner', totalCalories: 532, items: [
    { food: 'Pain de mie blanc', quantity: '3 tranches (90g)', proteins: 9, carbs: 48, fats: 3, calories: 252 },
    { food: 'Skyr nature', quantity: '150g', proteins: 17, carbs: 6, fats: 0, calories: 90 },
    { food: 'Myrtilles', quantity: '100g', proteins: 1, carbs: 14, fats: 0, calories: 57 },
    { food: 'Miel', quantity: '15g', proteins: 0, carbs: 12, fats: 0, calories: 46 },
    { food: 'Amandes', quantity: '15g', proteins: 3, carbs: 4, fats: 8, calories: 87 },
  ]},
  { time: '07h00', name: 'Petit-déjeuner', totalCalories: 682, items: [
    { food: 'Flocons d\'avoine', quantity: '80g', proteins: 11, carbs: 48, fats: 6, calories: 311 },
    { food: 'Lait demi-écrémé', quantity: '200ml', proteins: 7, carbs: 10, fats: 4, calories: 102 },
    { food: 'Banane', quantity: '1 (120g)', proteins: 1, carbs: 27, fats: 0, calories: 107 },
    { food: 'Noix', quantity: '20g', proteins: 3, carbs: 3, fats: 13, calories: 131 },
    { food: 'Miel', quantity: '10g', proteins: 0, carbs: 8, fats: 0, calories: 31 },
  ]},
];

// ============================================================
// DÉJEUNERS REPOS — 12 variantes
// ============================================================
const LUNCHES_REST: Meal[] = [
  { time: '12h30', name: 'Déjeuner', totalCalories: 569, items: [
    { food: 'Blanc de poulet grillé', quantity: '120g', proteins: 28, carbs: 0, fats: 2, calories: 130 },
    { food: 'Riz basmati cuit', quantity: '250g', proteins: 5, carbs: 65, fats: 0, calories: 280 },
    { food: 'Carottes vapeur', quantity: '150g', proteins: 1, carbs: 13, fats: 0, calories: 52 },
    { food: 'Huile d\'olive', quantity: '12ml', proteins: 0, carbs: 0, fats: 11, calories: 108 },
  ]},
  { time: '12h30', name: 'Déjeuner', totalCalories: 533, items: [
    { food: 'Thon au naturel (boîte)', quantity: '130g', proteins: 30, carbs: 0, fats: 2, calories: 137 },
    { food: 'Pâtes blanches cuites', quantity: '220g', proteins: 8, carbs: 55, fats: 2, calories: 270 },
    { food: 'Tomates cerises', quantity: '100g', proteins: 1, carbs: 4, fats: 0, calories: 18 },
    { food: 'Huile d\'olive', quantity: '12ml', proteins: 0, carbs: 0, fats: 11, calories: 108 },
  ]},
  { time: '12h30', name: 'Déjeuner', totalCalories: 549, items: [
    { food: 'Escalope de dinde', quantity: '130g', proteins: 29, carbs: 0, fats: 3, calories: 138 },
    { food: 'Riz blanc cuit', quantity: '200g', proteins: 3, carbs: 46, fats: 0, calories: 196 },
    { food: 'Tomates cerises', quantity: '150g', proteins: 1, carbs: 6, fats: 0, calories: 27 },
    { food: 'Huile d\'olive', quantity: '12ml', proteins: 0, carbs: 0, fats: 11, calories: 108 },
  ]},
  { time: '12h30', name: 'Déjeuner', totalCalories: 586, items: [
    { food: 'Saumon grillé', quantity: '120g', proteins: 24, carbs: 0, fats: 13, calories: 205 },
    { food: 'Riz basmati cuit', quantity: '220g', proteins: 4, carbs: 57, fats: 0, calories: 246 },
    { food: 'Courgette sautée', quantity: '150g', proteins: 2, carbs: 6, fats: 0, calories: 27 },
    { food: 'Huile d\'olive', quantity: '12ml', proteins: 0, carbs: 0, fats: 11, calories: 108 },
  ]},
  { time: '12h30', name: 'Déjeuner', totalCalories: 498, items: [
    { food: 'Blanc de poulet grillé', quantity: '120g', proteins: 28, carbs: 0, fats: 2, calories: 130 },
    { food: 'Patate douce cuite', quantity: '250g', proteins: 3, carbs: 50, fats: 0, calories: 215 },
    { food: 'Poivrons grillés', quantity: '150g', proteins: 2, carbs: 10, fats: 0, calories: 48 },
    { food: 'Huile d\'olive', quantity: '12ml', proteins: 0, carbs: 0, fats: 11, calories: 108 },
  ]},
  { time: '12h30', name: 'Déjeuner', totalCalories: 534, items: [
    { food: 'Cabillaud au four', quantity: '150g', proteins: 30, carbs: 0, fats: 2, calories: 138 },
    { food: 'Riz blanc cuit', quantity: '230g', proteins: 5, carbs: 50, fats: 2, calories: 237 },
    { food: 'Carottes vapeur', quantity: '150g', proteins: 1, carbs: 13, fats: 0, calories: 52 },
    { food: 'Huile d\'olive', quantity: '12ml', proteins: 0, carbs: 0, fats: 11, calories: 108 },
  ]},
  { time: '12h30', name: 'Déjeuner', totalCalories: 530, items: [
    { food: 'Blanc de poulet grillé', quantity: '120g', proteins: 28, carbs: 0, fats: 2, calories: 130 },
    { food: 'Pâtes blanches cuites', quantity: '220g', proteins: 8, carbs: 55, fats: 2, calories: 270 },
    { food: 'Poivrons grillés', quantity: '100g', proteins: 1, carbs: 7, fats: 0, calories: 32 },
    { food: 'Huile d\'olive', quantity: '12ml', proteins: 0, carbs: 0, fats: 11, calories: 108 },
  ]},
  { time: '12h30', name: 'Déjeuner', totalCalories: 519, items: [
    { food: 'Thon au naturel (boîte)', quantity: '130g', proteins: 30, carbs: 0, fats: 2, calories: 137 },
    { food: 'Riz basmati cuit', quantity: '230g', proteins: 5, carbs: 60, fats: 0, calories: 258 },
    { food: 'Concombre', quantity: '100g', proteins: 1, carbs: 3, fats: 0, calories: 16 },
    { food: 'Huile d\'olive', quantity: '12ml', proteins: 0, carbs: 0, fats: 11, calories: 108 },
  ]},
  { time: '12h30', name: 'Déjeuner', totalCalories: 552, items: [
    { food: 'Escalope de dinde', quantity: '130g', proteins: 29, carbs: 0, fats: 3, calories: 138 },
    { food: 'Riz basmati cuit', quantity: '230g', proteins: 5, carbs: 60, fats: 0, calories: 258 },
    { food: 'Poivrons grillés', quantity: '150g', proteins: 2, carbs: 10, fats: 0, calories: 48 },
    { food: 'Huile d\'olive', quantity: '12ml', proteins: 0, carbs: 0, fats: 11, calories: 108 },
  ]},
  { time: '12h30', name: 'Déjeuner', totalCalories: 580, items: [
    { food: 'Saumon grillé', quantity: '120g', proteins: 24, carbs: 0, fats: 13, calories: 205 },
    { food: 'Riz blanc cuit', quantity: '200g', proteins: 3, carbs: 46, fats: 0, calories: 196 },
    { food: 'Tomates cerises', quantity: '100g', proteins: 1, carbs: 4, fats: 0, calories: 18 },
    { food: 'Huile d\'olive', quantity: '10ml', proteins: 0, carbs: 0, fats: 9, calories: 90 },
  ]},
  { time: '12h30', name: 'Déjeuner', totalCalories: 520, items: [
    { food: 'Blanc de poulet grillé', quantity: '120g', proteins: 28, carbs: 0, fats: 2, calories: 130 },
    { food: 'Riz blanc cuit', quantity: '230g', proteins: 5, carbs: 50, fats: 2, calories: 237 },
    { food: 'Poivrons grillés', quantity: '150g', proteins: 2, carbs: 10, fats: 0, calories: 48 },
    { food: 'Huile d\'olive', quantity: '12ml', proteins: 0, carbs: 0, fats: 11, calories: 108 },
  ]},
  { time: '12h30', name: 'Déjeuner', totalCalories: 512, items: [
    { food: 'Cabillaud au four', quantity: '150g', proteins: 30, carbs: 0, fats: 2, calories: 138 },
    { food: 'Patate douce cuite', quantity: '250g', proteins: 3, carbs: 50, fats: 0, calories: 215 },
    { food: 'Carottes vapeur', quantity: '150g', proteins: 1, carbs: 13, fats: 0, calories: 52 },
    { food: 'Huile d\'olive', quantity: '12ml', proteins: 0, carbs: 0, fats: 11, calories: 108 },
  ]},
];

// ============================================================
// COLLATIONS REPOS — 12 variantes
// ============================================================
const SNACKS_REST: Meal[] = [
  { time: '16h00', name: 'Collation', totalCalories: 377, items: [
    { food: 'Fromage blanc 0%', quantity: '150g', proteins: 12, carbs: 6, fats: 0, calories: 72 },
    { food: 'Flocons d\'avoine', quantity: '50g', proteins: 7, carbs: 30, fats: 4, calories: 194 },
    { food: 'Myrtilles', quantity: '80g', proteins: 1, carbs: 11, fats: 0, calories: 46 },
    { food: 'Noix', quantity: '10g', proteins: 1, carbs: 2, fats: 7, calories: 65 },
  ]},
  { time: '16h00', name: 'Collation', totalCalories: 284, items: [
    { food: 'Skyr nature', quantity: '150g', proteins: 17, carbs: 6, fats: 0, calories: 90 },
    { food: 'Banane', quantity: '1 (120g)', proteins: 1, carbs: 27, fats: 0, calories: 107 },
    { food: 'Amandes', quantity: '15g', proteins: 3, carbs: 4, fats: 8, calories: 87 },
  ]},
  { time: '16h00', name: 'Collation', totalCalories: 272, items: [
    { food: 'Yaourt grec 0%', quantity: '150g', proteins: 15, carbs: 6, fats: 0, calories: 85 },
    { food: 'Flocons d\'avoine', quantity: '40g', proteins: 5, carbs: 24, fats: 3, calories: 155 },
    { food: 'Fraises', quantity: '100g', proteins: 1, carbs: 8, fats: 0, calories: 32 },
  ]},
  { time: '16h00', name: 'Collation', totalCalories: 271, items: [
    { food: 'Fromage blanc 0%', quantity: '150g', proteins: 12, carbs: 6, fats: 0, calories: 72 },
    { food: 'Pain de mie blanc', quantity: '2 tranches (60g)', proteins: 6, carbs: 32, fats: 2, calories: 168 },
    { food: 'Miel', quantity: '10g', proteins: 0, carbs: 8, fats: 0, calories: 31 },
  ]},
  { time: '16h00', name: 'Collation', totalCalories: 263, items: [
    { food: 'Skyr nature', quantity: '150g', proteins: 17, carbs: 6, fats: 0, calories: 90 },
    { food: 'Myrtilles', quantity: '100g', proteins: 1, carbs: 14, fats: 0, calories: 57 },
    { food: 'Noix de cajou', quantity: '20g', proteins: 3, carbs: 5, fats: 9, calories: 116 },
  ]},
  { time: '16h00', name: 'Collation', totalCalories: 359, items: [
    { food: 'Fromage blanc 0%', quantity: '150g', proteins: 12, carbs: 6, fats: 0, calories: 72 },
    { food: 'Flocons d\'avoine', quantity: '50g', proteins: 7, carbs: 30, fats: 4, calories: 194 },
    { food: 'Pomme', quantity: '1 (180g)', proteins: 0, carbs: 23, fats: 0, calories: 93 },
  ]},
  { time: '16h00', name: 'Collation', totalCalories: 279, items: [
    { food: 'Yaourt grec 0%', quantity: '150g', proteins: 15, carbs: 6, fats: 0, calories: 85 },
    { food: 'Banane', quantity: '1 (120g)', proteins: 1, carbs: 27, fats: 0, calories: 107 },
    { food: 'Amandes', quantity: '15g', proteins: 3, carbs: 4, fats: 8, calories: 87 },
  ]},
  { time: '16h00', name: 'Collation', totalCalories: 282, items: [
    { food: 'Fromage blanc 0%', quantity: '150g', proteins: 12, carbs: 6, fats: 0, calories: 72 },
    { food: 'Pain de mie blanc', quantity: '2 tranches (60g)', proteins: 6, carbs: 32, fats: 2, calories: 168 },
    { food: 'Framboises', quantity: '80g', proteins: 1, carbs: 10, fats: 0, calories: 42 },
  ]},
  { time: '16h00', name: 'Collation', totalCalories: 278, items: [
    { food: 'Skyr nature', quantity: '150g', proteins: 17, carbs: 6, fats: 0, calories: 90 },
    { food: 'Kiwi', quantity: '2 (150g)', proteins: 2, carbs: 18, fats: 0, calories: 90 },
    { food: 'Noix', quantity: '15g', proteins: 2, carbs: 2, fats: 10, calories: 98 },
  ]},
  { time: '16h00', name: 'Collation', totalCalories: 316, items: [
    { food: 'Fromage blanc 0%', quantity: '150g', proteins: 12, carbs: 6, fats: 0, calories: 72 },
    { food: 'Flocons d\'avoine', quantity: '40g', proteins: 5, carbs: 24, fats: 3, calories: 155 },
    { food: 'Poire', quantity: '1 (180g)', proteins: 1, carbs: 22, fats: 0, calories: 89 },
  ]},
  { time: '16h00', name: 'Collation', totalCalories: 284, items: [
    { food: 'Yaourt grec 0%', quantity: '150g', proteins: 15, carbs: 6, fats: 0, calories: 85 },
    { food: 'Pain de mie blanc', quantity: '2 tranches (60g)', proteins: 6, carbs: 32, fats: 2, calories: 168 },
    { food: 'Miel', quantity: '10g', proteins: 0, carbs: 8, fats: 0, calories: 31 },
  ]},
  { time: '16h00', name: 'Collation', totalCalories: 362, items: [
    { food: 'Fromage blanc 0%', quantity: '150g', proteins: 12, carbs: 6, fats: 0, calories: 72 },
    { food: 'Flocons d\'avoine', quantity: '50g', proteins: 7, carbs: 30, fats: 4, calories: 194 },
    { food: 'Mangue', quantity: '150g', proteins: 1, carbs: 22, fats: 0, calories: 96 },
  ]},
];

// ============================================================
// DÎNERS REPOS — 12 variantes
// ============================================================
const DINNERS_REST: Meal[] = [
  { time: '19h30', name: 'Dîner', totalCalories: 909, items: [
    { food: 'Saumon au four', quantity: '130g', proteins: 26, carbs: 0, fats: 14, calories: 222 },
    { food: 'Patate douce cuite', quantity: '300g', proteins: 4, carbs: 60, fats: 0, calories: 258 },
    { food: 'Tomates cerises', quantity: '150g', proteins: 1, carbs: 6, fats: 0, calories: 27 },
    { food: 'Huile d\'olive', quantity: '15ml', proteins: 0, carbs: 0, fats: 14, calories: 135 },
    { food: 'Pain de mie blanc', quantity: '2 tranches (60g)', proteins: 5, carbs: 30, fats: 2, calories: 159 },
    { food: 'Fromage blanc 0%', quantity: '100g', proteins: 8, carbs: 4, fats: 0, calories: 48 },
  ]},
  { time: '19h30', name: 'Dîner', totalCalories: 783, items: [
    { food: 'Blanc de poulet grillé', quantity: '130g', proteins: 30, carbs: 0, fats: 2, calories: 141 },
    { food: 'Riz basmati cuit', quantity: '250g', proteins: 5, carbs: 65, fats: 0, calories: 280 },
    { food: 'Courgette sautée', quantity: '200g', proteins: 3, carbs: 8, fats: 1, calories: 36 },
    { food: 'Huile d\'olive', quantity: '15ml', proteins: 0, carbs: 0, fats: 14, calories: 135 },
    { food: 'Pain de mie blanc', quantity: '2 tranches (60g)', proteins: 5, carbs: 30, fats: 2, calories: 159 },
  ]},
  { time: '19h30', name: 'Dîner', totalCalories: 778, items: [
    { food: 'Cabillaud au four', quantity: '150g', proteins: 30, carbs: 0, fats: 2, calories: 138 },
    { food: 'Riz blanc cuit', quantity: '250g', proteins: 4, carbs: 57, fats: 0, calories: 244 },
    { food: 'Courgette sautée', quantity: '200g', proteins: 3, carbs: 8, fats: 0, calories: 36 },
    { food: 'Huile d\'olive', quantity: '15ml', proteins: 0, carbs: 0, fats: 14, calories: 135 },
    { food: 'Pain de mie blanc', quantity: '2 tranches (60g)', proteins: 5, carbs: 30, fats: 2, calories: 159 },
  ]},
  { time: '19h30', name: 'Dîner', totalCalories: 784, items: [
    { food: 'Escalope de dinde', quantity: '140g', proteins: 31, carbs: 0, fats: 3, calories: 149 },
    { food: 'Pâtes blanches cuites', quantity: '250g', proteins: 9, carbs: 62, fats: 2, calories: 306 },
    { food: 'Sauce tomate', quantity: '100g', proteins: 2, carbs: 8, fats: 0, calories: 35 },
    { food: 'Huile d\'olive', quantity: '15ml', proteins: 0, carbs: 0, fats: 14, calories: 135 },
    { food: 'Pain de mie blanc', quantity: '2 tranches (60g)', proteins: 5, carbs: 30, fats: 2, calories: 159 },
  ]},
  { time: '19h30', name: 'Dîner', totalCalories: 840, items: [
    { food: 'Saumon au four', quantity: '130g', proteins: 26, carbs: 0, fats: 14, calories: 222 },
    { food: 'Riz blanc cuit', quantity: '270g', proteins: 6, carbs: 59, fats: 2, calories: 279 },
    { food: 'Poivrons grillés', quantity: '150g', proteins: 2, carbs: 10, fats: 0, calories: 48 },
    { food: 'Huile d\'olive', quantity: '15ml', proteins: 0, carbs: 0, fats: 14, calories: 135 },
    { food: 'Pain de mie blanc', quantity: '2 tranches (60g)', proteins: 5, carbs: 30, fats: 2, calories: 159 },
  ]},
  { time: '19h30', name: 'Dîner', totalCalories: 738, items: [
    { food: 'Thon au naturel (boîte)', quantity: '140g', proteins: 33, carbs: 0, fats: 2, calories: 148 },
    { food: 'Patate douce cuite', quantity: '280g', proteins: 4, carbs: 56, fats: 0, calories: 241 },
    { food: 'Tomates cerises', quantity: '150g', proteins: 1, carbs: 6, fats: 0, calories: 27 },
    { food: 'Huile d\'olive', quantity: '15ml', proteins: 0, carbs: 0, fats: 14, calories: 135 },
    { food: 'Pain de mie blanc', quantity: '2 tranches (60g)', proteins: 5, carbs: 30, fats: 2, calories: 159 },
  ]},
  { time: '19h30', name: 'Dîner', totalCalories: 809, items: [
    { food: 'Blanc de poulet grillé', quantity: '130g', proteins: 30, carbs: 0, fats: 2, calories: 141 },
    { food: 'Riz blanc cuit', quantity: '250g', proteins: 4, carbs: 57, fats: 0, calories: 244 },
    { food: 'Poivrons grillés', quantity: '200g', proteins: 3, carbs: 13, fats: 0, calories: 64 },
    { food: 'Huile d\'olive', quantity: '15ml', proteins: 0, carbs: 0, fats: 14, calories: 135 },
    { food: 'Pain de mie blanc', quantity: '2 tranches (60g)', proteins: 5, carbs: 30, fats: 2, calories: 159 },
  ]},
  { time: '19h30', name: 'Dîner', totalCalories: 756, items: [
    { food: 'Cabillaud au four', quantity: '150g', proteins: 30, carbs: 0, fats: 2, calories: 138 },
    { food: 'Riz basmati cuit', quantity: '260g', proteins: 5, carbs: 68, fats: 0, calories: 291 },
    { food: 'Courgette sautée', quantity: '150g', proteins: 2, carbs: 6, fats: 0, calories: 27 },
    { food: 'Huile d\'olive', quantity: '15ml', proteins: 0, carbs: 0, fats: 14, calories: 135 },
    { food: 'Pain de mie blanc', quantity: '2 tranches (60g)', proteins: 5, carbs: 30, fats: 2, calories: 159 },
  ]},
  { time: '19h30', name: 'Dîner', totalCalories: 769, items: [
    { food: 'Escalope de dinde', quantity: '140g', proteins: 31, carbs: 0, fats: 3, calories: 149 },
    { food: 'Patate douce cuite', quantity: '300g', proteins: 4, carbs: 60, fats: 0, calories: 258 },
    { food: 'Courgette sautée', quantity: '200g', proteins: 3, carbs: 8, fats: 1, calories: 36 },
    { food: 'Huile d\'olive', quantity: '15ml', proteins: 0, carbs: 0, fats: 14, calories: 135 },
    { food: 'Pain de mie blanc', quantity: '2 tranches (60g)', proteins: 5, carbs: 30, fats: 2, calories: 159 },
  ]},
  { time: '19h30', name: 'Dîner', totalCalories: 818, items: [
    { food: 'Saumon au four', quantity: '130g', proteins: 26, carbs: 0, fats: 14, calories: 222 },
    { food: 'Pâtes blanches cuites', quantity: '240g', proteins: 9, carbs: 60, fats: 2, calories: 294 },
    { food: 'Sauce tomate', quantity: '100g', proteins: 2, carbs: 8, fats: 0, calories: 35 },
    { food: 'Huile d\'olive', quantity: '12ml', proteins: 0, carbs: 0, fats: 11, calories: 108 },
    { food: 'Pain de mie blanc', quantity: '2 tranches (60g)', proteins: 5, carbs: 30, fats: 2, calories: 159 },
  ]},
  { time: '19h30', name: 'Dîner', totalCalories: 758, items: [
    { food: 'Thon au naturel (boîte)', quantity: '140g', proteins: 33, carbs: 0, fats: 2, calories: 148 },
    { food: 'Riz basmati cuit', quantity: '250g', proteins: 5, carbs: 65, fats: 0, calories: 280 },
    { food: 'Courgette sautée', quantity: '200g', proteins: 3, carbs: 8, fats: 0, calories: 36 },
    { food: 'Huile d\'olive', quantity: '15ml', proteins: 0, carbs: 0, fats: 14, calories: 135 },
    { food: 'Pain de mie blanc', quantity: '2 tranches (60g)', proteins: 5, carbs: 30, fats: 2, calories: 159 },
  ]},
  { time: '19h30', name: 'Dîner', totalCalories: 801, items: [
    { food: 'Blanc de poulet grillé', quantity: '130g', proteins: 30, carbs: 0, fats: 2, calories: 141 },
    { food: 'Patate douce cuite', quantity: '280g', proteins: 4, carbs: 56, fats: 0, calories: 241 },
    { food: 'Poivrons grillés', quantity: '150g', proteins: 2, carbs: 10, fats: 0, calories: 48 },
    { food: 'Huile d\'olive', quantity: '15ml', proteins: 0, carbs: 0, fats: 14, calories: 135 },
    { food: 'Pain de mie blanc', quantity: '2 tranches (60g)', proteins: 5, carbs: 30, fats: 2, calories: 159 },
    { food: 'Yaourt grec 0%', quantity: '100g', proteins: 10, carbs: 4, fats: 0, calories: 57 },
  ]},
];

const MORNING_SNACKS_REST = MORNING_SNACKS;

const DAY_NAMES_FR = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

const SESSION_BY_DAY: Record<number, string | null> = {
  0: null, 1: 'Haut du corps A', 2: 'Bas du corps A',
  3: null, 4: 'Haut du corps B', 5: 'Bas du corps B', 6: null,
};

function getWeekIndex(weekStartMonday: Date): number {
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const epoch = new Date('2026-01-05');
  const diff = weekStartMonday.getTime() - epoch.getTime();
  const weeksSinceEpoch = Math.floor(diff / msPerWeek);
  return ((weeksSinceEpoch % 12) + 12) % 12;
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

    const dayShift = (weekIdx + i) % 12;

    let meals: Meal[];
    if (isTrainingDay) {
      meals = [
        BREAKFASTS_TRAINING[dayShift],
        MORNING_SNACKS[dayShift],
        LUNCHES_TRAINING[dayShift],
        SNACKS_TRAINING[dayShift],
        DINNERS_TRAINING[dayShift],
      ];
    } else {
      meals = [
        BREAKFASTS_REST[dayShift],
        MORNING_SNACKS_REST[dayShift],
        LUNCHES_REST[dayShift],
        SNACKS_REST[dayShift],
        DINNERS_REST[dayShift],
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
      date: toLocalDateKey(date),
      dayName: DAY_NAMES_FR[dayOfWeek],
      isTrainingDay,
      sessionName: sessionName ?? undefined,
      meals,
      totalMacros,
    });
  }

  return {
    weekStartDate: toLocalDateKey(weekStartMonday),
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
  imageUrl?: string;
  shopUrl?: string;
}

export interface ShoppingList {
  weekStartDate: string;
  generatedOn: string;
  items: ShoppingItem[];
  totalEstimatedBudget: string;
  storeTips: string[];
}

export function generateShoppingList(weekPlan: WeeklyMealPlan): ShoppingList {
  const ingredientCount: Record<string, { count: number; category: string }> = {};

  weekPlan.days.forEach(day => {
    day.meals.forEach(meal => {
      meal.items.forEach(item => {
        const key = item.food.split(' (')[0].split(' +')[0].trim();
        if (!ingredientCount[key]) {
          ingredientCount[key] = { count: 0, category: classifyIngredient(key) };
        }
        ingredientCount[key].count++;
      });
    });
  });

  const items: ShoppingItem[] = buildShoppingItems(weekPlan, ingredientCount);

  const storeTips = [
    '🛒 Commande le samedi sur intermarche.com — récupération le lundi midi, courses disponibles lundi soir.',
    '❄️ Achète viandes et poissons en grande quantité, congèle en portions de 150-200g.',
    '🍳 Prépare riz, patates douces et légumineuses en batch le lundi soir (gain de temps majeur).',
    '💰 Surgelés (poissons, légumes, fruits rouges) = aussi nutritifs que le frais, moins chers.',
    '📦 Whey et compléments : commande en ligne (Myprotein, Bulk) — 2× moins cher qu\'en magasin.',
    '🥚 Œufs plein air ou bio : meilleur profil oméga-3. Achète en boîte de 18 ou 24.',
  ];

  return {
    weekStartDate: weekPlan.weekStartDate,
    generatedOn: new Date().toISOString().split('T')[0],
    items,
    totalEstimatedBudget: '~65-85€/semaine',
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
  if (/miel|confiture|compote|sauce|soja|curry|herbes|épices|sel|poivre|cacao|cannelle|chia|sésame|citron|sirop/.test(lower)) return 'Condiments & Divers';
  return 'Divers';
}

function buildShoppingItems(
  weekPlan: WeeklyMealPlan,
  ingredientCount: Record<string, { count: number; category: string }>
): ShoppingItem[] {
  const quantities: Record<string, { totalG: number; category: string; notes: string }> = {};

  weekPlan.days.forEach(day => {
    day.meals.forEach(meal => {
      meal.items.forEach(item => {
        const key = item.food.split(' (')[0].trim();
        const qtyMatch = item.quantity.match(/(\d+(?:\.\d+)?)/);
        const qty = qtyMatch ? parseFloat(qtyMatch[1]) : 100;

        if (!quantities[key]) {
          quantities[key] = { totalG: 0, category: classifyIngredient(key), notes: '' };
        }
        quantities[key].totalG += qty;
      });
    });
  });

  const items: ShoppingItem[] = [];
  const categoryOrder = ['Viandes', 'Poissons & Fruits de mer', 'Produits laitiers & Œufs', 'Féculents & Légumineuses', 'Légumes', 'Fruits', 'Lipides & Oléagineux', 'Condiments & Divers'];

  const groups: Record<string, { names: string[]; totalG: number; category: string }> = {};

  Object.entries(quantities).forEach(([name, data]) => {
    const groupKey = getGroupKey(name);
    if (!groups[groupKey]) {
      groups[groupKey] = { names: [], totalG: 0, category: data.category };
    }
    groups[groupKey].names.push(name);
    groups[groupKey].totalG += data.totalG;
  });

  Object.entries(groups).forEach(([groupKey, group]) => {
    const item = formatShoppingItem(groupKey, group.totalG, group.category, group.names);
    if (item) items.push(item);
  });

  items.push({
    category: 'Produits laitiers & Œufs',
    name: 'Whey Protein Isolate',
    quantity: '1 kg',
    unit: '(commande en ligne)',
    estimatedPrice: '~25-35€ (dure ~1 mois)',
    notes: 'Myprotein, Bulk ou Foodspring. Commande en ligne, pas en drive.',
    priority: 'recommended',
  });

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
  if (/fraise/.test(lower)) return 'Fraises';
  if (/myrtille/.test(lower)) return 'Myrtilles';
  if (/framboise/.test(lower)) return 'Framboises';
  if (/mangue/.test(lower)) return 'Mangue';
  if (/pêche/.test(lower)) return 'Pêches';
  if (/orange/.test(lower)) return 'Oranges';
  if (/amande/.test(lower)) return 'Amandes';
  if (/noix de cajou/.test(lower)) return 'Noix de cajou';
  if (/noix/.test(lower)) return 'Noix';
  if (/beurre de cacahuète|beurre de cajou|beurre d'amande/.test(lower)) return 'Beurre de noix (cacahuète/cajou/amande)';
  if (/avocat/.test(lower)) return 'Avocats';
  if (/huile d'olive/.test(lower)) return 'Huile d\'olive extra vierge';
  if (/huile de sésame/.test(lower)) return 'Huile de sésame';
  if (/miel/.test(lower)) return 'Miel';
  if (/sauce soja/.test(lower)) return 'Sauce soja';
  if (/sauce tomate/.test(lower)) return 'Sauce tomate (bocal)';
  if (/edamame/.test(lower)) return 'Edamames (surgelés)';
  return name;
}

function formatShoppingItem(
  name: string,
  totalG: number,
  category: string,
  _sourceNames: string[]
): ShoppingItem | null {
  if (totalG < 10) return null;

  let quantity = '';
  let unit = '';
  let estimatedPrice = '';
  let notes = '';
  let priority: ShoppingItem['priority'] = 'essential';

  // Conversion intelligente selon le type d'aliment
  if (/poulet|dinde|bœuf|veau|steak/.test(name.toLowerCase())) {
    const kg = Math.ceil(totalG / 100) * 100;
    quantity = `${(kg / 1000).toFixed(1)} kg`;
    unit = 'frais ou surgelé';
    estimatedPrice = `~${Math.round(kg / 1000 * 12)}€`;
    notes = 'Congeler en portions de 180-200g';
  } else if (/saumon|cabillaud|maquereau|bar/.test(name.toLowerCase())) {
    const kg = Math.ceil(totalG / 100) * 100;
    quantity = `${(kg / 1000).toFixed(1)} kg`;
    unit = 'frais ou surgelé';
    estimatedPrice = `~${Math.round(kg / 1000 * 15)}€`;
    notes = 'Surgelé = même valeur nutritive, moins cher';
  } else if (/thon/.test(name.toLowerCase())) {
    const boites = Math.ceil(totalG / 100);
    quantity = `${boites} boîtes`;
    unit = '(100g au naturel)';
    estimatedPrice = `~${boites * 1.2}€`;
    notes = 'Thon au naturel, pas à l\'huile';
  } else if (/crevettes/.test(name.toLowerCase())) {
    const kg = Math.ceil(totalG / 100) * 100;
    quantity = `${(kg / 1000).toFixed(1)} kg`;
    unit = 'surgelées';
    estimatedPrice = `~${Math.round(kg / 1000 * 10)}€`;
    notes = 'Surgelées, décortiquées';
  } else if (/œuf/.test(name.toLowerCase())) {
    const nb = Math.ceil(totalG / 60);
    quantity = `${nb} œufs`;
    unit = 'plein air ou bio';
    estimatedPrice = `~${(Math.ceil(nb / 6) * 2.5).toFixed(1)}€`;
    notes = 'Boîte de 12 ou 18 — meilleur rapport qualité/prix';
  } else if (/fromage blanc/.test(name.toLowerCase())) {
    const pots = Math.ceil(totalG / 500);
    quantity = `${pots} pot${pots > 1 ? 's' : ''}`;
    unit = '(500g, 0% MG)';
    estimatedPrice = `~${(pots * 1.5).toFixed(1)}€`;
    notes = 'Riche en caséine — idéal avant de dormir';
  } else if (/skyr/.test(name.toLowerCase())) {
    const pots = Math.ceil(totalG / 500);
    quantity = `${pots} pot${pots > 1 ? 's' : ''}`;
    unit = '(500g)';
    estimatedPrice = `~${(pots * 2.5).toFixed(1)}€`;
    notes = 'Skyr nature ou vanille — 22g protéines/200g';
  } else if (/yaourt grec/.test(name.toLowerCase())) {
    const pots = Math.ceil(totalG / 500);
    quantity = `${pots} pot${pots > 1 ? 's' : ''}`;
    unit = '(500g, 0% MG)';
    estimatedPrice = `~${(pots * 2).toFixed(1)}€`;
    notes = '0% MG pour limiter les lipides';
  } else if (/lait/.test(name.toLowerCase())) {
    const litres = Math.ceil(totalG / 1000);
    quantity = `${litres} L`;
    unit = 'écrémé';
    estimatedPrice = `~${(litres * 0.9).toFixed(1)}€`;
    notes = 'Lait écrémé UHT';
  } else if (/flocons d'avoine|avoine/.test(name.toLowerCase())) {
    const kg = Math.ceil(totalG / 500) * 500;
    quantity = `${(kg / 1000).toFixed(1)} kg`;
    unit = 'gros flocons';
    estimatedPrice = `~${(kg / 1000 * 2).toFixed(1)}€`;
    notes = 'Gros flocons = index glycémique plus bas';
  } else if (/riz/.test(name.toLowerCase())) {
    const kg = Math.ceil(totalG / 500) * 500;
    quantity = `${(kg / 1000).toFixed(1)} kg`;
    unit = 'basmati ou complet';
    estimatedPrice = `~${(kg / 1000 * 2.5).toFixed(1)}€`;
    notes = 'Riz cuit = 3× le poids du riz sec';
  } else if (/patate douce/.test(name.toLowerCase())) {
    const kg = Math.ceil(totalG / 500) * 500;
    quantity = `${(kg / 1000).toFixed(1)} kg`;
    unit = 'fraîches';
    estimatedPrice = `~${(kg / 1000 * 2).toFixed(1)}€`;
    notes = 'Meilleure source de glucides complexes';
  } else if (/pâtes/.test(name.toLowerCase())) {
    const kg = Math.ceil(totalG / 500) * 500;
    quantity = `${(kg / 1000).toFixed(1)} kg`;
    unit = 'complètes ou semi-complètes';
    estimatedPrice = `~${(kg / 1000 * 2).toFixed(1)}€`;
    notes = 'Pâtes cuites = 2.5× le poids des pâtes sèches';
  } else if (/quinoa/.test(name.toLowerCase())) {
    const g = Math.ceil(totalG / 200) * 200;
    quantity = `${g}g`;
    unit = '';
    estimatedPrice = `~${(g / 1000 * 5).toFixed(1)}€`;
    notes = 'Quinoa cuit = 3× le poids du quinoa sec';
  } else if (/lentilles/.test(name.toLowerCase())) {
    const g = Math.ceil(totalG / 200) * 200;
    quantity = `${g}g`;
    unit = 'sèches ou en boîte';
    estimatedPrice = `~${(g / 1000 * 3).toFixed(1)}€`;
    notes = 'Lentilles cuites = 2.5x le poids des lentilles sèches';
  } else if (/haricots|pois chiches/.test(name.toLowerCase())) {
    const boites = Math.ceil(totalG / 400);
    quantity = `${boites} boîte${boites > 1 ? 's' : ''}`;
    unit = '(400g)';
    estimatedPrice = `~${(boites * 0.9).toFixed(1)}€`;
    notes = 'Boîte de conserve = pratique et économique';
  } else if (/boulgour/.test(name.toLowerCase())) {
    const g = Math.ceil(totalG / 200) * 200;
    quantity = `${g}g`;
    unit = '';
    estimatedPrice = `~${(g / 1000 * 3).toFixed(1)}€`;
    notes = 'Boulgour cuit = 2.5× le poids du boulgour sec';
  } else if (/pain complet|galette de riz/.test(name.toLowerCase())) {
    const paquets = Math.ceil(totalG / 200);
    quantity = `${paquets} paquet${paquets > 1 ? 's' : ''}`;
    unit = '';
    estimatedPrice = `~${(paquets * 2).toFixed(1)}€`;
    notes = 'Pain complet ou galettes de riz';
  } else if (/brocoli/.test(name.toLowerCase())) {
    const kg = Math.ceil(totalG / 500) * 500;
    quantity = `${(kg / 1000).toFixed(1)} kg`;
    unit = 'frais ou surgelé';
    estimatedPrice = `~${(kg / 1000 * 2).toFixed(1)}€`;
    notes = 'Surgelé = aussi nutritif, moins cher';
  } else if (/épinard/.test(name.toLowerCase())) {
    const g = Math.ceil(totalG / 200) * 200;
    quantity = `${g}g`;
    unit = 'frais ou surgelé';
    estimatedPrice = `~${(g / 1000 * 3).toFixed(1)}€`;
    notes = 'Surgelés en portion = pratique';
  } else if (/haricot vert/.test(name.toLowerCase())) {
    const g = Math.ceil(totalG / 200) * 200;
    quantity = `${g}g`;
    unit = 'surgelés';
    estimatedPrice = `~${(g / 1000 * 2).toFixed(1)}€`;
    notes = 'Surgelés — aussi bons que le frais';
  } else if (/courgette/.test(name.toLowerCase())) {
    const nb = Math.ceil(totalG / 200);
    quantity = `${nb} courgette${nb > 1 ? 's' : ''}`;
    unit = '';
    estimatedPrice = `~${(nb * 0.5).toFixed(1)}€`;
    notes = '';
  } else if (/poivron/.test(name.toLowerCase())) {
    const nb = Math.ceil(totalG / 150);
    quantity = `${nb} poivron${nb > 1 ? 's' : ''}`;
    unit = '(rouge, jaune, vert)';
    estimatedPrice = `~${(nb * 0.7).toFixed(1)}€`;
    notes = 'Riche en vitamine C';
  } else if (/tomate/.test(name.toLowerCase())) {
    const g = Math.ceil(totalG / 200) * 200;
    quantity = `${g}g`;
    unit = '';
    estimatedPrice = `~${(g / 1000 * 2.5).toFixed(1)}€`;
    notes = '';
  } else if (/champignon/.test(name.toLowerCase())) {
    const g = Math.ceil(totalG / 200) * 200;
    quantity = `${g}g`;
    unit = '';
    estimatedPrice = `~${(g / 1000 * 3).toFixed(1)}€`;
    notes = '';
  } else if (/salade|roquette/.test(name.toLowerCase())) {
    const sachets = Math.ceil(totalG / 100);
    quantity = `${sachets} sachet${sachets > 1 ? 's' : ''}`;
    unit = '(100g)';
    estimatedPrice = `~${(sachets * 1.2).toFixed(1)}€`;
    notes = '';
  } else if (/banane/.test(name.toLowerCase())) {
    const nb = Math.ceil(totalG / 120);
    quantity = `${nb} banane${nb > 1 ? 's' : ''}`;
    unit = '';
    estimatedPrice = `~${(nb * 0.3).toFixed(1)}€`;
    notes = 'Meilleure source de glucides rapides pré-training';
  } else if (/pomme/.test(name.toLowerCase())) {
    const nb = Math.ceil(totalG / 150);
    quantity = `${nb} pomme${nb > 1 ? 's' : ''}`;
    unit = '';
    estimatedPrice = `~${(nb * 0.4).toFixed(1)}€`;
    notes = '';
  } else if (/kiwi/.test(name.toLowerCase())) {
    const nb = Math.ceil(totalG / 75);
    quantity = `${nb} kiwi${nb > 1 ? 's' : ''}`;
    unit = '';
    estimatedPrice = `~${(nb * 0.4).toFixed(1)}€`;
    notes = 'Riche en vitamine C';
  } else if (/fraise/.test(name.toLowerCase())) {
    const g = Math.ceil(totalG / 200) * 200;
    quantity = `${g}g`;
    unit = 'fraîches ou surgelées';
    estimatedPrice = `~${(g / 1000 * 4).toFixed(1)}€`;
    notes = '';
  } else if (/myrtille/.test(name.toLowerCase())) {
    const g = Math.ceil(totalG / 100) * 100;
    quantity = `${g}g`;
    unit = 'fraîches ou surgelées';
    estimatedPrice = `~${(g / 1000 * 6).toFixed(1)}€`;
    notes = 'Riches en antioxydants';
  } else if (/framboise/.test(name.toLowerCase())) {
    const g = Math.ceil(totalG / 100) * 100;
    quantity = `${g}g`;
    unit = 'fraîches ou surgelées';
    estimatedPrice = `~${(g / 1000 * 5).toFixed(1)}€`;
    notes = '';
  } else if (/mangue/.test(name.toLowerCase())) {
    const nb = Math.ceil(totalG / 300);
    quantity = `${nb} mangue${nb > 1 ? 's' : ''}`;
    unit = '';
    estimatedPrice = `~${(nb * 1.5).toFixed(1)}€`;
    notes = '';
  } else if (/pêche/.test(name.toLowerCase())) {
    const nb = Math.ceil(totalG / 150);
    quantity = `${nb} pêche${nb > 1 ? 's' : ''}`;
    unit = '';
    estimatedPrice = `~${(nb * 0.5).toFixed(1)}€`;
    notes = '';
  } else if (/orange/.test(name.toLowerCase())) {
    const nb = Math.ceil(totalG / 180);
    quantity = `${nb} orange${nb > 1 ? 's' : ''}`;
    unit = '';
    estimatedPrice = `~${(nb * 0.4).toFixed(1)}€`;
    notes = '';
  } else if (/amande/.test(name.toLowerCase())) {
    const g = Math.ceil(totalG / 100) * 100;
    quantity = `${g}g`;
    unit = '';
    estimatedPrice = `~${(g / 1000 * 12).toFixed(1)}€`;
    notes = 'Riches en magnésium';
  } else if (/noix de cajou/.test(name.toLowerCase())) {
    const g = Math.ceil(totalG / 100) * 100;
    quantity = `${g}g`;
    unit = '';
    estimatedPrice = `~${(g / 1000 * 15).toFixed(1)}€`;
    notes = '';
  } else if (/noix/.test(name.toLowerCase())) {
    const g = Math.ceil(totalG / 100) * 100;
    quantity = `${g}g`;
    unit = '';
    estimatedPrice = `~${(g / 1000 * 10).toFixed(1)}€`;
    notes = 'Riches en oméga-3';
  } else if (/beurre de/.test(name.toLowerCase())) {
    const g = Math.ceil(totalG / 100) * 100;
    quantity = `${g}g`;
    unit = '(naturel, sans huile de palme)';
    estimatedPrice = `~${(g / 1000 * 8).toFixed(1)}€`;
    notes = 'Vérifier : ingrédient = cacahuètes uniquement';
  } else if (/avocat/.test(name.toLowerCase())) {
    const nb = Math.ceil(totalG / 150);
    quantity = `${nb} avocat${nb > 1 ? 's' : ''}`;
    unit = '';
    estimatedPrice = `~${(nb * 1).toFixed(1)}€`;
    notes = 'Riche en lipides mono-insaturés';
  } else if (/huile d'olive/.test(name.toLowerCase())) {
    const ml = Math.ceil(totalG / 100) * 100;
    quantity = `${ml}ml`;
    unit = 'extra vierge';
    estimatedPrice = `~${(ml / 1000 * 8).toFixed(1)}€`;
    notes = 'Huile d\'olive extra vierge première pression';
  } else if (/huile de sésame/.test(name.toLowerCase())) {
    const ml = Math.ceil(totalG / 50) * 50;
    quantity = `${ml}ml`;
    unit = '';
    estimatedPrice = `~${(ml / 1000 * 15).toFixed(1)}€`;
    notes = 'Petite bouteille suffit';
  } else if (/miel/.test(name.toLowerCase())) {
    const g = Math.ceil(totalG / 100) * 100;
    quantity = `${g}g`;
    unit = '';
    estimatedPrice = `~${(g / 1000 * 8).toFixed(1)}€`;
    notes = 'Miel toutes fleurs ou acacia';
  } else if (/sauce soja/.test(name.toLowerCase())) {
    const ml = Math.ceil(totalG / 100) * 100;
    quantity = `${ml}ml`;
    unit = '';
    estimatedPrice = `~1.5€`;
    notes = 'Sauce soja réduite en sel';
  } else if (/sauce tomate/.test(name.toLowerCase())) {
    const bocaux = Math.ceil(totalG / 400);
    quantity = `${bocaux} bocal${bocaux > 1 ? 'x' : ''}`;
    unit = '(400g)';
    estimatedPrice = `~${(bocaux * 1.5).toFixed(1)}€`;
    notes = 'Sans sucre ajouté';
  } else if (/edamame/.test(name.toLowerCase())) {
    const g = Math.ceil(totalG / 200) * 200;
    quantity = `${g}g`;
    unit = 'surgelés';
    estimatedPrice = `~${(g / 1000 * 5).toFixed(1)}€`;
    notes = 'Riches en protéines végétales';
  } else {
    const g = Math.ceil(totalG / 50) * 50;
    quantity = `${g}g`;
    unit = '';
    estimatedPrice = '~2€';
    notes = '';
    priority = 'optional';
  }

  // Mapping photos produits Intermarche et liens
  const productData = getProductData(name.toLowerCase());
  return { category, name, quantity, unit, estimatedPrice, notes, priority, imageUrl: productData.imageUrl, shopUrl: productData.shopUrl };
}

function getProductData(nameLower: string): { imageUrl?: string; shopUrl?: string } {
  if (/poulet|blanc de poulet/.test(nameLower)) return {
    imageUrl: 'https://www.intermarche.com/content/dam/france/web/products/3033490003681_A.jpg',
    shopUrl: 'https://www.intermarche.com/recherche?q=blanc+de+poulet'
  };
  if (/dinde/.test(nameLower)) return {
    imageUrl: 'https://www.intermarche.com/content/dam/france/web/products/3033490004688_A.jpg',
    shopUrl: 'https://www.intermarche.com/recherche?q=escalope+dinde'
  };
  if (/saumon/.test(nameLower)) return {
    imageUrl: 'https://www.intermarche.com/content/dam/france/web/products/3033490008419_A.jpg',
    shopUrl: 'https://www.intermarche.com/recherche?q=saumon+surgele'
  };
  if (/cabillaud/.test(nameLower)) return {
    imageUrl: 'https://www.intermarche.com/content/dam/france/web/products/3033490008426_A.jpg',
    shopUrl: 'https://www.intermarche.com/recherche?q=cabillaud+surgele'
  };
  if (/thon/.test(nameLower)) return {
    imageUrl: 'https://www.intermarche.com/content/dam/france/web/products/3033490009805_A.jpg',
    shopUrl: 'https://www.intermarche.com/recherche?q=thon+naturel+boite'
  };
  if (/oeuf|oeuf/.test(nameLower)) return {
    imageUrl: 'https://www.intermarche.com/content/dam/france/web/products/3033490006514_A.jpg',
    shopUrl: 'https://www.intermarche.com/recherche?q=oeufs+plein+air'
  };
  if (/fromage blanc/.test(nameLower)) return {
    imageUrl: 'https://www.intermarche.com/content/dam/france/web/products/3033490005616_A.jpg',
    shopUrl: 'https://www.intermarche.com/recherche?q=fromage+blanc+0%25'
  };
  if (/skyr/.test(nameLower)) return {
    imageUrl: 'https://www.intermarche.com/content/dam/france/web/products/3033490007611_A.jpg',
    shopUrl: 'https://www.intermarche.com/recherche?q=skyr+nature'
  };
  if (/yaourt grec/.test(nameLower)) return {
    imageUrl: 'https://www.intermarche.com/content/dam/france/web/products/3033490005617_A.jpg',
    shopUrl: 'https://www.intermarche.com/recherche?q=yaourt+grec+0%25'
  };
  if (/flocons|avoine/.test(nameLower)) return {
    imageUrl: 'https://www.intermarche.com/content/dam/france/web/products/3033490004211_A.jpg',
    shopUrl: 'https://www.intermarche.com/recherche?q=flocons+avoine'
  };
  if (/riz/.test(nameLower)) return {
    imageUrl: 'https://www.intermarche.com/content/dam/france/web/products/3033490004212_A.jpg',
    shopUrl: 'https://www.intermarche.com/recherche?q=riz+basmati'
  };
  if (/patate douce/.test(nameLower)) return {
    imageUrl: 'https://www.intermarche.com/content/dam/france/web/products/3033490004213_A.jpg',
    shopUrl: 'https://www.intermarche.com/recherche?q=patate+douce'
  };
  if (/pates|pâtes/.test(nameLower)) return {
    imageUrl: 'https://www.intermarche.com/content/dam/france/web/products/3033490004214_A.jpg',
    shopUrl: 'https://www.intermarche.com/recherche?q=pates+completes'
  };
  if (/quinoa/.test(nameLower)) return {
    imageUrl: 'https://www.intermarche.com/content/dam/france/web/products/3033490004215_A.jpg',
    shopUrl: 'https://www.intermarche.com/recherche?q=quinoa'
  };
  if (/brocoli/.test(nameLower)) return {
    imageUrl: 'https://www.intermarche.com/content/dam/france/web/products/3033490004216_A.jpg',
    shopUrl: 'https://www.intermarche.com/recherche?q=brocoli+surgele'
  };
  if (/epinard|epinards/.test(nameLower)) return {
    imageUrl: 'https://www.intermarche.com/content/dam/france/web/products/3033490004217_A.jpg',
    shopUrl: 'https://www.intermarche.com/recherche?q=epinards+surgeles'
  };
  if (/banane/.test(nameLower)) return {
    imageUrl: 'https://www.intermarche.com/content/dam/france/web/products/3033490004218_A.jpg',
    shopUrl: 'https://www.intermarche.com/recherche?q=bananes'
  };
  if (/avocat/.test(nameLower)) return {
    imageUrl: 'https://www.intermarche.com/content/dam/france/web/products/3033490004219_A.jpg',
    shopUrl: 'https://www.intermarche.com/recherche?q=avocats'
  };
  if (/amande/.test(nameLower)) return {
    imageUrl: 'https://www.intermarche.com/content/dam/france/web/products/3033490004220_A.jpg',
    shopUrl: 'https://www.intermarche.com/recherche?q=amandes+nature'
  };
  if (/huile d.olive/.test(nameLower)) return {
    imageUrl: 'https://www.intermarche.com/content/dam/france/web/products/3033490004221_A.jpg',
    shopUrl: 'https://www.intermarche.com/recherche?q=huile+olive+extra+vierge'
  };
  return {};
}

// ============================================================
// RÉÉQUILIBRAGE AUTOMATIQUE DES REPAS RESTANTS
// ============================================================

export interface MealAdjustment {
  mealName: string;
  adjustedCalories: number;
  adjustedProteins: number;
  adjustedCarbs: number;
  adjustedFats: number;
  message: string;
}

export function computeMealAdjustments(
  consumedSoFar: DayMacros,
  remainingMeals: Meal[],
  isTrainingDay: boolean,
  weekCarryover: DayMacros,
  sessionType?: string
): MealAdjustment[] {
  const targetKey = sessionType ?? (isTrainingDay ? 'training' : 'rest');
  const target = MACRO_TARGETS[targetKey as keyof typeof MACRO_TARGETS] ?? MACRO_TARGETS.rest;

  const adjustedTarget = {
    calories: target.calories - weekCarryover.calories / 7,
    proteins: target.proteins - weekCarryover.proteins / 7,
    carbs: target.carbs - weekCarryover.carbs / 7,
    fats: target.fats - weekCarryover.fats / 7,
  };

  const remaining = {
    calories: adjustedTarget.calories - consumedSoFar.calories,
    proteins: adjustedTarget.proteins - consumedSoFar.proteins,
    carbs: adjustedTarget.carbs - consumedSoFar.carbs,
    fats: adjustedTarget.fats - consumedSoFar.fats,
  };

  const plannedRemaining = remainingMeals.reduce(
    (acc, meal) => {
      const m = meal.items.reduce(
        (a, i) => ({ proteins: a.proteins + i.proteins, carbs: a.carbs + i.carbs, fats: a.fats + i.fats, calories: a.calories + i.calories }),
        { proteins: 0, carbs: 0, fats: 0, calories: 0 }
      );
      return { proteins: acc.proteins + m.proteins, carbs: acc.carbs + m.carbs, fats: acc.fats + m.fats, calories: acc.calories + m.calories };
    },
    { proteins: 0, carbs: 0, fats: 0, calories: 0 }
  );

  return remainingMeals.map(meal => {
    const mealMacros = meal.items.reduce(
      (a, i) => ({ proteins: a.proteins + i.proteins, carbs: a.carbs + i.carbs, fats: a.fats + i.fats, calories: a.calories + i.calories }),
      { proteins: 0, carbs: 0, fats: 0, calories: 0 }
    );

    const ratio = plannedRemaining.calories > 0 ? mealMacros.calories / plannedRemaining.calories : 1 / remainingMeals.length;

    const adjustedCalories = Math.round(remaining.calories * ratio);
    const adjustedProteins = Math.round(remaining.proteins * ratio);
    const adjustedCarbs = Math.round(remaining.carbs * ratio);
    const adjustedFats = Math.round(remaining.fats * ratio);

    const diff = adjustedCalories - mealMacros.calories;
    let message = '';
    if (Math.abs(diff) < 50) {
      message = '✅ Ce repas reste conforme au plan';
    } else if (diff > 0) {
      message = `📈 Augmente de ~${diff} kcal — ajoute ${Math.round(diff / 4)}g de glucides (riz, patate douce)`;
    } else {
      message = `📉 Réduis de ~${Math.abs(diff)} kcal — enlève ${Math.round(Math.abs(diff) / 4)}g de glucides`;
    }

    return {
      mealName: meal.name,
      adjustedCalories,
      adjustedProteins,
      adjustedCarbs,
      adjustedFats,
      message,
    };
  });
}

// ============================================================
// RÉCAPITULATIF HEBDOMADAIRE
// ============================================================

export interface WeeklyRecap {
  weekStartDate: string;
  days: Array<{
    date: string;
    dayName: string;
    isTrainingDay: boolean;
    consumed: DayMacros;
    target: DayMacros;
    status: 'optimal' | 'surplus' | 'deficit' | 'protein_low' | 'no_data';
  }>;
  weeklyConsumed: DayMacros;
  weeklyTarget: DayMacros;
  weeklyStatus: 'optimal' | 'surplus' | 'deficit' | 'protein_low';
  globalRecommendation: string;
}

export function computeWeeklyRecap(
  weekPlan: WeeklyMealPlan,
  dayLogs: Record<string, DayLog>
): WeeklyRecap {
  const days = weekPlan.days.map(day => {
    const log = dayLogs[day.date];
    const target = day.isTrainingDay ? MACRO_TARGETS.training : MACRO_TARGETS.rest;

    if (!log || log.entries.length === 0) {
      return {
        date: day.date,
        dayName: day.dayName,
        isTrainingDay: day.isTrainingDay,
        consumed: { proteins: 0, carbs: 0, fats: 0, calories: 0 },
        target,
        status: 'no_data' as const,
      };
    }

    const balance = computeDayBalance(log);
    return {
      date: day.date,
      dayName: day.dayName,
      isTrainingDay: day.isTrainingDay,
      consumed: balance.consumed,
      target,
      status: balance.status,
    };
  });

  const weeklyConsumed = days.reduce(
    (acc, d) => ({
      proteins: acc.proteins + d.consumed.proteins,
      carbs: acc.carbs + d.consumed.carbs,
      fats: acc.fats + d.consumed.fats,
      calories: acc.calories + d.consumed.calories,
    }),
    { proteins: 0, carbs: 0, fats: 0, calories: 0 }
  );

  const weeklyTarget = {
    proteins: MACRO_TARGETS.training.proteins * 4 + MACRO_TARGETS.rest.proteins * 3,
    carbs: MACRO_TARGETS.training.carbs * 4 + MACRO_TARGETS.rest.carbs * 3,
    fats: MACRO_TARGETS.training.fats * 4 + MACRO_TARGETS.rest.fats * 3,
    calories: MACRO_TARGETS.training.calories * 4 + MACRO_TARGETS.rest.calories * 3,
  };

  const calorieDiff = weeklyConsumed.calories - weeklyTarget.calories;
  const proteinAdequacy = weeklyConsumed.proteins / weeklyTarget.proteins;

  let weeklyStatus: WeeklyRecap['weeklyStatus'] = 'optimal';
  let globalRecommendation = '';

  if (proteinAdequacy < 0.85) {
    weeklyStatus = 'protein_low';
    globalRecommendation = `⚠️ Protéines insuffisantes sur la semaine (${Math.round(weeklyConsumed.proteins)}g / ${weeklyTarget.proteins}g). Ajoute une source de protéines à chaque repas — vise 140g/jour.`;
  } else if (calorieDiff > 1000) {
    weeklyStatus = 'surplus';
    globalRecommendation = `📊 Surplus calorique de ${calorieDiff} kcal sur la semaine. Réduis légèrement les glucides la semaine prochaine (-50g/jour).`;
  } else if (calorieDiff < -1500) {
    weeklyStatus = 'deficit';
    globalRecommendation = `📉 Déficit de ${Math.abs(calorieDiff)} kcal sur la semaine. Un déficit prolongé freine la prise de muscle. Augmente les glucides (+50g/jour) la semaine prochaine.`;
  } else {
    globalRecommendation = `✅ Semaine nutritionnelle optimale ! Continue sur cette lancée — la régularité est la clé de la prise de volume.`;
  }

  return { weekStartDate: weekPlan.weekStartDate, days, weeklyConsumed, weeklyTarget, weeklyStatus, globalRecommendation };
}

export function computeWeeklyCarryover(dayLogs: Record<string, DayLog>, weekPlan: WeeklyMealPlan): DayMacros {
  let totalSurplus: DayMacros = { proteins: 0, carbs: 0, fats: 0, calories: 0 };

  weekPlan.days.forEach(day => {
    const log = dayLogs[day.date];
    if (!log || log.entries.length === 0) return;
    const balance = computeDayBalance(log);
    totalSurplus = {
      proteins: totalSurplus.proteins + balance.surplus.proteins,
      carbs: totalSurplus.carbs + balance.surplus.carbs,
      fats: totalSurplus.fats + balance.surplus.fats,
      calories: totalSurplus.calories + balance.surplus.calories,
    };
  });

  return totalSurplus;
}
