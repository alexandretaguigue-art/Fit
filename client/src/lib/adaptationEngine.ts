// ============================================================
// MOTEUR D'ADAPTATION AUTOMATIQUE — FitPro
// Algorithme de progression intelligent basé sur les performances
// réelles de chaque séance.
// ============================================================

export interface SetPerformance {
  weight: number;
  reps: number;
  completed: boolean;
  rpe?: number; // Rate of Perceived Exertion 1-10
}

export interface ExercisePerformance {
  exerciseId: string;
  targetSets: number;
  targetRepsMin: number;
  targetRepsMax: number | null;
  sets: SetPerformance[];
  perceivedDifficulty: number; // 1-10
}

export interface AdaptationResult {
  exerciseId: string;
  currentWeight: number;
  suggestedWeight: number;
  suggestedRepsMin: number;
  suggestedRepsMax: number | null;
  suggestedSets: number;
  direction: 'increase_weight' | 'increase_reps' | 'maintain' | 'decrease' | 'deload';
  confidence: 'high' | 'medium' | 'low';
  reasoning: string;
  coachMessage: string;
  weeklyVolume: number; // sets × reps × weight
  progressPercent: number; // % d'augmentation suggérée
}

export interface WeeklyAdaptation {
  weekNumber: number;
  phase: 'fondation' | 'developpement' | 'intensification' | 'decharge';
  sessionAdaptations: Record<string, AdaptationResult[]>; // sessionId → adaptations
  overallFatigue: number; // 0-10
  recommendation: string;
}

// ============================================================
// CONSTANTES DE PROGRESSION
// ============================================================

const PROGRESSION_RULES = {
  // Exercices polyarticulaires lourds (squat, SDT, développé)
  compound: {
    minWeightIncrement: 2.5,
    maxWeightIncrement: 5,
    repsToUnlockIncrease: 0.9, // 90% des reps cibles complétées
    difficultyThresholdUp: 7,   // difficulté ≥ 7 ET reps complétées → augmente
    difficultyThresholdDown: 5, // difficulté < 5 → trop facile, augmente plus vite
  },
  // Exercices d'isolation (curl, extension, élévations)
  isolation: {
    minWeightIncrement: 1,
    maxWeightIncrement: 2.5,
    repsToUnlockIncrease: 0.85,
    difficultyThresholdUp: 7,
    difficultyThresholdDown: 5,
  },
  // Exercices au poids de corps (tractions, dips)
  bodyweight: {
    minWeightIncrement: 2.5, // lest
    maxWeightIncrement: 5,
    repsToUnlockIncrease: 0.9,
    difficultyThresholdUp: 7,
    difficultyThresholdDown: 5,
  },
};

// Classification des exercices
const EXERCISE_TYPE: Record<string, 'compound' | 'isolation' | 'bodyweight'> = {
  squat: 'compound',
  souleve_de_terre: 'compound',
  developpe_couche: 'compound',
  developpe_militaire: 'compound',
  rowing_barre: 'compound',
  presse_cuisses: 'compound',
  hip_thrust: 'compound',
  fentes_bulgares: 'compound',
  tractions: 'bodyweight',
  dips: 'bodyweight',
  leg_extension: 'isolation',
  leg_curl: 'isolation',
  elevations_laterales: 'isolation',
  extension_triceps_poulie: 'isolation',
  curl_incline: 'isolation',
  curl_marteau: 'isolation',
  ecarte_incline: 'isolation',
  tirage_horizontal: 'isolation',
  face_pull: 'isolation',
  extensions_mollets: 'isolation',
  crunches_poulie: 'isolation',
  russian_twist: 'isolation',
  releve_jambes: 'bodyweight',
  gainage: 'bodyweight',
};

// ============================================================
// CALCUL DU VOLUME ET DES MÉTRIQUES
// ============================================================

export function calculateVolume(sets: SetPerformance[]): number {
  return sets
    .filter(s => s.completed)
    .reduce((acc, s) => acc + s.weight * s.reps, 0);
}

