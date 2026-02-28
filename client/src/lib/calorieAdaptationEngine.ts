// ============================================================
// MOTEUR D'ADAPTATION CALORIQUE — FitPro
// Adapte les calories chaque semaine selon la vitesse de prise de poids
// Objectif : prise de masse sèche (lean bulk)
// Surplus cible : +200 à +300 kcal/jour
// Vitesse de prise idéale : +0.2 à +0.5 kg/semaine
// ============================================================

export interface WeeklyMeasurement {
  weekNumber: number;
  date: string;
  weight: number;          // kg
  bodyFat?: number;        // %
  armCircumference?: number; // cm
  thighCircumference?: number; // cm
  waistCircumference?: number; // cm
  notes?: string;
}

export interface CalorieAdaptation {
  weekNumber: number;
  baseCaloriesTraining: number;
  baseCaloriesRest: number;
  proteinsTarget: number;
  carbsTraining: number;
  carbsRest: number;
  fatsTarget: number;
  reason: string;
  verdict: 'too_fast' | 'too_slow' | 'optimal' | 'initial';
  weeklyWeightGain?: number; // kg/semaine
  recommendation: string;
}

// ============================================================
// CONSTANTES DE BASE
// ============================================================

// TDEE estimé pour 68kg, 1m75, 26 ans, actif (4-5 séances/semaine) :
// BMR = 370 + (21.6 × 68 × 0.87) = ~1647 kcal (avec 13% MG, masse maigre ~59kg)
// TDEE = 1647 × 1.55 (actif) = ~2553 kcal
// Surplus cible lean bulk : +200 kcal → 2750 kcal training, 2450 kcal repos
// Protéines : 2.2g/kg masse maigre = 2.2 × 59 = ~130g (minimum), cible 150g
// Lipides : 0.8g/kg poids total = ~55g minimum, cible 65g
// Glucides : reste des calories

export const BASE_CALORIES = {
  training: 2550,  // TDEE + 200 kcal surplus
  rest: 2250,      // TDEE - 300 kcal (légère restriction les jours off)
};

export const BASE_MACROS = {
  proteins: 150,   // g/jour (2.2g/kg masse maigre ~59kg)
  fats: 65,        // g/jour
  carbsTraining: Math.round((BASE_CALORIES.training - 150 * 4 - 65 * 9) / 4), // ~288g
  carbsRest: Math.round((BASE_CALORIES.rest - 150 * 4 - 65 * 9) / 4),         // ~213g
};

// ============================================================
// RÈGLES D'ADAPTATION
// ============================================================

// Vitesse de prise de poids idéale pour lean bulk :
// - Débutant/intermédiaire : 0.25 à 0.5 kg/semaine
// - Si prise > 0.6 kg/sem : trop rapide → risque de gras → réduire 150 kcal
// - Si prise < 0.15 kg/sem : trop lente → muscle insuffisant → augmenter 150 kcal
// - Si prise 0.15-0.6 kg/sem : optimal → maintenir

const WEIGHT_GAIN_OPTIMAL_MIN = 0.15; // kg/semaine
const WEIGHT_GAIN_OPTIMAL_MAX = 0.60; // kg/semaine
const CALORIE_ADJUSTMENT_STEP = 150;  // kcal d'ajustement
const MAX_CALORIE_INCREASE = 400;     // kcal max au-dessus de la base
const MAX_CALORIE_DECREASE = 300;     // kcal max en dessous de la base

