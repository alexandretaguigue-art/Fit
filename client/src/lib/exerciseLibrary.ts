// ============================================================
// BIBLIOTHÈQUE COMPLÈTE D'EXERCICES — FitPro
// Source unique de vérité pour l'ajout d'exercices custom
// ============================================================

export interface LibraryExercise {
  id: string;
  name: string;
  muscleGroups: string[];       // muscles principaux
  secondaryMuscles?: string[];  // muscles secondaires
  equipment: 'barre' | 'haltères' | 'machine' | 'poulie' | 'poids du corps' | 'kettlebell' | 'élastique' | 'smith';
  category: 'pectoraux' | 'dos' | 'épaules' | 'biceps' | 'triceps' | 'jambes' | 'fessiers' | 'abdominaux' | 'mollets' | 'avant-bras' | 'full body';
  defaultSets: number;
  defaultRepsMin: number;
  defaultRepsMax: number;
  defaultRestSeconds: number;
  defaultWeight?: number;       // kg suggéré débutant
  tips?: string[];
}

export const EXERCISE_LIBRARY: LibraryExercise[] = [
  // ============================================================
  // PECTORAUX
  // ============================================================
  {
    id: 'developpe_couche_barre',
    name: 'Développé couché (barre)',
    muscleGroups: ['Pectoraux'],
    secondaryMuscles: ['Triceps', 'Épaules antérieures'],
    equipment: 'barre',
    category: 'pectoraux',
    defaultSets: 4, defaultRepsMin: 6, defaultRepsMax: 10, defaultRestSeconds: 120, defaultWeight: 40,
    tips: ['Descends la barre jusqu\'au sternum', 'Garde les omoplates rétractées'],
  },
  {
    id: 'developpe_couche_halteres',
    name: 'Développé couché (haltères)',
    muscleGroups: ['Pectoraux'],
    secondaryMuscles: ['Triceps', 'Épaules antérieures'],
    equipment: 'haltères',
    category: 'pectoraux',
    defaultSets: 4, defaultRepsMin: 8, defaultRepsMax: 12, defaultRestSeconds: 90, defaultWeight: 20,
  },
  {
    id: 'developpe_incline_barre',
    name: 'Développé incliné (barre)',
    muscleGroups: ['Pectoraux supérieurs'],
    secondaryMuscles: ['Épaules antérieures', 'Triceps'],
    equipment: 'barre',
    category: 'pectoraux',
    defaultSets: 3, defaultRepsMin: 8, defaultRepsMax: 10, defaultRestSeconds: 90, defaultWeight: 35,
  },
  {
    id: 'developpe_incline_halteres',
    name: 'Développé incliné (haltères)',
    muscleGroups: ['Pectoraux supérieurs'],
    secondaryMuscles: ['Épaules antérieures', 'Triceps'],
    equipment: 'haltères',
    category: 'pectoraux',
    defaultSets: 3, defaultRepsMin: 10, defaultRepsMax: 12, defaultRestSeconds: 90, defaultWeight: 16,
  },
  {
    id: 'developpe_decline_barre',
    name: 'Développé décliné (barre)',
    muscleGroups: ['Pectoraux inférieurs'],
    secondaryMuscles: ['Triceps'],
    equipment: 'barre',
    category: 'pectoraux',
    defaultSets: 3, defaultRepsMin: 8, defaultRepsMax: 12, defaultRestSeconds: 90, defaultWeight: 40,
  },
  {
    id: 'ecarte_couche_halteres',
    name: 'Écarté couché (haltères)',
    muscleGroups: ['Pectoraux'],
    secondaryMuscles: ['Épaules antérieures'],
    equipment: 'haltères',
    category: 'pectoraux',
    defaultSets: 3, defaultRepsMin: 12, defaultRepsMax: 15, defaultRestSeconds: 60, defaultWeight: 12,
  },
  {
    id: 'ecarte_incline_halteres',
    name: 'Écarté incliné (haltères)',
    muscleGroups: ['Pectoraux supérieurs'],
    equipment: 'haltères',
    category: 'pectoraux',
    defaultSets: 3, defaultRepsMin: 12, defaultRepsMax: 15, defaultRestSeconds: 60, defaultWeight: 10,
  },
  {
    id: 'cable_fly_bas',
    name: 'Cable fly (poulie basse)',
    muscleGroups: ['Pectoraux inférieurs'],
    equipment: 'poulie',
    category: 'pectoraux',
    defaultSets: 3, defaultRepsMin: 12, defaultRepsMax: 15, defaultRestSeconds: 60,
  },
  {
    id: 'cable_fly_haut',
    name: 'Cable fly (poulie haute)',
    muscleGroups: ['Pectoraux supérieurs'],
    equipment: 'poulie',
    category: 'pectoraux',
    defaultSets: 3, defaultRepsMin: 12, defaultRepsMax: 15, defaultRestSeconds: 60,
  },
  {
    id: 'cable_fly_croise',
    name: 'Cable fly croisé (pec deck)',
    muscleGroups: ['Pectoraux'],
    equipment: 'poulie',
    category: 'pectoraux',
    defaultSets: 3, defaultRepsMin: 12, defaultRepsMax: 15, defaultRestSeconds: 60,
  },
  {
    id: 'pec_deck',
    name: 'Pec deck (machine)',
    muscleGroups: ['Pectoraux'],
    equipment: 'machine',
    category: 'pectoraux',
    defaultSets: 3, defaultRepsMin: 12, defaultRepsMax: 15, defaultRestSeconds: 60,
  },
  {
    id: 'dips_pectoraux',
    name: 'Dips (pectoraux)',
    muscleGroups: ['Pectoraux inférieurs'],
    secondaryMuscles: ['Triceps', 'Épaules antérieures'],
    equipment: 'poids du corps',
    category: 'pectoraux',
    defaultSets: 3, defaultRepsMin: 8, defaultRepsMax: 12, defaultRestSeconds: 90,
    tips: ['Penche le torse vers l\'avant pour cibler les pectoraux'],
  },
  {
    id: 'pompes',
    name: 'Pompes',
    muscleGroups: ['Pectoraux'],
    secondaryMuscles: ['Triceps', 'Épaules'],
    equipment: 'poids du corps',
    category: 'pectoraux',
    defaultSets: 4, defaultRepsMin: 15, defaultRepsMax: 20, defaultRestSeconds: 60,
  },
  {
    id: 'pompes_inclines',
    name: 'Pompes inclinées (pieds surélevés)',
    muscleGroups: ['Pectoraux supérieurs'],
    secondaryMuscles: ['Épaules antérieures'],
    equipment: 'poids du corps',
    category: 'pectoraux',
    defaultSets: 3, defaultRepsMin: 12, defaultRepsMax: 20, defaultRestSeconds: 60,
  },
  {
    id: 'developpe_smith',
    name: 'Développé couché (Smith machine)',
    muscleGroups: ['Pectoraux'],
    secondaryMuscles: ['Triceps'],
    equipment: 'smith',
    category: 'pectoraux',
    defaultSets: 4, defaultRepsMin: 8, defaultRepsMax: 12, defaultRestSeconds: 90, defaultWeight: 40,
  },

  // ============================================================
  // DOS
  // ============================================================
  {
    id: 'tractions_pronation',
    name: 'Tractions (prise pronation)',
    muscleGroups: ['Grand dorsal'],
    secondaryMuscles: ['Biceps', 'Rhomboïdes'],
    equipment: 'poids du corps',
    category: 'dos',
    defaultSets: 4, defaultRepsMin: 6, defaultRepsMax: 10, defaultRestSeconds: 120,
  },
  {
    id: 'tractions_supination',
    name: 'Tractions (prise supination / chin-ups)',
    muscleGroups: ['Grand dorsal', 'Biceps'],
    equipment: 'poids du corps',
    category: 'dos',
    defaultSets: 4, defaultRepsMin: 6, defaultRepsMax: 10, defaultRestSeconds: 120,
  },
  {
    id: 'tirage_vertical_large',
    name: 'Tirage vertical prise large (lat pulldown)',
    muscleGroups: ['Grand dorsal'],
    secondaryMuscles: ['Biceps', 'Rhomboïdes'],
    equipment: 'poulie',
    category: 'dos',
    defaultSets: 4, defaultRepsMin: 8, defaultRepsMax: 12, defaultRestSeconds: 90,
  },
  {
    id: 'tirage_vertical_serre',
    name: 'Tirage vertical prise serrée',
    muscleGroups: ['Grand dorsal'],
    secondaryMuscles: ['Biceps'],
    equipment: 'poulie',
    category: 'dos',
    defaultSets: 3, defaultRepsMin: 10, defaultRepsMax: 12, defaultRestSeconds: 90,
  },
  {
    id: 'rowing_barre_pronation',
    name: 'Rowing barre (prise pronation)',
    muscleGroups: ['Grand dorsal', 'Rhomboïdes'],
    secondaryMuscles: ['Biceps', 'Trapèzes'],
    equipment: 'barre',
    category: 'dos',
    defaultSets: 4, defaultRepsMin: 6, defaultRepsMax: 10, defaultRestSeconds: 120, defaultWeight: 50,
  },
  {
    id: 'rowing_barre_supination',
    name: 'Rowing barre (prise supination)',
    muscleGroups: ['Grand dorsal', 'Biceps'],
    equipment: 'barre',
    category: 'dos',
    defaultSets: 4, defaultRepsMin: 8, defaultRepsMax: 10, defaultRestSeconds: 90, defaultWeight: 45,
  },
  {
    id: 'rowing_haltere_unilateral',
    name: 'Rowing haltère unilatéral',
    muscleGroups: ['Grand dorsal', 'Rhomboïdes'],
    secondaryMuscles: ['Biceps'],
    equipment: 'haltères',
    category: 'dos',
    defaultSets: 4, defaultRepsMin: 10, defaultRepsMax: 12, defaultRestSeconds: 75, defaultWeight: 24,
  },
  {
    id: 'tirage_horizontal_poulie',
    name: 'Tirage horizontal (poulie basse)',
    muscleGroups: ['Grand dorsal', 'Rhomboïdes'],
    secondaryMuscles: ['Biceps', 'Trapèzes'],
    equipment: 'poulie',
    category: 'dos',
    defaultSets: 4, defaultRepsMin: 10, defaultRepsMax: 12, defaultRestSeconds: 90,
  },
  {
    id: 'face_pull_poulie',
    name: 'Face pull (poulie haute)',
    muscleGroups: ['Trapèzes', 'Deltoïdes postérieurs'],
    secondaryMuscles: ['Rotateurs externes'],
    equipment: 'poulie',
    category: 'dos',
    defaultSets: 3, defaultRepsMin: 15, defaultRepsMax: 20, defaultRestSeconds: 60,
  },
  {
    id: 'souleve_de_terre_conventionnel',
    name: 'Soulevé de terre (conventionnel)',
    muscleGroups: ['Érecteurs du rachis', 'Ischio-jambiers', 'Fessiers'],
    secondaryMuscles: ['Grand dorsal', 'Trapèzes'],
    equipment: 'barre',
    category: 'dos',
    defaultSets: 4, defaultRepsMin: 4, defaultRepsMax: 6, defaultRestSeconds: 180, defaultWeight: 60,
    tips: ['Dos droit tout au long du mouvement', 'Barre proche du corps'],
  },
  {
    id: 'souleve_sumo',
    name: 'Soulevé de terre sumo',
    muscleGroups: ['Fessiers', 'Ischio-jambiers', 'Érecteurs du rachis'],
    equipment: 'barre',
    category: 'dos',
    defaultSets: 4, defaultRepsMin: 5, defaultRepsMax: 8, defaultRestSeconds: 150, defaultWeight: 60,
  },
  {
    id: 'rdl_barre',
    name: 'Romanian deadlift (barre)',
    muscleGroups: ['Ischio-jambiers', 'Fessiers'],
    secondaryMuscles: ['Érecteurs du rachis'],
    equipment: 'barre',
    category: 'dos',
    defaultSets: 3, defaultRepsMin: 8, defaultRepsMax: 12, defaultRestSeconds: 90, defaultWeight: 50,
  },
  {
    id: 'rdl_halteres',
    name: 'Romanian deadlift (haltères)',
    muscleGroups: ['Ischio-jambiers', 'Fessiers'],
    equipment: 'haltères',
    category: 'dos',
    defaultSets: 3, defaultRepsMin: 10, defaultRepsMax: 12, defaultRestSeconds: 90, defaultWeight: 20,
  },
  {
    id: 'hyperextension',
    name: 'Hyperextension (banc romain)',
    muscleGroups: ['Érecteurs du rachis', 'Fessiers'],
    secondaryMuscles: ['Ischio-jambiers'],
    equipment: 'machine',
    category: 'dos',
    defaultSets: 3, defaultRepsMin: 12, defaultRepsMax: 15, defaultRestSeconds: 60,
  },
  {
    id: 'shrugs_barre',
    name: 'Shrugs (barre)',
    muscleGroups: ['Trapèzes'],
    equipment: 'barre',
    category: 'dos',
    defaultSets: 3, defaultRepsMin: 12, defaultRepsMax: 15, defaultRestSeconds: 60, defaultWeight: 60,
  },
  {
    id: 'shrugs_halteres',
    name: 'Shrugs (haltères)',
    muscleGroups: ['Trapèzes'],
    equipment: 'haltères',
    category: 'dos',
    defaultSets: 3, defaultRepsMin: 12, defaultRepsMax: 15, defaultRestSeconds: 60, defaultWeight: 25,
  },
  {
    id: 'good_morning',
    name: 'Good morning (barre)',
    muscleGroups: ['Érecteurs du rachis', 'Ischio-jambiers'],
    equipment: 'barre',
    category: 'dos',
    defaultSets: 3, defaultRepsMin: 10, defaultRepsMax: 12, defaultRestSeconds: 90, defaultWeight: 30,
  },

  // ============================================================
  // ÉPAULES
  // ============================================================
  {
    id: 'developpe_militaire_barre',
    name: 'Développé militaire (barre)',
    muscleGroups: ['Deltoïdes antérieurs', 'Deltoïdes médiaux'],
    secondaryMuscles: ['Triceps', 'Trapèzes'],
    equipment: 'barre',
    category: 'épaules',
    defaultSets: 4, defaultRepsMin: 6, defaultRepsMax: 8, defaultRestSeconds: 120, defaultWeight: 40,
  },
  {
    id: 'developpe_militaire_halteres',
    name: 'Développé militaire (haltères)',
    muscleGroups: ['Deltoïdes antérieurs', 'Deltoïdes médiaux'],
    secondaryMuscles: ['Triceps'],
    equipment: 'haltères',
    category: 'épaules',
    defaultSets: 4, defaultRepsMin: 8, defaultRepsMax: 12, defaultRestSeconds: 90, defaultWeight: 14,
  },
  {
    id: 'developpe_arnold',
    name: 'Développé Arnold',
    muscleGroups: ['Deltoïdes (3 faisceaux)'],
    secondaryMuscles: ['Triceps'],
    equipment: 'haltères',
    category: 'épaules',
    defaultSets: 3, defaultRepsMin: 10, defaultRepsMax: 12, defaultRestSeconds: 90, defaultWeight: 12,
  },
  {
    id: 'elevations_laterales_halteres',
    name: 'Élévations latérales (haltères)',
    muscleGroups: ['Deltoïdes médiaux'],
    equipment: 'haltères',
    category: 'épaules',
    defaultSets: 4, defaultRepsMin: 12, defaultRepsMax: 15, defaultRestSeconds: 60, defaultWeight: 8,
    tips: ['Coudes légèrement fléchis', 'Arrête à hauteur des épaules'],
  },
  {
    id: 'elevations_laterales_poulie',
    name: 'Élévations latérales (poulie basse)',
    muscleGroups: ['Deltoïdes médiaux'],
    equipment: 'poulie',
    category: 'épaules',
    defaultSets: 3, defaultRepsMin: 12, defaultRepsMax: 15, defaultRestSeconds: 60,
  },
  {
    id: 'elevations_frontales',
    name: 'Élévations frontales (haltères)',
    muscleGroups: ['Deltoïdes antérieurs'],
    equipment: 'haltères',
    category: 'épaules',
    defaultSets: 3, defaultRepsMin: 12, defaultRepsMax: 15, defaultRestSeconds: 60, defaultWeight: 8,
  },
  {
    id: 'oiseau_halteres',
    name: 'Oiseau / Écarté arrière (haltères)',
    muscleGroups: ['Deltoïdes postérieurs', 'Rhomboïdes'],
    equipment: 'haltères',
    category: 'épaules',
    defaultSets: 3, defaultRepsMin: 12, defaultRepsMax: 15, defaultRestSeconds: 60, defaultWeight: 8,
  },
  {
    id: 'upright_row',
    name: 'Tirage menton (upright row)',
    muscleGroups: ['Deltoïdes médiaux', 'Trapèzes'],
    equipment: 'barre',
    category: 'épaules',
    defaultSets: 3, defaultRepsMin: 10, defaultRepsMax: 12, defaultRestSeconds: 75, defaultWeight: 30,
  },
  {
    id: 'machine_shoulder_press',
    name: 'Développé épaules (machine)',
    muscleGroups: ['Deltoïdes antérieurs', 'Deltoïdes médiaux'],
    equipment: 'machine',
    category: 'épaules',
    defaultSets: 3, defaultRepsMin: 10, defaultRepsMax: 12, defaultRestSeconds: 90,
  },
  {
    id: 'reverse_fly_machine',
    name: 'Reverse fly (machine)',
    muscleGroups: ['Deltoïdes postérieurs', 'Rhomboïdes'],
    equipment: 'machine',
    category: 'épaules',
    defaultSets: 3, defaultRepsMin: 12, defaultRepsMax: 15, defaultRestSeconds: 60,
  },

  // ============================================================
  // BICEPS
  // ============================================================
  {
    id: 'curl_barre_debout',
    name: 'Curl barre debout',
    muscleGroups: ['Biceps'],
    secondaryMuscles: ['Avant-bras'],
    equipment: 'barre',
    category: 'biceps',
    defaultSets: 4, defaultRepsMin: 8, defaultRepsMax: 12, defaultRestSeconds: 75, defaultWeight: 25,
  },
  {
    id: 'curl_barre_ez',
    name: 'Curl barre EZ',
    muscleGroups: ['Biceps', 'Brachial'],
    equipment: 'barre',
    category: 'biceps',
    defaultSets: 4, defaultRepsMin: 8, defaultRepsMax: 12, defaultRestSeconds: 75, defaultWeight: 22,
  },
  {
    id: 'curl_halteres_alternes',
    name: 'Curl haltères alternés',
    muscleGroups: ['Biceps'],
    equipment: 'haltères',
    category: 'biceps',
    defaultSets: 3, defaultRepsMin: 10, defaultRepsMax: 12, defaultRestSeconds: 75, defaultWeight: 12,
  },
  {
    id: 'curl_incline_halteres',
    name: 'Curl incliné (haltères)',
    muscleGroups: ['Biceps (chef long)'],
    equipment: 'haltères',
    category: 'biceps',
    defaultSets: 3, defaultRepsMin: 10, defaultRepsMax: 12, defaultRestSeconds: 75, defaultWeight: 10,
  },
  {
    id: 'curl_marteau',
    name: 'Curl marteau (haltères)',
    muscleGroups: ['Brachial', 'Brachioradial'],
    secondaryMuscles: ['Biceps'],
    equipment: 'haltères',
    category: 'biceps',
    defaultSets: 3, defaultRepsMin: 10, defaultRepsMax: 12, defaultRestSeconds: 75, defaultWeight: 12,
  },
  {
    id: 'curl_concentration',
    name: 'Curl concentration',
    muscleGroups: ['Biceps'],
    equipment: 'haltères',
    category: 'biceps',
    defaultSets: 3, defaultRepsMin: 12, defaultRepsMax: 15, defaultRestSeconds: 60, defaultWeight: 10,
  },
  {
    id: 'curl_poulie_basse',
    name: 'Curl poulie basse',
    muscleGroups: ['Biceps'],
    equipment: 'poulie',
    category: 'biceps',
    defaultSets: 3, defaultRepsMin: 12, defaultRepsMax: 15, defaultRestSeconds: 60,
  },
  {
    id: 'curl_marteau_cable',
    name: 'Curl marteau (câble)',
    muscleGroups: ['Brachial', 'Brachioradial'],
    equipment: 'poulie',
    category: 'biceps',
    defaultSets: 3, defaultRepsMin: 12, defaultRepsMax: 15, defaultRestSeconds: 60,
  },
  {
    id: 'curl_spider',
    name: 'Curl spider (banc incliné)',
    muscleGroups: ['Biceps (pic)'],
    equipment: 'barre',
    category: 'biceps',
    defaultSets: 3, defaultRepsMin: 10, defaultRepsMax: 12, defaultRestSeconds: 75, defaultWeight: 20,
  },
  {
    id: 'reverse_curl_barre',
    name: 'Reverse curl (barre)',
    muscleGroups: ['Brachioradial', 'Avant-bras'],
    equipment: 'barre',
    category: 'biceps',
    defaultSets: 3, defaultRepsMin: 12, defaultRepsMax: 15, defaultRestSeconds: 60, defaultWeight: 15,
  },

  // ============================================================
  // TRICEPS
  // ============================================================
  {
    id: 'dips_triceps',
    name: 'Dips (triceps)',
    muscleGroups: ['Triceps'],
    secondaryMuscles: ['Pectoraux', 'Épaules'],
    equipment: 'poids du corps',
    category: 'triceps',
    defaultSets: 4, defaultRepsMin: 8, defaultRepsMax: 12, defaultRestSeconds: 90,
    tips: ['Garde le torse vertical pour cibler les triceps'],
  },
  {
    id: 'extension_triceps_poulie_haute',
    name: 'Extension triceps (poulie haute)',
    muscleGroups: ['Triceps'],
    equipment: 'poulie',
    category: 'triceps',
    defaultSets: 4, defaultRepsMin: 12, defaultRepsMax: 15, defaultRestSeconds: 60,
  },
  {
    id: 'skull_crusher_barre',
    name: 'Skull crusher (barre EZ)',
    muscleGroups: ['Triceps'],
    equipment: 'barre',
    category: 'triceps',
    defaultSets: 3, defaultRepsMin: 10, defaultRepsMax: 12, defaultRestSeconds: 75, defaultWeight: 20,
  },
  {
    id: 'extension_triceps_tete_haltere',
    name: 'Extension triceps au-dessus de la tête (haltère)',
    muscleGroups: ['Triceps (chef long)'],
    equipment: 'haltères',
    category: 'triceps',
    defaultSets: 3, defaultRepsMin: 12, defaultRepsMax: 15, defaultRestSeconds: 60, defaultWeight: 16,
  },
  {
    id: 'kickback_haltere',
    name: 'Kickback (haltère)',
    muscleGroups: ['Triceps'],
    equipment: 'haltères',
    category: 'triceps',
    defaultSets: 3, defaultRepsMin: 12, defaultRepsMax: 15, defaultRestSeconds: 60, defaultWeight: 8,
  },
  {
    id: 'developpe_couche_prise_serree',
    name: 'Développé couché prise serrée',
    muscleGroups: ['Triceps'],
    secondaryMuscles: ['Pectoraux'],
    equipment: 'barre',
    category: 'triceps',
    defaultSets: 4, defaultRepsMin: 8, defaultRepsMax: 10, defaultRestSeconds: 90, defaultWeight: 40,
  },
  {
    id: 'pushdown_corde',
    name: 'Pushdown (corde)',
    muscleGroups: ['Triceps'],
    equipment: 'poulie',
    category: 'triceps',
    defaultSets: 3, defaultRepsMin: 12, defaultRepsMax: 15, defaultRestSeconds: 60,
  },
  {
    id: 'diamond_pushups',
    name: 'Pompes diamant',
    muscleGroups: ['Triceps'],
    secondaryMuscles: ['Pectoraux'],
    equipment: 'poids du corps',
    category: 'triceps',
    defaultSets: 3, defaultRepsMin: 12, defaultRepsMax: 20, defaultRestSeconds: 60,
  },

  // ============================================================
  // JAMBES — QUADRICEPS
  // ============================================================
  {
    id: 'squat_barre',
    name: 'Squat (barre)',
    muscleGroups: ['Quadriceps', 'Fessiers'],
    secondaryMuscles: ['Ischio-jambiers', 'Mollets'],
    equipment: 'barre',
    category: 'jambes',
    defaultSets: 4, defaultRepsMin: 5, defaultRepsMax: 8, defaultRestSeconds: 180, defaultWeight: 60,
    tips: ['Descends jusqu\'à ce que les cuisses soient parallèles au sol', 'Genoux dans l\'axe des pieds'],
  },
  {
    id: 'squat_gobelet',
    name: 'Squat gobelet (haltère)',
    muscleGroups: ['Quadriceps', 'Fessiers'],
    equipment: 'haltères',
    category: 'jambes',
    defaultSets: 3, defaultRepsMin: 12, defaultRepsMax: 15, defaultRestSeconds: 90, defaultWeight: 20,
  },
  {
    id: 'squat_hack',
    name: 'Hack squat (machine)',
    muscleGroups: ['Quadriceps'],
    secondaryMuscles: ['Fessiers'],
    equipment: 'machine',
    category: 'jambes',
    defaultSets: 4, defaultRepsMin: 8, defaultRepsMax: 12, defaultRestSeconds: 120,
  },
  {
    id: 'presse_cuisses',
    name: 'Presse cuisses (45°)',
    muscleGroups: ['Quadriceps', 'Fessiers'],
    secondaryMuscles: ['Ischio-jambiers'],
    equipment: 'machine',
    category: 'jambes',
    defaultSets: 4, defaultRepsMin: 8, defaultRepsMax: 12, defaultRestSeconds: 120,
  },
  {
    id: 'leg_extension_machine',
    name: 'Leg extension (machine)',
    muscleGroups: ['Quadriceps'],
    equipment: 'machine',
    category: 'jambes',
    defaultSets: 3, defaultRepsMin: 12, defaultRepsMax: 15, defaultRestSeconds: 75,
  },
  {
    id: 'fentes_avant',
    name: 'Fentes avant (haltères)',
    muscleGroups: ['Quadriceps', 'Fessiers'],
    secondaryMuscles: ['Ischio-jambiers'],
    equipment: 'haltères',
    category: 'jambes',
    defaultSets: 3, defaultRepsMin: 10, defaultRepsMax: 12, defaultRestSeconds: 90, defaultWeight: 16,
  },
  {
    id: 'fentes_bulgares',
    name: 'Fentes bulgares (haltères)',
    muscleGroups: ['Quadriceps', 'Fessiers'],
    secondaryMuscles: ['Ischio-jambiers'],
    equipment: 'haltères',
    category: 'jambes',
    defaultSets: 3, defaultRepsMin: 10, defaultRepsMax: 12, defaultRestSeconds: 90, defaultWeight: 14,
  },
  {
    id: 'step_up',
    name: 'Step up (haltères)',
    muscleGroups: ['Quadriceps', 'Fessiers'],
    equipment: 'haltères',
    category: 'jambes',
    defaultSets: 3, defaultRepsMin: 10, defaultRepsMax: 12, defaultRestSeconds: 75, defaultWeight: 12,
  },
  {
    id: 'squat_pause',
    name: 'Squat pause (2 sec en bas)',
    muscleGroups: ['Quadriceps', 'Fessiers'],
    equipment: 'barre',
    category: 'jambes',
    defaultSets: 4, defaultRepsMin: 5, defaultRepsMax: 8, defaultRestSeconds: 180, defaultWeight: 50,
  },
  {
    id: 'pistol_squat',
    name: 'Pistol squat (poids du corps)',
    muscleGroups: ['Quadriceps', 'Fessiers'],
    equipment: 'poids du corps',
    category: 'jambes',
    defaultSets: 3, defaultRepsMin: 5, defaultRepsMax: 8, defaultRestSeconds: 120,
  },

  // ============================================================
  // JAMBES — ISCHIO-JAMBIERS
  // ============================================================
  {
    id: 'leg_curl_couche',
    name: 'Leg curl couché (machine)',
    muscleGroups: ['Ischio-jambiers'],
    equipment: 'machine',
    category: 'jambes',
    defaultSets: 4, defaultRepsMin: 10, defaultRepsMax: 12, defaultRestSeconds: 75,
  },
  {
    id: 'leg_curl_assis',
    name: 'Leg curl assis (machine)',
    muscleGroups: ['Ischio-jambiers'],
    equipment: 'machine',
    category: 'jambes',
    defaultSets: 3, defaultRepsMin: 12, defaultRepsMax: 15, defaultRestSeconds: 75,
  },
  {
    id: 'nordic_hamstring',
    name: 'Nordic hamstring curl',
    muscleGroups: ['Ischio-jambiers'],
    equipment: 'poids du corps',
    category: 'jambes',
    defaultSets: 3, defaultRepsMin: 5, defaultRepsMax: 8, defaultRestSeconds: 120,
    tips: ['Exercice très intense — commence avec des séries courtes'],
  },
  {
    id: 'glute_ham_raise',
    name: 'Glute ham raise',
    muscleGroups: ['Ischio-jambiers', 'Fessiers'],
    equipment: 'machine',
    category: 'jambes',
    defaultSets: 3, defaultRepsMin: 8, defaultRepsMax: 10, defaultRestSeconds: 90,
  },

  // ============================================================
  // FESSIERS
  // ============================================================
  {
    id: 'hip_thrust_barre',
    name: 'Hip thrust (barre)',
    muscleGroups: ['Fessiers'],
    secondaryMuscles: ['Ischio-jambiers'],
    equipment: 'barre',
    category: 'fessiers',
    defaultSets: 4, defaultRepsMin: 8, defaultRepsMax: 12, defaultRestSeconds: 90, defaultWeight: 60,
    tips: ['Pousse les hanches vers le haut en contractant fort les fessiers'],
  },
  {
    id: 'hip_thrust_machine',
    name: 'Hip thrust (machine)',
    muscleGroups: ['Fessiers'],
    equipment: 'machine',
    category: 'fessiers',
    defaultSets: 4, defaultRepsMin: 10, defaultRepsMax: 12, defaultRestSeconds: 90,
  },
  {
    id: 'pont_fessier',
    name: 'Pont fessier (poids du corps)',
    muscleGroups: ['Fessiers'],
    secondaryMuscles: ['Ischio-jambiers'],
    equipment: 'poids du corps',
    category: 'fessiers',
    defaultSets: 3, defaultRepsMin: 15, defaultRepsMax: 20, defaultRestSeconds: 60,
  },
  {
    id: 'abduction_hanche_machine',
    name: 'Abduction hanche (machine)',
    muscleGroups: ['Fessiers (moyen)'],
    equipment: 'machine',
    category: 'fessiers',
    defaultSets: 3, defaultRepsMin: 15, defaultRepsMax: 20, defaultRestSeconds: 60,
  },
  {
    id: 'kick_back_poulie',
    name: 'Kick-back fessier (poulie basse)',
    muscleGroups: ['Fessiers'],
    equipment: 'poulie',
    category: 'fessiers',
    defaultSets: 3, defaultRepsMin: 15, defaultRepsMax: 20, defaultRestSeconds: 60,
  },

  // ============================================================
  // MOLLETS
  // ============================================================
  {
    id: 'mollets_debout_machine',
    name: 'Mollets debout (machine)',
    muscleGroups: ['Gastrocnémiens'],
    equipment: 'machine',
    category: 'mollets',
    defaultSets: 4, defaultRepsMin: 12, defaultRepsMax: 15, defaultRestSeconds: 60,
  },
  {
    id: 'mollets_assis_machine',
    name: 'Mollets assis (machine)',
    muscleGroups: ['Soléaire'],
    equipment: 'machine',
    category: 'mollets',
    defaultSets: 4, defaultRepsMin: 15, defaultRepsMax: 20, defaultRestSeconds: 60,
  },
  {
    id: 'mollets_barre',
    name: 'Mollets debout (barre)',
    muscleGroups: ['Gastrocnémiens'],
    equipment: 'barre',
    category: 'mollets',
    defaultSets: 4, defaultRepsMin: 12, defaultRepsMax: 15, defaultRestSeconds: 60, defaultWeight: 40,
  },
  {
    id: 'mollets_poids_corps',
    name: 'Mollets (poids du corps)',
    muscleGroups: ['Gastrocnémiens', 'Soléaire'],
    equipment: 'poids du corps',
    category: 'mollets',
    defaultSets: 4, defaultRepsMin: 20, defaultRepsMax: 30, defaultRestSeconds: 45,
  },
  {
    id: 'mollets_presse',
    name: 'Mollets à la presse',
    muscleGroups: ['Gastrocnémiens'],
    equipment: 'machine',
    category: 'mollets',
    defaultSets: 3, defaultRepsMin: 15, defaultRepsMax: 20, defaultRestSeconds: 60,
  },

  // ============================================================
  // ABDOMINAUX
  // ============================================================
  {
    id: 'gainage_planche',
    name: 'Gainage planche',
    muscleGroups: ['Abdominaux', 'Transverse'],
    equipment: 'poids du corps',
    category: 'abdominaux',
    defaultSets: 3, defaultRepsMin: 30, defaultRepsMax: 60, defaultRestSeconds: 60,
    tips: ['Maintiens la position en secondes', 'Corps aligné de la tête aux talons'],
  },
  {
    id: 'crunch_classique',
    name: 'Crunch classique',
    muscleGroups: ['Abdominaux (droit)'],
    equipment: 'poids du corps',
    category: 'abdominaux',
    defaultSets: 3, defaultRepsMin: 15, defaultRepsMax: 20, defaultRestSeconds: 60,
  },
  {
    id: 'crunch_poulie',
    name: 'Crunch poulie haute',
    muscleGroups: ['Abdominaux (droit)'],
    equipment: 'poulie',
    category: 'abdominaux',
    defaultSets: 3, defaultRepsMin: 15, defaultRepsMax: 20, defaultRestSeconds: 60,
  },
  {
    id: 'releve_jambes_suspendu',
    name: 'Relevé de jambes suspendu',
    muscleGroups: ['Abdominaux inférieurs', 'Fléchisseurs de hanche'],
    equipment: 'poids du corps',
    category: 'abdominaux',
    defaultSets: 3, defaultRepsMin: 10, defaultRepsMax: 15, defaultRestSeconds: 75,
  },
  {
    id: 'russian_twist',
    name: 'Russian twist',
    muscleGroups: ['Obliques'],
    equipment: 'poids du corps',
    category: 'abdominaux',
    defaultSets: 3, defaultRepsMin: 20, defaultRepsMax: 30, defaultRestSeconds: 60,
  },
  {
    id: 'ab_wheel',
    name: 'Ab wheel (roue abdominale)',
    muscleGroups: ['Abdominaux', 'Transverse'],
    equipment: 'poids du corps',
    category: 'abdominaux',
    defaultSets: 3, defaultRepsMin: 8, defaultRepsMax: 12, defaultRestSeconds: 75,
  },
  {
    id: 'bicycle_crunch',
    name: 'Bicycle crunch',
    muscleGroups: ['Obliques', 'Abdominaux'],
    equipment: 'poids du corps',
    category: 'abdominaux',
    defaultSets: 3, defaultRepsMin: 20, defaultRepsMax: 30, defaultRestSeconds: 60,
  },
  {
    id: 'dragon_flag',
    name: 'Dragon flag',
    muscleGroups: ['Abdominaux', 'Transverse'],
    equipment: 'poids du corps',
    category: 'abdominaux',
    defaultSets: 3, defaultRepsMin: 5, defaultRepsMax: 8, defaultRestSeconds: 90,
  },
  {
    id: 'pallof_press',
    name: 'Pallof press (poulie)',
    muscleGroups: ['Obliques', 'Transverse'],
    equipment: 'poulie',
    category: 'abdominaux',
    defaultSets: 3, defaultRepsMin: 12, defaultRepsMax: 15, defaultRestSeconds: 60,
  },
  {
    id: 'mountain_climbers',
    name: 'Mountain climbers',
    muscleGroups: ['Abdominaux', 'Fléchisseurs de hanche'],
    equipment: 'poids du corps',
    category: 'abdominaux',
    defaultSets: 3, defaultRepsMin: 20, defaultRepsMax: 30, defaultRestSeconds: 60,
  },

  // ============================================================
  // AVANT-BRAS
  // ============================================================
  {
    id: 'wrist_curl_barre',
    name: 'Wrist curl (barre)',
    muscleGroups: ['Fléchisseurs avant-bras'],
    equipment: 'barre',
    category: 'avant-bras',
    defaultSets: 3, defaultRepsMin: 15, defaultRepsMax: 20, defaultRestSeconds: 45, defaultWeight: 10,
  },
  {
    id: 'reverse_wrist_curl',
    name: 'Reverse wrist curl',
    muscleGroups: ['Extenseurs avant-bras'],
    equipment: 'barre',
    category: 'avant-bras',
    defaultSets: 3, defaultRepsMin: 15, defaultRepsMax: 20, defaultRestSeconds: 45, defaultWeight: 8,
  },
  {
    id: 'farmer_walk',
    name: 'Farmer walk (marche lestée)',
    muscleGroups: ['Avant-bras', 'Trapèzes'],
    secondaryMuscles: ['Abdominaux', 'Fessiers'],
    equipment: 'haltères',
    category: 'avant-bras',
    defaultSets: 3, defaultRepsMin: 20, defaultRepsMax: 30, defaultRestSeconds: 90, defaultWeight: 24,
    tips: ['Marche sur 20-30 mètres avec les haltères', 'Dos droit, épaules en arrière'],
  },

  // ============================================================
  // FULL BODY / POLYARTICULAIRES
  // ============================================================
  {
    id: 'burpees',
    name: 'Burpees',
    muscleGroups: ['Full body'],
    equipment: 'poids du corps',
    category: 'full body',
    defaultSets: 4, defaultRepsMin: 10, defaultRepsMax: 15, defaultRestSeconds: 60,
  },
  {
    id: 'thruster_barre',
    name: 'Thruster (barre)',
    muscleGroups: ['Quadriceps', 'Fessiers', 'Épaules'],
    equipment: 'barre',
    category: 'full body',
    defaultSets: 4, defaultRepsMin: 8, defaultRepsMax: 10, defaultRestSeconds: 120, defaultWeight: 30,
  },
  {
    id: 'clean_barre',
    name: 'Clean (barre)',
    muscleGroups: ['Full body', 'Explosivité'],
    equipment: 'barre',
    category: 'full body',
    defaultSets: 4, defaultRepsMin: 4, defaultRepsMax: 6, defaultRestSeconds: 180, defaultWeight: 40,
  },
  {
    id: 'kettlebell_swing',
    name: 'Kettlebell swing',
    muscleGroups: ['Fessiers', 'Ischio-jambiers', 'Dos'],
    equipment: 'kettlebell',
    category: 'full body',
    defaultSets: 4, defaultRepsMin: 15, defaultRepsMax: 20, defaultRestSeconds: 75,
  },
  {
    id: 'turkish_getup',
    name: 'Turkish get-up (kettlebell)',
    muscleGroups: ['Full body', 'Stabilisateurs'],
    equipment: 'kettlebell',
    category: 'full body',
    defaultSets: 3, defaultRepsMin: 3, defaultRepsMax: 5, defaultRestSeconds: 120,
  },
  {
    id: 'box_jump',
    name: 'Box jump',
    muscleGroups: ['Quadriceps', 'Fessiers', 'Mollets'],
    equipment: 'poids du corps',
    category: 'full body',
    defaultSets: 4, defaultRepsMin: 5, defaultRepsMax: 8, defaultRestSeconds: 120,
  },
  {
    id: 'sled_push',
    name: 'Sled push (traîneau)',
    muscleGroups: ['Quadriceps', 'Fessiers', 'Épaules'],
    equipment: 'machine',
    category: 'full body',
    defaultSets: 4, defaultRepsMin: 20, defaultRepsMax: 30, defaultRestSeconds: 120,
    tips: ['Distance de 20-30m par série'],
  },
];