export function calculateCompletionRate(sets: SetPerformance[], targetSets: number, targetRepsMin: number): number {
  const completedSets = sets.filter(s => s.completed && s.reps >= targetRepsMin).length;
  return completedSets / targetSets;
}

export function getAverageWeight(sets: SetPerformance[]): number {
  const completed = sets.filter(s => s.completed && s.weight > 0);
  if (completed.length === 0) return 0;
  return completed.reduce((acc, s) => acc + s.weight, 0) / completed.length;
}

export function getMaxWeight(sets: SetPerformance[]): number {
  const completed = sets.filter(s => s.completed);
  if (completed.length === 0) return 0;
  return Math.max(...completed.map(s => s.weight));
}

// ============================================================
// MOTEUR D'ADAPTATION PRINCIPAL
// ============================================================

export function computeAdaptation(
  perf: ExercisePerformance,
  weekNumber: number,
  previousAdaptation?: AdaptationResult
): AdaptationResult {
  const type = EXERCISE_TYPE[perf.exerciseId] ?? 'isolation';
  const rules = PROGRESSION_RULES[type];

  const completedSets = perf.sets.filter(s => s.completed);
  const completionRate = calculateCompletionRate(perf.sets, perf.targetSets, perf.targetRepsMin);
  const maxWeight = getMaxWeight(perf.sets);
  const avgReps = completedSets.length > 0
    ? completedSets.reduce((acc, s) => acc + s.reps, 0) / completedSets.length
    : 0;
  const targetRepsMax = perf.targetRepsMax ?? perf.targetRepsMin;
  const volume = calculateVolume(perf.sets);

  // Phase du programme
  const phase = weekNumber <= 4 ? 'fondation'
    : weekNumber <= 8 ? 'developpement'
    : weekNumber === 12 ? 'decharge'
    : 'intensification';

  // ---- LOGIQUE DE DÉCHARGE (semaine 12) ----
  if (phase === 'decharge') {
    return {
      exerciseId: perf.exerciseId,
      currentWeight: maxWeight,
      suggestedWeight: Math.round(maxWeight * 0.6 / 2.5) * 2.5,
      suggestedRepsMin: perf.targetRepsMin,
      suggestedRepsMax: perf.targetRepsMax,
      suggestedSets: Math.max(2, perf.targetSets - 1),
      direction: 'deload',
      confidence: 'high',
      reasoning: 'Semaine de décharge obligatoire. Volume réduit de 40% pour permettre la super-compensation.',
      coachMessage: '🔄 Semaine de décharge — allège les charges de 40%. Ton corps va se reconstruire plus fort.',
      weeklyVolume: volume,
      progressPercent: -40,
    };
  }

  // ---- CAS 1 : TOUTES LES SÉRIES COMPLÉTÉES AVEC BONNE DIFFICULTÉ ----
  if (completionRate >= rules.repsToUnlockIncrease && perf.perceivedDifficulty >= rules.difficultyThresholdUp) {
    // Vérifie si les reps max ont été atteintes
    const allAtMax = completedSets.every(s => s.reps >= targetRepsMax);

    if (allAtMax) {
      // Augmenter le poids
      const increment = phase === 'fondation' ? rules.minWeightIncrement
        : phase === 'developpement' ? rules.minWeightIncrement
        : rules.maxWeightIncrement;

      const newWeight = maxWeight + increment;
      const newRepsMin = perf.targetRepsMin; // Repart des reps min avec le nouveau poids

      return {
        exerciseId: perf.exerciseId,
        currentWeight: maxWeight,
        suggestedWeight: newWeight,
        suggestedRepsMin: newRepsMin,
        suggestedRepsMax: perf.targetRepsMax,
        suggestedSets: perf.targetSets,
        direction: 'increase_weight',
        confidence: 'high',
        reasoning: `Toutes les séries complétées à ${targetRepsMax} reps avec difficulté ${perf.perceivedDifficulty}/10. Augmentation de ${increment}kg.`,
        coachMessage: `💪 Excellent ! Tu passes à ${newWeight}kg. Vise ${newRepsMin}-${targetRepsMax} reps.`,
        weeklyVolume: volume,
        progressPercent: Math.round((increment / maxWeight) * 100),
      };
    } else {
      // Augmenter les reps (pas encore au max)
      const newRepsMin = Math.min(Math.round(avgReps) + 1, targetRepsMax);

      return {
        exerciseId: perf.exerciseId,
        currentWeight: maxWeight,
        suggestedWeight: maxWeight,
        suggestedRepsMin: newRepsMin,
        suggestedRepsMax: perf.targetRepsMax,
        suggestedSets: perf.targetSets,
        direction: 'increase_reps',
        confidence: 'high',
        reasoning: `Bonne performance. Vise ${newRepsMin} reps par série avant d'augmenter le poids.`,
        coachMessage: `📈 Bien ! Garde ${maxWeight}kg et vise ${newRepsMin} reps par série.`,
        weeklyVolume: volume,
        progressPercent: 0,
      };
    }
  }

  // ---- CAS 2 : TROP FACILE (difficulté < seuil bas) ----
  if (perf.perceivedDifficulty < rules.difficultyThresholdDown && completionRate >= 0.9) {
    const increment = rules.maxWeightIncrement;
    const newWeight = maxWeight + increment;

    return {
      exerciseId: perf.exerciseId,
      currentWeight: maxWeight,
      suggestedWeight: newWeight,
      suggestedRepsMin: perf.targetRepsMin,
      suggestedRepsMax: perf.targetRepsMax,
      suggestedSets: perf.targetSets,
      direction: 'increase_weight',
      confidence: 'high',
      reasoning: `Séance trop facile (difficulté ${perf.perceivedDifficulty}/10). Augmentation accélérée de ${increment}kg.`,
      coachMessage: `🚀 Trop facile ! Tu passes directement à ${newWeight}kg.`,
      weeklyVolume: volume,
      progressPercent: Math.round((increment / maxWeight) * 100),
    };
  }

  // ---- CAS 3 : SÉRIES INCOMPLÈTES (< 85% des reps cibles) ----
  if (completionRate < 0.8) {
    const decrease = rules.minWeightIncrement;
    const newWeight = Math.max(maxWeight - decrease, 0);

    return {
      exerciseId: perf.exerciseId,
      currentWeight: maxWeight,
      suggestedWeight: newWeight,
      suggestedRepsMin: perf.targetRepsMin,
      suggestedRepsMax: perf.targetRepsMax,
      suggestedSets: perf.targetSets,
      direction: 'decrease',
      confidence: 'medium',
      reasoning: `Taux de complétion : ${Math.round(completionRate * 100)}%. Réduction de ${decrease}kg pour consolider la technique.`,
      coachMessage: `⚠️ Trop lourd. Réduis à ${newWeight}kg et concentre-toi sur la forme parfaite.`,
      weeklyVolume: volume,
      progressPercent: -Math.round((decrease / maxWeight) * 100),
    };
  }

  // ---- CAS 4 : PERFORMANCE CORRECTE MAIS PAS ENCORE AU MAX ----
  return {
    exerciseId: perf.exerciseId,
    currentWeight: maxWeight,
    suggestedWeight: maxWeight,
    suggestedRepsMin: Math.min(Math.round(avgReps) + 1, targetRepsMax),
    suggestedRepsMax: perf.targetRepsMax,
    suggestedSets: perf.targetSets,
    direction: 'maintain',
    confidence: 'medium',
    reasoning: `Performance correcte. Continue à progresser en reps avant d'augmenter le poids.`,
    coachMessage: `✅ Bien. Garde ${maxWeight}kg et essaie de faire 1 rep de plus par série.`,
    weeklyVolume: volume,
    progressPercent: 0,
  };
}

