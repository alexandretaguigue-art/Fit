// ============================================================
// MOTEUR DE RÉCUPÉRATION MUSCULAIRE v2
// Calcule l'état de fatigue/récupération de chaque groupe musculaire
// en tenant compte de :
//   - Les séances enregistrées (charge par muscle)
//   - Le temps écoulé depuis chaque séance
//   - Les jours de repos (accélèrent la récupération)
//   - La nutrition (calories et protéines suffisantes = meilleure récup)
//   - La fréquence des séances (surcharge si trop fréquent)
//
// Échelle : 0.0 = frais (bleu cyan), 1.0 = épuisé (rouge)
// ============================================================

export type MuscleGroup =
  | 'chest'          // Pectoraux
  | 'shoulders'      // Épaules (deltoïdes)
  | 'triceps'        // Triceps
  | 'biceps'         // Biceps
  | 'forearms'       // Avant-bras
  | 'traps'          // Trapèzes
  | 'back'           // Dos (grand dorsal + rhomboïdes + érecteurs)
  | 'abs'            // Abdominaux + obliques
  | 'glutes'         // Fessiers
  | 'quads'          // Quadriceps
  | 'hamstrings'     // Ischio-jambiers
  | 'calves';        // Mollets

// Temps de récupération complet par groupe musculaire (en heures)
// Basé sur la littérature sportive
export const RECOVERY_HOURS: Record<MuscleGroup, number> = {
  chest:      72,
  shoulders:  48,
  triceps:    48,
  biceps:     48,
  forearms:   36,
  traps:      48,
  back:       72,
  abs:        24,
  glutes:     72,
  quads:      72,
  hamstrings: 72,
  calves:     48,
};

// ============================================================
// MUSCLES SOLLICITÉS PAR SESSION
// Intensité : 1.0 = muscle principal, 0.5 = secondaire, 0.3 = stabilisateur
// ============================================================

export type MuscleLoad = Partial<Record<MuscleGroup, number>>;

export const SESSION_MUSCLE_LOADS: Record<string, MuscleLoad> = {
  upper_a: {
    chest:     1.0,
    shoulders: 0.8,
    triceps:   0.8,
    traps:     0.3,
    abs:       0.2,
  },
  upper_b: {
    back:      1.0,
    traps:     0.8,
    shoulders: 0.6,
    biceps:    0.9,
    forearms:  0.5,
    abs:       0.2,
  },
  lower_a: {
    quads:     1.0,
    glutes:    0.9,
    hamstrings:0.5,
    calves:    0.4,
    abs:       0.3,
  },
  lower_b: {
    hamstrings:1.0,
    glutes:    0.9,
    quads:     0.4,
    calves:    0.8,
    back:      0.4,
    abs:       0.2,
  },
  football: {
    quads:     0.8,
    hamstrings:0.8,
    calves:    0.7,
    glutes:    0.6,
    abs:       0.5,
    chest:     0.2,
    shoulders: 0.2,
    triceps:   0.2,
  },
  running_endurance: {
    quads:     0.7,
    hamstrings:0.7,
    calves:    0.9,
    glutes:    0.6,
    abs:       0.3,
    back:      0.3,
  },
  running_intervals: {
    quads:     0.9,
    hamstrings:0.9,
    calves:    1.0,
    glutes:    0.7,
    abs:       0.4,
    back:      0.4,
  },
  cycling: {
    quads:     1.0,
    hamstrings:0.5,
    calves:    0.6,
    glutes:    0.7,
    back:      0.3,
    abs:       0.2,
  },
  rest: {},
};

// ============================================================
// TYPES
// ============================================================

export interface MuscleState {
  group: MuscleGroup;
  fatigue: number;             // 0.0 (frais) → 1.0 (épuisé)
  hoursUntilRecovered: number; // Heures restantes avant récupération complète
}

export interface SessionRecord {
  sessionId: string;
  dateKey: string;       // YYYY-MM-DD
  completedAt?: number;  // timestamp ms
}

/**
 * Données de récupération pour un jour donné.
 * Permettent d'ajuster la vitesse de récupération musculaire.
 */
export interface DayRecoveryFactors {
  dateKey: string;          // YYYY-MM-DD
  isRestDay: boolean;       // Jour de repos complet (pas de sport)
  sleepHours?: number;      // Heures de sommeil (7-9h = optimal)
  calorieRatio?: number;    // Ratio calories consommées / objectif (0-1.5)
  proteinRatio?: number;    // Ratio protéines consommées / objectif (0-1.5)
}

