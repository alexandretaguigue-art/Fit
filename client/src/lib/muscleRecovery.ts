// ============================================================
// MOTEUR DE RÉCUPÉRATION MUSCULAIRE
// Calcule l'état de fatigue/récupération de chaque groupe musculaire
// basé sur les séances enregistrées et le temps écoulé.
//
// Échelle : 0.0 = récupéré (vert), 1.0 = fatigué (rouge)
// ============================================================

// ============================================================
// GROUPES MUSCULAIRES
// ============================================================

export type MuscleGroup =
  | 'chest'          // Pectoraux
  | 'front_delts'    // Deltoïdes antérieurs
  | 'side_delts'     // Deltoïdes latéraux
  | 'rear_delts'     // Deltoïdes postérieurs
  | 'triceps'        // Triceps
  | 'biceps'         // Biceps
  | 'forearms'       // Avant-bras
  | 'traps'          // Trapèzes
  | 'lats'           // Grand dorsal
  | 'lower_back'     // Bas du dos / érecteurs
  | 'abs'            // Abdominaux
  | 'obliques'       // Obliques
  | 'glutes'         // Fessiers
  | 'quads'          // Quadriceps
  | 'hamstrings'     // Ischio-jambiers
  | 'calves'         // Mollets
  | 'hip_flexors'    // Fléchisseurs de hanche
  | 'adductors';     // Adducteurs

// Temps de récupération complet par groupe musculaire (en heures)
// Basé sur la littérature sportive : grands muscles = plus long
export const RECOVERY_HOURS: Record<MuscleGroup, number> = {
  chest:       72,  // Pec : 48-72h
  front_delts: 48,  // Delts ant : 48h
  side_delts:  48,  // Delts lat : 48h
  rear_delts:  48,  // Delts post : 48h
  triceps:     48,  // Triceps : 48h
  biceps:      48,  // Biceps : 48h
  forearms:    36,  // Avant-bras : 36h
  traps:       48,  // Trapèzes : 48h
  lats:        72,  // Grand dorsal : 72h
  lower_back:  72,  // Bas du dos : 72h
  abs:         24,  // Abdos : 24h (récupèrent vite)
  obliques:    24,  // Obliques : 24h
  glutes:      72,  // Fessiers : 72h
  quads:       72,  // Quadriceps : 72h
  hamstrings:  72,  // Ischio : 72h
  calves:      48,  // Mollets : 48h
  hip_flexors: 48,  // Fléchisseurs : 48h
  adductors:   48,  // Adducteurs : 48h
};

// ============================================================
// MUSCLES SOLLICITÉS PAR SESSION
// Intensité : 1.0 = muscle principal, 0.5 = muscle secondaire, 0.3 = stabilisateur
// ============================================================

export type MuscleLoad = Partial<Record<MuscleGroup, number>>;

export const SESSION_MUSCLE_LOADS: Record<string, MuscleLoad> = {
  // === HAUT DU CORPS A : Pec / Épaules / Triceps ===
  upper_a: {
    chest:       1.0,
    front_delts: 0.8,
    side_delts:  0.5,
    triceps:     0.8,
    traps:       0.3,
    abs:         0.2,
  },

  // === HAUT DU CORPS B : Dos / Biceps / Épaules post ===
  upper_b: {
    lats:        1.0,
    traps:       0.8,
    rear_delts:  0.8,
    biceps:      0.9,
    forearms:    0.5,
    lower_back:  0.4,
    abs:         0.2,
  },

  // === BAS DU CORPS A : Quadriceps / Fessiers ===
  lower_a: {
    quads:       1.0,
    glutes:      0.9,
    hamstrings:  0.5,
    calves:      0.4,
    hip_flexors: 0.4,
    adductors:   0.4,
    lower_back:  0.3,
    abs:         0.3,
  },

  // === BAS DU CORPS B : Ischio / Fessiers / Mollets ===
  lower_b: {
    hamstrings:  1.0,
    glutes:      0.9,
    quads:       0.4,
    calves:      0.8,
    lower_back:  0.5,
    adductors:   0.4,
    abs:         0.2,
  },

  // === FOOTBALL : Corps entier, cardio intense ===
  football: {
    quads:       0.8,
    hamstrings:  0.8,
    calves:      0.7,
    glutes:      0.6,
    hip_flexors: 0.8,
    adductors:   0.7,
    abs:         0.5,
    obliques:    0.4,
    lower_back:  0.4,
    // Haut du corps moins sollicité
    chest:       0.2,
    front_delts: 0.2,
    triceps:     0.2,
  },

  // === COURSE ENDURANCE : Jambes + cardio ===
  running_endurance: {
    quads:       0.7,
    hamstrings:  0.7,
    calves:      0.9,
    glutes:      0.6,
    hip_flexors: 0.7,
    abs:         0.3,
    lower_back:  0.3,
  },

  // === COURSE FRACTIONNÉE : Plus intense sur les jambes ===
  running_intervals: {
    quads:       0.9,
    hamstrings:  0.9,
    calves:      1.0,
    glutes:      0.7,
    hip_flexors: 0.8,
    abs:         0.4,
    lower_back:  0.4,
  },

  // === VÉLO : Quadriceps dominant ===
  cycling: {
    quads:       1.0,
    hamstrings:  0.5,
    calves:      0.6,
    glutes:      0.7,
    hip_flexors: 0.6,
    lower_back:  0.3,
    abs:         0.2,
  },

  // === REPOS : Aucune charge ===
  rest: {},
};