export function computeCalorieAdaptation(
  measurements: WeeklyMeasurement[],
  currentWeek: number
): CalorieAdaptation {
  // Semaine 1 ou pas assez de données : valeurs de base
  if (measurements.length < 2) {
    return {
      weekNumber: currentWeek,
      baseCaloriesTraining: BASE_CALORIES.training,
      baseCaloriesRest: BASE_CALORIES.rest,
      proteinsTarget: BASE_MACROS.proteins,
      carbsTraining: BASE_MACROS.carbsTraining,
      carbsRest: BASE_MACROS.carbsRest,
      fatsTarget: BASE_MACROS.fats,
      reason: 'Semaine initiale — calibration en cours.',
      verdict: 'initial',
      recommendation: `Objectif : prendre **0.2 à 0.5 kg/semaine**. Rentre ton poids chaque lundi matin à jeun pour que l'app adapte tes calories automatiquement.`,
    };
  }

  // Trie par semaine croissante
  const sorted = [...measurements].sort((a, b) => a.weekNumber - b.weekNumber);
  const last = sorted[sorted.length - 1];
  const prev = sorted[sorted.length - 2];

  const weeklyGain = last.weight - prev.weight;

  // Calcul de l'adaptation calorique cumulée
  // On part de la base et on ajuste en fonction de toutes les semaines précédentes
  let cumulativeAdjustment = 0;
  for (let i = 1; i < sorted.length; i++) {
    const gain = sorted[i].weight - sorted[i - 1].weight;
    if (gain > WEIGHT_GAIN_OPTIMAL_MAX) {
      cumulativeAdjustment -= CALORIE_ADJUSTMENT_STEP;
    } else if (gain < WEIGHT_GAIN_OPTIMAL_MIN) {
      cumulativeAdjustment += CALORIE_ADJUSTMENT_STEP;
    }
  }

  // Clamp l'ajustement
  cumulativeAdjustment = Math.max(-MAX_CALORIE_DECREASE, Math.min(MAX_CALORIE_INCREASE, cumulativeAdjustment));

  const adaptedTraining = BASE_CALORIES.training + cumulativeAdjustment;
  const adaptedRest = BASE_CALORIES.rest + cumulativeAdjustment;

  // Recalcule les glucides avec les nouvelles calories (protéines et lipides fixes)
  const carbsTraining = Math.max(150, Math.round((adaptedTraining - BASE_MACROS.proteins * 4 - BASE_MACROS.fats * 9) / 4));
  const carbsRest = Math.max(100, Math.round((adaptedRest - BASE_MACROS.proteins * 4 - BASE_MACROS.fats * 9) / 4));

  let verdict: CalorieAdaptation['verdict'];
  let reason: string;
  let recommendation: string;

  if (weeklyGain > WEIGHT_GAIN_OPTIMAL_MAX) {
    verdict = 'too_fast';
    reason = `Prise de ${weeklyGain.toFixed(2)} kg cette semaine — trop rapide (max 0.5 kg/sem). Risque de prise de gras.`;
    recommendation = `⚠️ Réduis les glucides de ${CALORIE_ADJUSTMENT_STEP / 4}g/jour. Vérifie que tu ne sautes pas de séances cardio. Si la tendance continue, on réduira encore.`;
  } else if (weeklyGain < WEIGHT_GAIN_OPTIMAL_MIN && weeklyGain >= 0) {
    verdict = 'too_slow';
    reason = `Prise de ${weeklyGain.toFixed(2)} kg cette semaine — trop lente (min 0.15 kg/sem). Le muscle ne se construit pas assez vite.`;
    recommendation = `📈 Augmente les glucides de ${CALORIE_ADJUSTMENT_STEP / 4}g/jour (ajoute une portion de riz ou de patate douce). Assure-toi de manger dans les 30min après la séance.`;
  } else if (weeklyGain < 0) {
    verdict = 'too_slow';
    reason = `Perte de ${Math.abs(weeklyGain).toFixed(2)} kg cette semaine — tu es en déficit calorique. Impossible de prendre du muscle.`;
    recommendation = `🚨 Augmente les calories immédiatement. Ajoute ${CALORIE_ADJUSTMENT_STEP}g de glucides/jour. Vérifie que tu manges bien avant et après chaque séance.`;
  } else {
    verdict = 'optimal';
    reason = `Prise de ${weeklyGain.toFixed(2)} kg cette semaine — progression optimale pour un lean bulk.`;
    recommendation = `✅ Parfait ! Continue exactement comme ça. Prise de masse sèche en cours — les abdos restent visibles à ce rythme.`;
  }

  return {
    weekNumber: currentWeek,
    baseCaloriesTraining: adaptedTraining,
    baseCaloriesRest: adaptedRest,
    proteinsTarget: BASE_MACROS.proteins,
    carbsTraining,
    carbsRest,
    fatsTarget: BASE_MACROS.fats,
    reason,
    verdict,
    weeklyWeightGain: weeklyGain,
    recommendation,
  };
}

// ============================================================
// CALCUL DU POIDS IDÉAL ATTENDU
// ============================================================

export function computeIdealWeightProgression(
  startWeight: number,
  weeks: number
): Array<{ week: number; minWeight: number; maxWeight: number }> {
  return Array.from({ length: weeks }, (_, i) => ({
    week: i + 1,
    minWeight: Math.round((startWeight + i * WEIGHT_GAIN_OPTIMAL_MIN) * 10) / 10,
    maxWeight: Math.round((startWeight + i * WEIGHT_GAIN_OPTIMAL_MAX) * 10) / 10,
  }));
}

// ============================================================
// ANALYSE DE LA COMPOSITION CORPORELLE
// ============================================================