// ============================================================
// FACTEURS D'ACCÉLÉRATION DE RÉCUPÉRATION
// ============================================================

/**
 * Calcule le multiplicateur de vitesse de récupération pour un jour donné.
 * 1.0 = vitesse normale
 * > 1.0 = récupération plus rapide
 * < 1.0 = récupération plus lente
 */
function computeRecoveryMultiplier(factors: DayRecoveryFactors): number {
  let multiplier = 1.0;

  // Jour de repos : +30% de récupération
  if (factors.isRestDay) {
    multiplier *= 1.3;
  }

  // Sommeil : 8h = optimal (+20%), moins de 6h = pénalité (-20%)
  if (factors.sleepHours !== undefined) {
    if (factors.sleepHours >= 8) {
      multiplier *= 1.2;
    } else if (factors.sleepHours >= 7) {
      multiplier *= 1.1;
    } else if (factors.sleepHours < 6) {
      multiplier *= 0.8;
    }
  }

  // Calories : manger à sa cible = optimal
  // Déficit > 20% = récupération ralentie
  // Surplus modéré = légèrement meilleur
  if (factors.calorieRatio !== undefined) {
    if (factors.calorieRatio >= 0.95 && factors.calorieRatio <= 1.15) {
      multiplier *= 1.1; // Dans la cible
    } else if (factors.calorieRatio < 0.8) {
      multiplier *= 0.75; // Déficit important
    } else if (factors.calorieRatio < 0.95) {
      multiplier *= 0.9; // Léger déficit
    }
  }

  // Protéines : essentielles pour la synthèse musculaire
  if (factors.proteinRatio !== undefined) {
    if (factors.proteinRatio >= 1.0) {
      multiplier *= 1.15; // Objectif protéines atteint
    } else if (factors.proteinRatio < 0.7) {
      multiplier *= 0.7; // Protéines insuffisantes
    } else if (factors.proteinRatio < 0.9) {
      multiplier *= 0.9;
    }
  }

  return Math.max(0.3, Math.min(2.0, multiplier)); // Bornes : 0.3x → 2.0x
}

// ============================================================
// CALCUL PRINCIPAL
// ============================================================

/**
 * Calcule l'état de fatigue de tous les groupes musculaires
 * en tenant compte des séances, du repos, et de la nutrition.
 *
 * @param sessions - Séances enregistrées
 * @param recoveryFactors - Facteurs de récupération par jour (optionnel)
 * @param now - Timestamp actuel (ms)
 */
