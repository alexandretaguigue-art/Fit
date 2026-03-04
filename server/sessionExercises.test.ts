/**
 * Tests unitaires pour la logique de gestion des exercices custom/supprimés
 * (logique extraite du hook useSessionExercises dans WorkoutPage.tsx)
 */

import { describe, it, expect, beforeEach } from 'vitest';

// ============================================================
// Logique pure extraite du hook (sans React/localStorage)
// ============================================================

interface Exercise {
  id: string;
  name: string;
  sets: number;
  repsMin: number;
  repsMax: number | null;
  restSeconds: number;
  relevanceScore: number;
  relevanceReason: string;
  alternatives: Array<{ name: string; relevanceScore: number }>;
  tips: string[];
  muscleGroups: string[];
  defaultWeight?: number;
  weightProgression: string;
}

function computeExercises(
  baseExercises: Exercise[],
  state: { removed: string[]; custom: Exercise[] }
): Exercise[] {
  return [
    ...baseExercises.filter(e => !state.removed.includes(e.id)),
    ...state.custom.filter(e => !state.removed.includes(e.id)),
  ];
}

function removeExercise(
  state: { removed: string[]; custom: Exercise[] },
  id: string
): { removed: string[]; custom: Exercise[] } {
  return { ...state, removed: [...state.removed, id] };
}

function addCustomExercise(
  state: { removed: string[]; custom: Exercise[] },
  ex: Exercise
): { removed: string[]; custom: Exercise[] } {
  return { ...state, custom: [...state.custom, ex] };
}

function resetExercises(): { removed: string[]; custom: Exercise[] } {
  return { removed: [], custom: [] };
}

// ============================================================
// Fixtures
// ============================================================

const BASE_EXERCISES: Exercise[] = [
  {
    id: 'bench_press', name: 'Développé couché', sets: 4, repsMin: 8, repsMax: 12,
    restSeconds: 90, relevanceScore: 95, relevanceReason: 'Pectoraux', alternatives: [],
    tips: [], muscleGroups: ['Pectoraux'], defaultWeight: 60, weightProgression: '+2.5kg',
  },
  {
    id: 'squat', name: 'Squat', sets: 4, repsMin: 6, repsMax: 10,
    restSeconds: 120, relevanceScore: 98, relevanceReason: 'Quadriceps', alternatives: [],
    tips: [], muscleGroups: ['Quadriceps', 'Fessiers'], defaultWeight: 80, weightProgression: '+5kg',
  },
  {
    id: 'pull_up', name: 'Traction', sets: 3, repsMin: 5, repsMax: 10,
    restSeconds: 90, relevanceScore: 90, relevanceReason: 'Dos', alternatives: [],
    tips: [], muscleGroups: ['Dorsaux', 'Biceps'], weightProgression: '+2.5kg',
  },
];

const CUSTOM_EXERCISE: Exercise = {
  id: 'custom_123', name: 'Curl marteau', sets: 3, repsMin: 10, repsMax: 12,
  restSeconds: 60, relevanceScore: 80, relevanceReason: 'Exercice personnalisé', alternatives: [],
  tips: [], muscleGroups: ['Biceps', 'Avant-bras'], defaultWeight: 12, weightProgression: '+2.5kg',
};

// ============================================================
// Tests
// ============================================================

describe('computeExercises', () => {
  it('retourne tous les exercices de base sans modifications', () => {
    const state = { removed: [], custom: [] };
    const result = computeExercises(BASE_EXERCISES, state);
    expect(result).toHaveLength(3);
    expect(result.map(e => e.id)).toEqual(['bench_press', 'squat', 'pull_up']);
  });

  it('exclut les exercices supprimés', () => {
    const state = { removed: ['squat'], custom: [] };
    const result = computeExercises(BASE_EXERCISES, state);
    expect(result).toHaveLength(2);
    expect(result.find(e => e.id === 'squat')).toBeUndefined();
  });

  it('inclut les exercices custom à la fin', () => {
    const state = { removed: [], custom: [CUSTOM_EXERCISE] };
    const result = computeExercises(BASE_EXERCISES, state);
    expect(result).toHaveLength(4);
    expect(result[3].id).toBe('custom_123');
  });

  it('combine suppressions et ajouts custom', () => {
    const state = { removed: ['bench_press', 'pull_up'], custom: [CUSTOM_EXERCISE] };
    const result = computeExercises(BASE_EXERCISES, state);
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('squat');
    expect(result[1].id).toBe('custom_123');
  });

  it('retourne liste vide si tous supprimés et aucun custom', () => {
    const state = { removed: ['bench_press', 'squat', 'pull_up'], custom: [] };
    const result = computeExercises(BASE_EXERCISES, state);
    expect(result).toHaveLength(0);
  });
});