// ============================================================
// CALCUL DE L'ÉTAT MUSCULAIRE
// ============================================================

export interface MuscleState {
  group: MuscleGroup;
  fatigue: number;      // 0.0 (récupéré) → 1.0 (fatigué)
  hoursUntilRecovered: number;  // Heures restantes avant récupération complète
}

export interface SessionRecord {
  sessionId: string;
  dateKey: string;  // YYYY-MM-DD
  completedAt?: number;  // timestamp ms (si disponible)
}

/**
 * Calcule l'état de fatigue de tous les groupes musculaires
 * en fonction des séances enregistrées et du temps écoulé.
 *
 * @param sessions - Séances enregistrées (les plus récentes en premier)
 * @param now - Timestamp actuel (ms), défaut = Date.now()
 * @returns Map de l'état de chaque groupe musculaire
 */
export function computeMuscleStates(
  sessions: SessionRecord[],
  now: number = Date.now()
): Map<MuscleGroup, MuscleState> {
  const states = new Map<MuscleGroup, MuscleState>();

  // Initialiser tous les muscles à 0 (récupérés)
  const allMuscles = Object.keys(RECOVERY_HOURS) as MuscleGroup[];
  for (const muscle of allMuscles) {
    states.set(muscle, { group: muscle, fatigue: 0, hoursUntilRecovered: 0 });
  }

  // Pour chaque séance, calculer la fatigue résiduelle de chaque muscle
  for (const session of sessions) {
    const loads = SESSION_MUSCLE_LOADS[session.sessionId];
    if (!loads) continue;

    // Calculer le timestamp de la séance
    let sessionTime: number;
    if (session.completedAt) {
      sessionTime = session.completedAt;
    } else {
      // Utiliser la fin de journée (22h) comme heure par défaut
      const [year, month, day] = session.dateKey.split('-').map(Number);
      const d = new Date(year, month - 1, day, 22, 0, 0);
      sessionTime = d.getTime();
    }

    const hoursElapsed = (now - sessionTime) / (1000 * 60 * 60);
    if (hoursElapsed < 0) continue; // Séance future, ignorer

    for (const [muscleStr, intensity] of Object.entries(loads)) {
      const muscle = muscleStr as MuscleGroup;
      const recoveryHours = RECOVERY_HOURS[muscle];
      if (!recoveryHours || !intensity) continue;

      // Fatigue résiduelle : décroît linéairement de intensity → 0 sur recoveryHours
      // On utilise une courbe exponentielle pour un rendu plus réaliste
      const progress = Math.min(hoursElapsed / recoveryHours, 1.0);
      // Décroissance exponentielle : fatigue = intensity * e^(-3 * progress)
      const residualFatigue = intensity * Math.exp(-3 * progress);

      // Accumuler la fatigue (plusieurs séances peuvent s'additionner)
      const current = states.get(muscle)!;
      const newFatigue = Math.min(current.fatigue + residualFatigue, 1.0);
      const hoursUntilRecovered = Math.max(0, recoveryHours - hoursElapsed);

      states.set(muscle, {
        group: muscle,
        fatigue: newFatigue,
        hoursUntilRecovered: Math.max(current.hoursUntilRecovered, hoursUntilRecovered),
      });
    }
  }

  return states;
}

/**
 * Convertit un niveau de fatigue (0-1) en couleur RGB hologramme.
 * 0.0 = vert néon (#00FF88)
 * 0.5 = orange (#FF8800)
 * 1.0 = rouge vif (#FF2244)
 * Fond : bleu hologramme (#0088FF) pour les muscles non sollicités
 */
export function fatigueToColor(fatigue: number): [number, number, number] {
  if (fatigue < 0.05) {
    // Muscle récupéré : vert néon
    return [0.0, 1.0, 0.53];
  }
  if (fatigue < 0.5) {
    // Vert → Orange
    const t = fatigue / 0.5;
    return [t, 1.0 - t * 0.47, 0.53 * (1 - t)];
  }
  // Orange → Rouge
  const t = (fatigue - 0.5) / 0.5;
  return [1.0, (1.0 - t) * 0.53, 0.13 * (1 - t)];
}

/**
 * Retourne un label lisible pour le niveau de fatigue.
 */
export function fatigueLabel(fatigue: number): string {
  if (fatigue < 0.1) return 'Récupéré';
  if (fatigue < 0.3) return 'Légère fatigue';
  if (fatigue < 0.6) return 'Fatigue modérée';
  if (fatigue < 0.85) return 'Fatigue élevée';
  return 'Épuisé';
}

/**
 * Retourne le nom français d'un groupe musculaire.
 */
export const MUSCLE_LABELS: Record<MuscleGroup, string> = {
  chest:       'Pectoraux',
  front_delts: 'Deltoïdes ant.',
  side_delts:  'Deltoïdes lat.',
  rear_delts:  'Deltoïdes post.',
  triceps:     'Triceps',
  biceps:      'Biceps',
  forearms:    'Avant-bras',
  traps:       'Trapèzes',
  lats:        'Grand dorsal',
  lower_back:  'Bas du dos',
  abs:         'Abdominaux',
  obliques:    'Obliques',
  glutes:      'Fessiers',
  quads:       'Quadriceps',
  hamstrings:  'Ischio-jambiers',
  calves:      'Mollets',
  hip_flexors: 'Fléchisseurs hanche',
  adductors:   'Adducteurs',
};