// ============================================================
// HELPERS
// ============================================================

/** Retourne tous les exercices triés par catégorie puis par nom */
export function getExercisesByCategory(): Record<string, LibraryExercise[]> {
  const result: Record<string, LibraryExercise[]> = {};
  for (const ex of EXERCISE_LIBRARY) {
    if (!result[ex.category]) result[ex.category] = [];
    result[ex.category].push(ex);
  }
  // Trier par nom dans chaque catégorie
  for (const cat of Object.keys(result)) {
    result[cat].sort((a, b) => a.name.localeCompare(b.name, 'fr'));
  }
  return result;
}

/** Recherche d'exercices par nom ou groupe musculaire */
export function searchExercises(query: string): LibraryExercise[] {
  const q = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return EXERCISE_LIBRARY.filter(ex => {
    const name = ex.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const muscles = ex.muscleGroups.join(' ').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return name.includes(q) || muscles.includes(q);
  });
}

/** Noms des catégories en français */
export const CATEGORY_LABELS: Record<string, string> = {
  pectoraux: 'Pectoraux',
  dos: 'Dos',
  épaules: 'Épaules',
  biceps: 'Biceps',
  triceps: 'Triceps',
  jambes: 'Jambes',
  fessiers: 'Fessiers',
  abdominaux: 'Abdominaux',
  mollets: 'Mollets',
  'avant-bras': 'Avant-bras',
  'full body': 'Full Body',
};

/** Icônes emoji par catégorie */
export const CATEGORY_ICONS: Record<string, string> = {
  pectoraux: '🫀',
  dos: '🔙',
  épaules: '🏋️',
  biceps: '💪',
  triceps: '💪',
  jambes: '🦵',
  fessiers: '🍑',
  abdominaux: '⚡',
  mollets: '🦶',
  'avant-bras': '🤜',
  'full body': '🔥',
};