// ============================================================
// ANALYSE DE FATIGUE GLOBALE
// ============================================================

export function computeFatigueScore(
  recentDifficulties: number[],
  recentEnergies: number[]
): { score: number; recommendation: string; shouldRest: boolean } {
  if (recentDifficulties.length === 0) {
    return { score: 0, recommendation: 'Pas encore de données.', shouldRest: false };
  }

  const avgDifficulty = recentDifficulties.reduce((a, b) => a + b, 0) / recentDifficulties.length;
  const avgEnergy = recentEnergies.reduce((a, b) => a + b, 0) / recentEnergies.length;

  // Score de fatigue : haute difficulté + basse énergie = fatigue élevée
  const fatigueScore = Math.round(((avgDifficulty / 10) * 5 + ((10 - avgEnergy) / 10) * 5));

  let recommendation = '';
  let shouldRest = false;

  if (fatigueScore >= 8) {
    recommendation = '🔴 Fatigue élevée détectée. Prends 1-2 jours de repos supplémentaires. Mange plus (surtout des glucides) et dors 8-9h.';
    shouldRest = true;
  } else if (fatigueScore >= 6) {
    recommendation = '🟡 Fatigue modérée. Réduis l\'intensité de 20% cette semaine. Priorité au sommeil et à l\'hydratation.';
    shouldRest = false;
  } else if (fatigueScore >= 4) {
    recommendation = '🟢 Fatigue normale. Continue sur ta lancée. Assure-toi de bien dormir avant les séances lourdes.';
    shouldRest = false;
  } else {
    recommendation = '💚 Récupération excellente. Tu peux pousser un peu plus fort cette semaine.';
    shouldRest = false;
  }

  return { score: fatigueScore, recommendation, shouldRest };
}

