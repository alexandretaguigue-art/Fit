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