export interface BodyCompositionAnalysis {
  leanMassKg: number;
  fatMassKg: number;
  leanMassGain?: number;    // vs semaine précédente
  fatMassGain?: number;     // vs semaine précédente
  qualityScore: number;     // 0-100 : ratio masse maigre/totale gagnée
  qualityLabel: string;
  advice: string;
}

export function analyzeBodyComposition(
  current: WeeklyMeasurement,
  previous?: WeeklyMeasurement
): BodyCompositionAnalysis {
  const bodyFat = current.bodyFat ?? 13;
  const leanMassKg = Math.round(current.weight * (1 - bodyFat / 100) * 10) / 10;
  const fatMassKg = Math.round(current.weight * (bodyFat / 100) * 10) / 10;

  let leanMassGain: number | undefined;
  let fatMassGain: number | undefined;
  let qualityScore = 75;
  let qualityLabel = 'Bonne progression';
  let advice = '';

  if (previous) {
    const prevBodyFat = previous.bodyFat ?? 13;
    const prevLeanMass = previous.weight * (1 - prevBodyFat / 100);
    const prevFatMass = previous.weight * (prevBodyFat / 100);
    leanMassGain = Math.round((leanMassKg - prevLeanMass) * 100) / 100;
    fatMassGain = Math.round((fatMassKg - prevFatMass) * 100) / 100;

    const totalGain = current.weight - previous.weight;
    if (totalGain > 0 && leanMassGain !== undefined && fatMassGain !== undefined) {
      const leanRatio = leanMassGain / totalGain;
      qualityScore = Math.round(Math.max(0, Math.min(100, leanRatio * 100)));

      if (qualityScore >= 70) {
        qualityLabel = 'Excellente qualité';
        advice = `Tu gagnes principalement du muscle (${leanMassGain > 0 ? '+' : ''}${leanMassGain}kg muscle, ${fatMassGain > 0 ? '+' : ''}${fatMassGain}kg gras). Continue !`;
      } else if (qualityScore >= 40) {
        qualityLabel = 'Progression correcte';
        advice = `Ratio muscle/gras acceptable. Augmente légèrement les protéines et assure-toi de bien dormir 8h.`;
      } else {
        qualityLabel = 'Trop de gras';
        advice = `Tu prends trop de gras (${fatMassGain > 0 ? '+' : ''}${fatMassGain}kg). Réduis les glucides simples et augmente le cardio de 1 séance.`;
      }
    } else if (totalGain <= 0) {
      qualityScore = 20;
      qualityLabel = 'Déficit calorique';
      advice = 'Tu perds du poids — augmente les calories immédiatement pour protéger ta masse musculaire.';
    }
  } else {
    advice = 'Données initiales enregistrées. Les analyses de composition corporelle démarreront la semaine prochaine.';
  }

  return { leanMassKg, fatMassKg, leanMassGain, fatMassGain, qualityScore, qualityLabel, advice };
}

// ============================================================
// PROJECTION 12 SEMAINES
// ============================================================

export interface WeekProjection {
  week: number;
  projectedWeight: number;
  projectedLeanMass: number;
  projectedFatPercent: number;
  caloriesTraining: number;
  caloriesRest: number;
}

export function computeWeekProjections(
  startWeight: number,
  startBodyFat: number,
  measurements: WeeklyMeasurement[],
  totalWeeks: number = 12
): WeekProjection[] {
  const projections: WeekProjection[] = [];
  let currentWeight = startWeight;
  let currentBodyFat = startBodyFat;

  for (let week = 1; week <= totalWeeks; week++) {
    // Utilise les vraies mesures si disponibles
    const real = measurements.find(m => m.weekNumber === week);
    if (real) {
      currentWeight = real.weight;
      currentBodyFat = real.bodyFat ?? currentBodyFat;
    } else {
      // Projection : +0.3 kg/semaine en moyenne (milieu de la fourchette optimale)
      currentWeight = Math.round((currentWeight + 0.3) * 10) / 10;
      // Légère amélioration de la composition corporelle
      currentBodyFat = Math.max(10, Math.round((currentBodyFat - 0.1) * 10) / 10);
    }

    const adaptation = computeCalorieAdaptation(
      measurements.filter(m => m.weekNumber <= week),
      week
    );

    projections.push({
      week,
      projectedWeight: currentWeight,
      projectedLeanMass: Math.round(currentWeight * (1 - currentBodyFat / 100) * 10) / 10,
      projectedFatPercent: currentBodyFat,
      caloriesTraining: adaptation.baseCaloriesTraining,
      caloriesRest: adaptation.baseCaloriesRest,
    });
  }

  return projections;
}