// ============================================================
// GÉNÉRATION DU PLAN ADAPTÉ POUR LA PROCHAINE SÉANCE
// ============================================================

export interface NextSessionPlan {
  sessionId: string;
  weekNumber: number;
  exercises: Array<{
    exerciseId: string;
    name: string;
    sets: number;
    repsMin: number;
    repsMax: number | null;
    targetWeight: number;
    notes: string;
    isAdapted: boolean;
  }>;
  estimatedDuration: number;
  coachIntro: string;
}

export function generateNextSessionPlan(
  sessionId: string,
  exercises: Array<{ id: string; name: string; sets: number; repsMin: number; repsMax: number | null; defaultWeight?: number }>,
  adaptations: Record<string, AdaptationResult>,
  weekNumber: number
): NextSessionPlan {
  const phase = weekNumber <= 4 ? 'fondation'
    : weekNumber <= 8 ? 'developpement'
    : weekNumber === 12 ? 'decharge'
    : 'intensification';

  const adaptedExercises = exercises.map(ex => {
    const adaptation = adaptations[ex.id];
    if (adaptation) {
      return {
        exerciseId: ex.id,
        name: ex.name,
        sets: adaptation.suggestedSets,
        repsMin: adaptation.suggestedRepsMin,
        repsMax: adaptation.suggestedRepsMax,
        targetWeight: adaptation.suggestedWeight,
        notes: adaptation.coachMessage,
        isAdapted: true,
      };
    }
    return {
      exerciseId: ex.id,
      name: ex.name,
      sets: ex.sets,
      repsMin: ex.repsMin,
      repsMax: ex.repsMax,
      targetWeight: ex.defaultWeight ?? 0,
      notes: 'Première fois — commence avec un poids modéré pour établir ta base.',
      isAdapted: false,
    };
  });

  const phaseIntros: Record<string, string> = {
    fondation: 'Phase Fondation — Concentre-toi sur la technique parfaite. Les charges viendront.',
    developpement: 'Phase Développement — Pousse fort. Chaque séance doit être un peu plus difficile.',
    intensification: 'Phase Intensification — Intensité maximale. Tu es dans la dernière ligne droite.',
    decharge: '🔄 Semaine de décharge — Allège les charges, récupère. Ton corps va se reconstruire plus fort.',
  };

  return {
    sessionId,
    weekNumber,
    exercises: adaptedExercises,
    estimatedDuration: 65,
    coachIntro: phaseIntros[phase],
  };
}