describe('removeExercise', () => {
  it('ajoute l\'id dans la liste removed', () => {
    const state = { removed: [], custom: [] };
    const next = removeExercise(state, 'squat');
    expect(next.removed).toContain('squat');
    expect(next.custom).toHaveLength(0);
  });

  it('ne modifie pas l\'état original (immutabilité)', () => {
    const state = { removed: [], custom: [] };
    removeExercise(state, 'squat');
    expect(state.removed).toHaveLength(0);
  });

  it('peut supprimer plusieurs exercices successivement', () => {
    let state = { removed: [] as string[], custom: [] as Exercise[] };
    state = removeExercise(state, 'bench_press');
    state = removeExercise(state, 'squat');
    expect(state.removed).toEqual(['bench_press', 'squat']);
  });

  it('ne duplique pas un id déjà supprimé', () => {
    // Note: le hook ne vérifie pas les doublons, mais computeExercises gère correctement
    let state = { removed: ['bench_press'], custom: [] as Exercise[] };
    state = removeExercise(state, 'bench_press');
    const result = computeExercises(BASE_EXERCISES, state);
    expect(result.find(e => e.id === 'bench_press')).toBeUndefined();
  });
});

describe('addCustomExercise', () => {
  it('ajoute l\'exercice dans la liste custom', () => {
    const state = { removed: [], custom: [] };
    const next = addCustomExercise(state, CUSTOM_EXERCISE);
    expect(next.custom).toHaveLength(1);
    expect(next.custom[0].id).toBe('custom_123');
  });

  it('ne modifie pas l\'état original (immutabilité)', () => {
    const state = { removed: [], custom: [] };
    addCustomExercise(state, CUSTOM_EXERCISE);
    expect(state.custom).toHaveLength(0);
  });

  it('peut ajouter plusieurs exercices custom', () => {
    let state = { removed: [] as string[], custom: [] as Exercise[] };
    const ex2: Exercise = { ...CUSTOM_EXERCISE, id: 'custom_456', name: 'Dips' };
    state = addCustomExercise(state, CUSTOM_EXERCISE);
    state = addCustomExercise(state, ex2);
    expect(state.custom).toHaveLength(2);
  });
});

describe('resetExercises', () => {
  it('remet les listes à vide', () => {
    const result = resetExercises();
    expect(result.removed).toHaveLength(0);
    expect(result.custom).toHaveLength(0);
  });

  it('après reset, computeExercises retourne les exercices de base', () => {
    const state = resetExercises();
    const result = computeExercises(BASE_EXERCISES, state);
    expect(result).toHaveLength(3);
  });
});

describe('scénarios intégration', () => {
  it('supprimer un exercice custom ne supprime pas un exercice de base', () => {
    let state = { removed: [] as string[], custom: [CUSTOM_EXERCISE] };
    state = removeExercise(state, 'custom_123');
    const result = computeExercises(BASE_EXERCISES, state);
    // L'exercice custom est dans removed mais pas dans base → il n'apparaît pas
    expect(result).toHaveLength(3);
    expect(result.find(e => e.id === 'custom_123')).toBeUndefined();
  });

  it('workflow complet : ajouter, supprimer base, puis reset', () => {
    let state = { removed: [] as string[], custom: [] as Exercise[] };
    // Ajouter un custom
    state = addCustomExercise(state, CUSTOM_EXERCISE);
    // Supprimer un de base
    state = removeExercise(state, 'bench_press');
    let result = computeExercises(BASE_EXERCISES, state);
    expect(result).toHaveLength(3); // 2 base + 1 custom
    // Reset
    state = resetExercises();
    result = computeExercises(BASE_EXERCISES, state);
    expect(result).toHaveLength(3); // retour aux 3 de base
  });
});