export function computeMuscleStates(
  sessions: SessionRecord[],
  recoveryFactors: DayRecoveryFactors[] = [],
  now: number = Date.now()
): Map<MuscleGroup, MuscleState> {
  const states = new Map<MuscleGroup, MuscleState>();

  // Initialiser tous les muscles à 0 (frais)
  const allMuscles = Object.keys(RECOVERY_HOURS) as MuscleGroup[];
  for (const muscle of allMuscles) {
    states.set(muscle, { group: muscle, fatigue: 0, hoursUntilRecovered: 0 });
  }

  // Construire une map dateKey → multiplicateur de récupération
  const recoveryMultipliers = new Map<string, number>();
  for (const factors of recoveryFactors) {
    recoveryMultipliers.set(factors.dateKey, computeRecoveryMultiplier(factors));
  }

  // Pour chaque séance, calculer la fatigue résiduelle
  for (const session of sessions) {
    const loads = SESSION_MUSCLE_LOADS[session.sessionId];
    if (!loads) continue;

    // Timestamp de la séance
    let sessionTime: number;
    if (session.completedAt) {
      sessionTime = session.completedAt;
    } else {
      const [year, month, day] = session.dateKey.split('-').map(Number);
      const d = new Date(year, month - 1, day, 22, 0, 0);
      sessionTime = d.getTime();
    }

    const hoursElapsed = (now - sessionTime) / (1000 * 60 * 60);
    if (hoursElapsed < 0) continue;

    // Calculer les heures effectives de récupération en tenant compte
    // des multiplicateurs journaliers entre la séance et maintenant
    let effectiveHoursElapsed = hoursElapsed;
    {
      // Parcourir les jours entre la séance et maintenant
      const sessionDate = new Date(sessionTime);
      const nowDate = new Date(now);
      let bonusHours = 0;

      const cursor = new Date(sessionDate);
      cursor.setHours(0, 0, 0, 0);
      cursor.setDate(cursor.getDate() + 1); // Commencer au lendemain

      while (cursor <= nowDate) {
        const dk = `${cursor.getFullYear()}-${String(cursor.getMonth()+1).padStart(2,'0')}-${String(cursor.getDate()).padStart(2,'0')}`;
        const mult = recoveryMultipliers.get(dk) ?? 1.0;
        if (mult > 1.0) {
          // Ce jour a accéléré la récupération : ajouter des heures bonus
          bonusHours += 24 * (mult - 1.0);
        } else if (mult < 1.0) {
          // Ce jour a ralenti la récupération : retirer des heures
          bonusHours -= 24 * (1.0 - mult);
        }
        cursor.setDate(cursor.getDate() + 1);
      }

      effectiveHoursElapsed = Math.max(0, hoursElapsed + bonusHours);
    }

    for (const [muscleStr, intensity] of Object.entries(loads)) {
      const muscle = muscleStr as MuscleGroup;
      const recoveryHours = RECOVERY_HOURS[muscle];
      if (!recoveryHours || !intensity) continue;

      // Fatigue résiduelle avec décroissance exponentielle
      const progress = Math.min(effectiveHoursElapsed / recoveryHours, 1.0);
      const residualFatigue = intensity * Math.exp(-3 * progress);

      const current = states.get(muscle)!;
      const newFatigue = Math.min(current.fatigue + residualFatigue, 1.0);

      // Heures restantes de récupération (avec multiplicateur moyen)
      const avgMultiplier = recoveryFactors.length > 0
        ? Array.from(recoveryMultipliers.values()).reduce((a, b) => a + b, 0) / recoveryMultipliers.size
        : 1.0;
      const rawHoursLeft = Math.max(0, recoveryHours - hoursElapsed);
      const adjustedHoursLeft = Math.max(0, rawHoursLeft / Math.max(avgMultiplier, 0.5));

      states.set(muscle, {
        group: muscle,
        fatigue: newFatigue,
        hoursUntilRecovered: Math.max(current.hoursUntilRecovered, Math.round(adjustedHoursLeft)),
      });
    }
  }

  return states;
}

// ============================================================
// UTILITAIRES
// ============================================================

export type MuscleStateLabel = 'fresh' | 'recovered' | 'light' | 'moderate' | 'fatigued' | 'exhausted';

export function fatigueToStateLabel(fatigue: number): MuscleStateLabel {
  if (fatigue < 0.05) return 'fresh';
  if (fatigue < 0.2)  return 'recovered';
  if (fatigue < 0.4)  return 'light';
  if (fatigue < 0.65) return 'moderate';
  if (fatigue < 0.85) return 'fatigued';
  return 'exhausted';
}

export function fatigueLabel(fatigue: number): string {
  const s = fatigueToStateLabel(fatigue);
  const labels: Record<MuscleStateLabel, string> = {
    fresh:     'Non sollicité',
    recovered: 'Récupéré',
    light:     'Légère fatigue',
    moderate:  'Fatigue modérée',
    fatigued:  'Fatigué',
    exhausted: 'Épuisé',
  };
  return labels[s];
}

export function fatigueToColor(fatigue: number): [number, number, number] {
  if (fatigue < 0.05) return [0.0, 0.75, 1.0];   // bleu cyan
  if (fatigue < 0.2)  return [0.13, 0.77, 0.37];  // vert
  if (fatigue < 0.5) {
    const t = (fatigue - 0.2) / 0.3;
    return [0.13 + t * 0.87, 0.77 - t * 0.24, 0.37 * (1 - t)];
  }
  const t = (fatigue - 0.5) / 0.5;
  return [1.0, (1.0 - t) * 0.53, 0.13 * (1 - t)];
}

export const MUSCLE_LABELS: Record<MuscleGroup, string> = {
  chest:      'Pectoraux',
  shoulders:  'Épaules',
  triceps:    'Triceps',
  biceps:     'Biceps',
  forearms:   'Avant-bras',
  traps:      'Trapèzes',
  back:       'Dos',
  abs:        'Abdominaux',
  glutes:     'Fessiers',
  quads:      'Quadriceps',
  hamstrings: 'Ischio-jambiers',
  calves:     'Mollets',
};
