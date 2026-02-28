// ============================================================
// MOTEUR NUTRITIONNEL — FitPro
// Journal alimentaire quotidien, régulation calorique automatique,
// plan hebdomadaire et liste de courses précise.
// ============================================================

export interface FoodEntry {
  id: string;
  foodId: string;
  foodName: string;
  quantity: number; // grammes
  meal: 'breakfast' | 'lunch' | 'snack' | 'dinner' | 'before_sleep';
  proteins: number;
  carbs: number;
  fats: number;
  calories: number;
}

export interface DayLog {
  date: string; // ISO date string (YYYY-MM-DD)
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
  surplus: DayMacros; // positif = surplus, négatif = déficit
  proteinAdequacy: number; // % des protéines cibles atteintes
  recommendation: string;
  status: 'optimal' | 'surplus' | 'deficit' | 'protein_low';
}

// ============================================================
// MACROS CIBLES (adaptées selon jour training/repos)
// ============================================================

export const MACRO_TARGETS = {
  training: {
    calories: 2900,
    proteins: 140,
    carbs: 430,
    fats: 70,
  },
  rest: {
    calories: 2600,
    proteins: 140,
    carbs: 360,
    fats: 70,
  },
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
    (acc, entry) => ({
      proteins: acc.proteins + entry.proteins,
      carbs: acc.carbs + entry.carbs,
      fats: acc.fats + entry.fats,
      calories: acc.calories + entry.calories,
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

  // Déterminer le statut et la recommandation
  let status: DayBalance['status'] = 'optimal';
  let recommendation = '';

  if (proteinAdequacy < 80) {
    status = 'protein_low';
    recommendation = `⚠️ Protéines insuffisantes (${Math.round(consumed.proteins)}g / ${target.proteins}g cibles). Ajoute ${Math.round(target.proteins - consumed.proteins)}g de protéines. Exemple : ${Math.round((target.proteins - consumed.proteins) / 0.27)}g de blanc de poulet.`;
  } else if (surplus.calories > 400) {
    status = 'surplus';
    recommendation = `📊 Surplus calorique de ${surplus.calories} kcal. Réduis les glucides de ${Math.round(surplus.carbs)}g demain. Évite les aliments transformés.`;
  } else if (surplus.calories < -300) {
    status = 'deficit';
    recommendation = `📉 Déficit calorique de ${Math.abs(surplus.calories)} kcal. Mange ${Math.abs(Math.round(surplus.carbs))}g de glucides supplémentaires (riz, patate douce). Un déficit trop important freine la prise de muscle.`;
  } else {
    recommendation = `✅ Bilan optimal ! Protéines : ${Math.round(consumed.proteins)}g, Calories : ${Math.round(consumed.calories)} kcal. Continue comme ça.`;
  }

  return { consumed, target, surplus, proteinAdequacy, recommendation, status };
}

// ============================================================
// PLAN ALIMENTAIRE HEBDOMADAIRE
// ============================================================

export interface WeeklyMealPlan {
  weekStartDate: string;
  days: Array<{
    date: string;
    dayName: string;
    isTrainingDay: boolean;
    sessionName?: string;
    meals: Array<{
      time: string;
      name: string;
      items: Array<{
        food: string;
        quantity: string;
        proteins: number;
        carbs: number;
        fats: number;
        calories: number;
      }>;
      totalCalories: number;
    }>;
    totalMacros: DayMacros;
  }>;
  weeklyTotals: DayMacros;
}

// Sessions par jour de la semaine (0=dim, 1=lun, 2=mar, 3=mer, 4=jeu, 5=ven, 6=sam)
const SESSION_BY_DAY: Record<number, string | null> = {
  0: null,
  1: 'Haut du corps A',
  2: 'Bas du corps A',
  3: null,
  4: 'Haut du corps B',
  5: 'Bas du corps B',
  6: null,
};

const DAY_NAMES_FR = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

// Plan de repas de base (training day)
const BASE_MEALS_TRAINING = [
  {
    time: '07h00',
    name: 'Petit-déjeuner',
    items: [
      { food: 'Flocons d\'avoine', quantity: '100g', proteins: 13, carbs: 60, fats: 7, calories: 389 },
      { food: 'Whey Isolate', quantity: '30g', proteins: 25, carbs: 1, fats: 0, calories: 111 },
      { food: 'Banane', quantity: '1 (120g)', proteins: 1, carbs: 28, fats: 0, calories: 107 },
      { food: 'Amandes', quantity: '30g', proteins: 6, carbs: 7, fats: 15, calories: 174 },
    ],
    totalCalories: 781,
  },
  {
    time: '12h30',
    name: 'Déjeuner',
    items: [
      { food: 'Blanc de poulet', quantity: '150g', proteins: 41, carbs: 0, fats: 5, calories: 203 },
      { food: 'Patate douce', quantity: '300g cuite', proteins: 5, carbs: 60, fats: 0, calories: 258 },
      { food: 'Brocolis', quantity: '200g', proteins: 6, carbs: 14, fats: 0, calories: 68 },
      { food: 'Huile d\'olive', quantity: '1 c.s. (10g)', proteins: 0, carbs: 0, fats: 10, calories: 88 },
    ],
    totalCalories: 617,
  },
  {
    time: '16h00',
    name: 'Collation pré-training',
    items: [
      { food: 'Œufs durs', quantity: '2 (120g)', proteins: 16, carbs: 1, fats: 12, calories: 172 },
      { food: 'Pomme', quantity: '1 (150g)', proteins: 0, carbs: 22, fats: 0, calories: 78 },
    ],
    totalCalories: 250,
  },
  {
    time: '19h30',
    name: 'Dîner post-training',
    items: [
      { food: 'Saumon', quantity: '150g', proteins: 30, carbs: 0, fats: 20, calories: 312 },
      { food: 'Riz basmati', quantity: '100g cru (280g cuit)', proteins: 8, carbs: 78, fats: 1, calories: 356 },
      { food: 'Haricots verts', quantity: '200g', proteins: 4, carbs: 8, fats: 0, calories: 48 },
    ],
    totalCalories: 716,
  },
  {
    time: '22h00',
    name: 'Avant de dormir',
    items: [
      { food: 'Fromage blanc 0%', quantity: '250g', proteins: 20, carbs: 10, fats: 0, calories: 120 },
      { food: 'Fruits rouges', quantity: '100g', proteins: 1, carbs: 12, fats: 0, calories: 52 },
    ],
    totalCalories: 172,
  },
];

// Plan de repas jour de repos (légèrement réduit en glucides)
const BASE_MEALS_REST = [
  {
    time: '07h00',
    name: 'Petit-déjeuner',
    items: [
      { food: 'Flocons d\'avoine', quantity: '80g', proteins: 10, carbs: 48, fats: 6, calories: 311 },
      { food: 'Œufs entiers', quantity: '3 (180g)', proteins: 23, carbs: 2, fats: 18, calories: 257 },
      { food: 'Fruits rouges', quantity: '150g', proteins: 2, carbs: 18, fats: 0, calories: 78 },
    ],
    totalCalories: 646,
  },
  {
    time: '12h30',
    name: 'Déjeuner',
    items: [
      { food: 'Blanc de dinde', quantity: '150g', proteins: 41, carbs: 0, fats: 3, calories: 188 },
      { food: 'Quinoa', quantity: '80g cru (200g cuit)', proteins: 11, carbs: 55, fats: 4, calories: 296 },
      { food: 'Épinards', quantity: '200g', proteins: 5, carbs: 6, fats: 1, calories: 46 },
      { food: 'Avocat', quantity: '1/2 (75g)', proteins: 2, carbs: 7, fats: 11, calories: 120 },
    ],
    totalCalories: 650,
  },
  {
    time: '15h30',
    name: 'Collation',
    items: [
      { food: 'Fromage blanc 0%', quantity: '200g', proteins: 16, carbs: 8, fats: 0, calories: 96 },
      { food: 'Noix', quantity: '30g', proteins: 5, carbs: 4, fats: 19, calories: 196 },
    ],
    totalCalories: 292,
  },
  {
    time: '19h30',
    name: 'Dîner',
    items: [
      { food: 'Cabillaud', quantity: '200g', proteins: 46, carbs: 0, fats: 2, calories: 164 },
      { food: 'Patate douce', quantity: '200g cuite', proteins: 3, carbs: 40, fats: 0, calories: 172 },
      { food: 'Brocolis', quantity: '200g', proteins: 6, carbs: 14, fats: 0, calories: 68 },
      { food: 'Huile d\'olive', quantity: '1 c.s. (10g)', proteins: 0, carbs: 0, fats: 10, calories: 88 },
    ],
    totalCalories: 492,
  },
  {
    time: '22h00',
    name: 'Avant de dormir',
    items: [
      { food: 'Fromage blanc 0%', quantity: '250g', proteins: 20, carbs: 10, fats: 0, calories: 120 },
    ],
    totalCalories: 120,
  },
];

export function generateWeeklyMealPlan(weekStartMonday: Date): WeeklyMealPlan {
  const days = [];
  let weeklyTotals: DayMacros = { proteins: 0, carbs: 0, fats: 0, calories: 0 };

  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStartMonday);
    date.setDate(weekStartMonday.getDate() + i);
    const dayOfWeek = date.getDay();
    const sessionName = SESSION_BY_DAY[dayOfWeek];
    const isTrainingDay = sessionName !== null;
    const meals = isTrainingDay ? BASE_MEALS_TRAINING : BASE_MEALS_REST;

    const totalMacros = meals.reduce(
      (acc, meal) => {
        const mealMacros = meal.items.reduce(
          (mAcc, item) => ({
            proteins: mAcc.proteins + item.proteins,
            carbs: mAcc.carbs + item.carbs,
            fats: mAcc.fats + item.fats,
            calories: mAcc.calories + item.calories,
          }),
          { proteins: 0, carbs: 0, fats: 0, calories: 0 }
        );
        return {
          proteins: acc.proteins + mealMacros.proteins,
          carbs: acc.carbs + mealMacros.carbs,
          fats: acc.fats + mealMacros.fats,
          calories: acc.calories + mealMacros.calories,
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
// LISTE DE COURSES HEBDOMADAIRE
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
  generatedOn: string; // samedi
  items: ShoppingItem[];
  totalEstimatedBudget: string;
  storeTips: string[];
}

export function generateShoppingList(weekPlan: WeeklyMealPlan): ShoppingList {
  // Quantités calculées pour 7 jours (4 jours training + 3 jours repos)
  const items: ShoppingItem[] = [
    // ---- PROTÉINES ----
    {
      category: 'Protéines',
      name: 'Blanc de poulet / dinde (frais ou surgelé)',
      quantity: '1.2',
      unit: 'kg',
      estimatedPrice: '~8-12€',
      notes: 'Achète en gros et congèle en portions de 150g. Préfère le Label Rouge.',
      priority: 'essential',
    },
    {
      category: 'Protéines',
      name: 'Saumon (pavés)',
      quantity: '600',
      unit: 'g',
      estimatedPrice: '~8-12€',
      notes: '4 pavés de 150g. Frais ou surgelé. Sauvage ou Label Rouge si possible.',
      priority: 'essential',
    },
    {
      category: 'Protéines',
      name: 'Cabillaud / colin (filets)',
      quantity: '400',
      unit: 'g',
      estimatedPrice: '~4-6€',
      notes: 'Surgelé OK. Pour 2 dîners jours de repos.',
      priority: 'essential',
    },
    {
      category: 'Protéines',
      name: 'Œufs (bio ou plein air)',
      quantity: '18',
      unit: 'pièces',
      estimatedPrice: '~4-6€',
      notes: 'Boîte de 18. Pour les petits-déjeuners et collations.',
      priority: 'essential',
    },
    {
      category: 'Protéines',
      name: 'Fromage blanc 0% (pot 500g)',
      quantity: '3',
      unit: 'pots (1.5kg)',
      estimatedPrice: '~4-6€',
      notes: 'Marque distributeur OK. Pour avant de dormir tous les soirs.',
      priority: 'essential',
    },
    {
      category: 'Protéines',
      name: 'Whey Protein Isolate',
      quantity: '1',
      unit: 'kg (commande en ligne)',
      estimatedPrice: '~25-35€ (dure ~1 mois)',
      notes: 'Myprotein, Bulk, ou Foodspring. Saveur neutre ou vanille. Commande en ligne, pas en drive.',
      priority: 'recommended',
    },

    // ---- GLUCIDES ----
    {
      category: 'Glucides',
      name: 'Flocons d\'avoine (gros flocons)',
      quantity: '1',
      unit: 'kg',
      estimatedPrice: '~2-4€',
      notes: 'Marque Quaker ou distributeur. Évite les flocons "instantanés" (IG plus élevé).',
      priority: 'essential',
    },
    {
      category: 'Glucides',
      name: 'Riz basmati',
      quantity: '1',
      unit: 'kg',
      estimatedPrice: '~2-4€',
      notes: 'Cuit en grande quantité le dimanche pour la semaine.',
      priority: 'essential',
    },
    {
      category: 'Glucides',
      name: 'Patate douce',
      quantity: '2',
      unit: 'kg',
      estimatedPrice: '~3-5€',
      notes: 'Cuite au four ou à la vapeur. Se conserve bien. Prépare en batch.',
      priority: 'essential',
    },
    {
      category: 'Glucides',
      name: 'Quinoa',
      quantity: '500',
      unit: 'g',
      estimatedPrice: '~3-5€',
      notes: 'Pour les déjeuners des jours de repos.',
      priority: 'essential',
    },
    {
      category: 'Glucides',
      name: 'Bananes',
      quantity: '7',
      unit: 'pièces',
      estimatedPrice: '~1-2€',
      notes: '1 banane par matin (jours training). Achète des bananes à différents stades de maturité.',
      priority: 'essential',
    },
    {
      category: 'Glucides',
      name: 'Fruits rouges (frais ou surgelés)',
      quantity: '500',
      unit: 'g',
      estimatedPrice: '~3-5€',
      notes: 'Fraises, myrtilles, framboises. Surgelé OK et moins cher. Riches en antioxydants.',
      priority: 'recommended',
    },
    {
      category: 'Glucides',
      name: 'Pommes',
      quantity: '4',
      unit: 'pièces',
      estimatedPrice: '~1-2€',
      notes: 'Pour les collations pré-training.',
      priority: 'essential',
    },

    // ---- LIPIDES ----
    {
      category: 'Lipides',
      name: 'Huile d\'olive extra vierge',
      quantity: '1',
      unit: 'bouteille (500ml)',
      estimatedPrice: '~5-8€',
      notes: 'Première pression à froid. Pour l\'assaisonnement uniquement (ne pas chauffer fort).',
      priority: 'essential',
    },
    {
      category: 'Lipides',
      name: 'Amandes (nature, non salées)',
      quantity: '200',
      unit: 'g',
      estimatedPrice: '~2-4€',
      notes: '30g par jour pour les collations. Achète en vrac si possible.',
      priority: 'essential',
    },
    {
      category: 'Lipides',
      name: 'Noix (cerneaux)',
      quantity: '150',
      unit: 'g',
      estimatedPrice: '~2-4€',
      notes: 'Riches en oméga-3. Pour les collations jours de repos.',
      priority: 'recommended',
    },
    {
      category: 'Lipides',
      name: 'Avocats',
      quantity: '3',
      unit: 'pièces',
      estimatedPrice: '~2-4€',
      notes: '1/2 avocat pour les déjeuners des jours de repos. Achète à différents stades de maturité.',
      priority: 'recommended',
    },

    // ---- LÉGUMES ----
    {
      category: 'Légumes',
      name: 'Brocolis (frais ou surgelés)',
      quantity: '1',
      unit: 'kg',
      estimatedPrice: '~2-4€',
      notes: 'À chaque dîner. Surgelé OK et pratique. Cuit à la vapeur pour préserver les nutriments.',
      priority: 'essential',
    },
    {
      category: 'Légumes',
      name: 'Haricots verts (surgelés)',
      quantity: '500',
      unit: 'g',
      estimatedPrice: '~1-2€',
      notes: 'Pour les dîners post-training.',
      priority: 'essential',
    },
    {
      category: 'Légumes',
      name: 'Épinards (frais ou surgelés)',
      quantity: '400',
      unit: 'g',
      estimatedPrice: '~1-3€',
      notes: 'Pour les déjeuners des jours de repos. Riches en fer et magnésium.',
      priority: 'recommended',
    },

    // ---- CONDIMENTS & DIVERS ----
    {
      category: 'Divers',
      name: 'Sel de mer, poivre, herbes aromatiques',
      quantity: '1',
      unit: 'assortiment',
      estimatedPrice: '~2-5€',
      notes: 'Thym, romarin, paprika, curcuma. Pour varier les saveurs sans ajouter de calories.',
      priority: 'recommended',
    },
    {
      category: 'Divers',
      name: 'Sauce soja (faible en sel)',
      quantity: '1',
      unit: 'bouteille',
      estimatedPrice: '~2-3€',
      notes: 'Pour mariner le poulet et le poisson. Version faible en sel.',
      priority: 'optional',
    },
  ];

  const storeTips = [
    '🛒 Commande le samedi pour récupération le lundi — les produits frais seront parfaits pour la semaine.',
    '❄️ Achète les poissons et viandes en grande quantité et congèle en portions individuelles.',
    '🍳 Prépare le riz et les patates douces en batch le dimanche soir pour gagner du temps.',
    '💰 Les surgelés (poissons, légumes, fruits rouges) sont aussi nutritifs que le frais et moins chers.',
    '📦 Commande la Whey en ligne (Myprotein, Bulk) — moins cher et meilleure qualité qu\'en magasin.',
    '🥚 Les œufs bio ou plein air ont un meilleur profil nutritionnel (plus d\'oméga-3).',
  ];

  return {
    weekStartDate: weekPlan.weekStartDate,
    generatedOn: new Date().toISOString().split('T')[0],
    items,
    totalEstimatedBudget: '~60-80€/semaine',
    storeTips,
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
  let adjustment = { ...MACRO_TARGETS.training };

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
