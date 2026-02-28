// ============================================================
// DESIGN: "Coach Nocturne" — Dark Mode Premium Fitness
// Ce fichier contient toutes les données du programme fitness
// sur 3 mois : séances, exercices, nutrition, scoring.
// ============================================================

export interface SetSchemeEntry {
  reps: number;
  weightMultiplier: number; // multiplicateur par rapport au poids de base (1.0 = poids de base)
  label?: string; // ex: 'Activation', 'Travail', 'Intensif', 'Décharge'
  note?: string; // conseil spécifique pour cette série
}

export interface Exercise {
  id: string;
  name: string;
  sets: number;
  repsMin: number;
  repsMax: number | null; // null = durée en secondes
  restSeconds: number;
  relevanceScore: number; // sur 100
  relevanceReason: string;
  alternatives: Array<{
    name: string;
    relevanceScore: number;
  }>;
  tips: string[];
  muscleGroups: string[];
  defaultWeight?: number; // poids suggéré en kg pour débutant
  weightProgression: string; // conseil de progression
  setScheme?: SetSchemeEntry[]; // schéma de séries avec progression/dégression
  imageUrl?: string; // GIF ou image de démonstration
  videoUrl?: string; // vidéo MP4 de démonstration (musclewiki)
}

export interface WorkoutSession {
  id: string;
  day: number; // 1-14 (cycle 14 jours)
  name: string;
  type: 'gym' | 'football' | 'running' | 'cycling' | 'rest';
  focus: string;
  durationMin: number;
  exercises: Exercise[];
  coachNote: string;
  // Pour les séances non-salle :
  cardioDetails?: CardioSession;
}

export interface CardioSession {
  type: 'running_endurance' | 'running_intervals' | 'cycling' | 'football';
  warmupMin: number;
  mainBlocks: CardioBlock[];
  cooldownMin: number;
  totalCaloriesBurned: number; // estimation
  footballDrills?: FootballDrill[];
  scores?: FootballScore[];
}

export interface CardioBlock {
  name: string;
  description: string;
  durationMin?: number;
  reps?: number;
  distance?: string;
  restSeconds?: number;
  intensity: 'low' | 'medium' | 'high' | 'maximal';
  coachTip: string;
}

export interface FootballDrill {
  id: string;
  name: string;
  phase: string;
  durationMin: number;
  reps?: number;
  equipment: string;
  description: string;
  coachTip: string;
  progressionPhase2?: string;
  progressionPhase3?: string;
  videoUrl?: string;  // URL YouTube embed
  imageUrl?: string;  // Image de démonstration
}

export interface FootballScore {
  id: string;
  name: string;
  unit: string;
  target: string;
  description: string;
}

export interface Week {
  weekNumber: number;
  phase: 'Fondation' | 'Développement' | 'Intensification';
  phaseDescription: string;
  volumeMultiplier: number;
  sessions: WorkoutSession[];
}

// Cycle 14 jours : structure principale
export interface Cycle14Day {
  dayNumber: number; // 1-14
  sessionId: string;
  label: string; // ex: "Musculation Haut A"
  type: 'gym' | 'football' | 'running' | 'cycling' | 'rest';
  icon: string;
  colorClass: string;
}

export interface NutrientInfo {
  proteins: number;
  carbs: number;
  fats: number;
  calories: number;
}

export interface FoodItem {
  id: string;
  name: string;
  category: 'proteins' | 'carbs' | 'fats' | 'vegetables';
  relevanceScore: number;
  relevanceReason: string;
  per100g: NutrientInfo;
  tips: string;
  timing?: string; // meilleur moment de consommation
}

export interface SessionLog {
  sessionId: string;
  date: string;
  weekNumber: number;
  exercises: Array<{
    exerciseId: string;
    sets: Array<{
      weight: number;
      reps: number;
      completed: boolean;
    }>;
    alternativeUsed?: string;
    notes?: string;
  }>;
  perceivedDifficulty: number; // 1-10
  energyLevel: number; // 1-10
  overallNotes?: string;
}

export interface ProgressEntry {
  date: string;
  weight: number;
  bodyFat?: number;
  armCircumference?: number; // cm
  thighCircumference?: number; // cm
  waistCircumference?: number; // cm
}

// ============================================================
// DONNÉES DES EXERCICES
// ============================================================

const exerciseDatabase: Record<string, Exercise> = {
  // --- HAUT DU CORPS A (Pectoraux, Épaules, Triceps) ---
  developpe_couche: {
    id: 'developpe_couche',
    imageUrl: 'https://cdn.jefit.com/assets/img/exercises/gifs/26.gif',
    name: 'Développé couché (barre)',
    sets: 4,
    repsMin: 6,
    repsMax: 8,
    restSeconds: 120,
    setScheme: [
      { reps: 12, weightMultiplier: 0.70, label: 'Activation', note: 'Série d’échauffement — sens le mouvement, amplitude complète' },
      { reps: 8,  weightMultiplier: 0.85, label: 'Travail', note: 'Charge de travail principale — forme stricte' },
      { reps: 6,  weightMultiplier: 1.00, label: 'Intensif', note: 'Charge maximale — pousse fort, pas de triche' },
      { reps: 8,  weightMultiplier: 0.85, label: 'Décharge', note: 'Retour à la charge de travail — va chercher l’échec' },
    ],
    relevanceScore: 98,
    relevanceReason: "Exercice roi pour la masse pectorale et l'activation des triceps. Charge lourde possible, idéal pour la surcharge progressive.",
    alternatives: [
      { name: 'Développé couché haltères', relevanceScore: 93 },
      { name: 'Pompes lestées', relevanceScore: 75 },
    ],
    tips: [
      "Descends la barre jusqu'à effleurer le sternum, pas les clavicules.",
      "Garde les omoplates rétractées et les pieds bien à plat au sol.",
      "Phase excentrique (descente) sur 3 secondes pour maximiser le temps sous tension.",
      "Ne verrouille pas complètement les coudes en haut pour garder la tension sur les pectoraux.",
    ],
    muscleGroups: ['Pectoraux', 'Triceps', 'Épaules antérieures'],
    defaultWeight: 40,
    weightProgression: "Si tu complètes 4x8 avec une bonne forme, augmente de 2.5kg la prochaine séance.",
  },
  developpe_militaire: {
    id: 'developpe_militaire',
    videoUrl: 'https://media.musclewiki.com/media/uploads/videos/branded/male-Dumbbells-dumbbell-overhead-press-side.mp4',
    name: 'Développé militaire (haltères)',
    sets: 3,
    repsMin: 8,
    repsMax: 10,
    restSeconds: 90,
    setScheme: [
      { reps: 12, weightMultiplier: 0.75, label: 'Activation', note: 'Chaleur dans les épaules, amplitude complète' },
      { reps: 10, weightMultiplier: 0.90, label: 'Travail', note: 'Charge principale, contracte les deltoïdes en haut' },
      { reps: 8,  weightMultiplier: 1.00, label: 'Intensif', note: 'Charge max, reste contrôlé sur la descente' },
    ],
    relevanceScore: 95,
    relevanceReason: "Développe les épaules (deltoïdes) en masse et en largeur. Les haltères permettent une amplitude plus naturelle que la barre.",
    alternatives: [
      { name: 'Développé Arnold', relevanceScore: 90 },
      { name: 'Développé militaire barre', relevanceScore: 88 },
    ],
    tips: [
      "Pars avec les haltères à hauteur des épaules, paumes vers l'avant.",
      "Pousse verticalement sans cambrer excessivement le dos.",
      "Contracte les abdominaux pendant tout le mouvement pour protéger le bas du dos.",
    ],
    muscleGroups: ['Deltoïdes', 'Trapèzes', 'Triceps'],
    defaultWeight: 14,
    weightProgression: "Augmente de 2kg quand tu complètes 3x10 avec une forme parfaite.",
  },
  dips: {
    id: 'dips',
    videoUrl: 'https://media.musclewiki.com/media/uploads/videos/branded/male-Bodyweight-bench-dips-front.mp4',
    name: 'Dips (lesté si possible)',
    sets: 3,
    repsMin: 8,
    repsMax: 12,
    restSeconds: 90,
    setScheme: [
      { reps: 12, weightMultiplier: 0.00, label: 'Poids de corps', note: 'Sans lest — amplitude maximale, descente 3 secondes' },
      { reps: 10, weightMultiplier: 0.00, label: 'Poids de corps', note: 'Si tu peux, ajoute 5kg de lest' },
      { reps: 8,  weightMultiplier: 1.00, label: 'Lesté', note: 'Avec lest si disponible — va chercher l’échec' },
    ],
    relevanceScore: 97,
    relevanceReason: "Exercice polyarticulaire exceptionnel pour les triceps et la partie basse des pectoraux. Très efficace pour la masse des bras.",
    alternatives: [
      { name: 'Pompes serrées (mains rapprochées)', relevanceScore: 78 },
      { name: 'Extension triceps à la barre', relevanceScore: 82 },
    ],
    tips: [
      "Incline légèrement le buste vers l'avant pour cibler davantage les pectoraux.",
      "Descends jusqu'à ce que les bras forment un angle de 90°.",
      "Si tu fais plus de 12 répétitions facilement, ajoute du lest (ceinture).",
    ],
    muscleGroups: ['Triceps', 'Pectoraux inférieurs', 'Deltoïdes'],
    defaultWeight: 0,
    weightProgression: "Commence au poids de corps. Ajoute 5kg de lest quand tu fais 3x12 facilement.",
  },
  ecarte_incline: {
    id: 'ecarte_incline',
    imageUrl: 'https://cdn.jefit.com/assets/img/exercises/gifs/38.gif',
    name: 'Écarté incliné (haltères)',
    sets: 3,
    repsMin: 10,
    repsMax: 12,
    restSeconds: 60,
    relevanceScore: 88,
    relevanceReason: "Isolation des pectoraux supérieurs. Complète le développé couché pour un développement complet de la poitrine.",
    alternatives: [
      { name: 'Écarté à la poulie croisée', relevanceScore: 90 },
      { name: 'Pompes inclinées', relevanceScore: 70 },
    ],
    tips: [
      "Garde un léger fléchissement des coudes tout au long du mouvement.",
      "Pense à 'enlacer un arbre' pour bien contracter les pectoraux.",
      "Poids plus léger qu'au développé, la forme prime sur la charge.",
    ],
    muscleGroups: ['Pectoraux supérieurs', 'Deltoïdes antérieurs'],
    defaultWeight: 10,
    weightProgression: "Augmente de 2kg quand tu complètes 3x12 avec une amplitude complète.",
  },
  elevations_laterales: {
    id: 'elevations_laterales',
    videoUrl: 'https://media.musclewiki.com/media/uploads/videos/branded/male-Dumbbells-dumbbell-lateral-raise-front.mp4',
    name: 'Élévations latérales (haltères)',
    sets: 4,
    repsMin: 12,
    repsMax: 15,
    restSeconds: 60,
    setScheme: [
      { reps: 15, weightMultiplier: 0.80, label: 'Léger', note: 'Poids léger, amplitude complète, sens le deltoïde latéral' },
      { reps: 12, weightMultiplier: 1.00, label: 'Travail', note: 'Charge principale — évite de balancer le corps' },
      { reps: 12, weightMultiplier: 1.00, label: 'Travail', note: 'Même charge, maintiens la forme' },
      { reps: 15, weightMultiplier: 0.80, label: 'Pump', note: 'Retour au poids léger — va chercher la brûlure, drop set si possible' },
    ],
    relevanceScore: 96,
    relevanceReason: "Exercice clé pour élargir les épaules et créer une silhouette en V. Les deltoïdes latéraux ne sont pas bien sollicités par les exercices polyarticulaires.",
    alternatives: [
      { name: 'Élévations latérales à la poulie basse', relevanceScore: 95 },
      { name: 'Élévations latérales à l\'élastique', relevanceScore: 80 },
    ],
    tips: [
      "Lève les bras jusqu'à la hauteur des épaules, pas plus haut.",
      "Légère rotation externe (pouce légèrement vers le bas, comme vider un verre).",
      "Poids très léger ! La plupart des gens utilisent trop lourd sur cet exercice.",
      "Contrôle la descente sur 2-3 secondes.",
    ],
    muscleGroups: ['Deltoïdes latéraux'],
    defaultWeight: 6,
    weightProgression: "Augmente de 1kg quand tu complètes 4x15 avec une forme stricte.",
  },
  extension_triceps_poulie: {
    id: 'extension_triceps_poulie',
    imageUrl: 'https://cdn.jefit.com/assets/img/exercises/gifs/84.gif',
    name: 'Extension triceps à la poulie haute',
    sets: 3,
    repsMin: 10,
    repsMax: 12,
    restSeconds: 60,
    setScheme: [
      { reps: 15, weightMultiplier: 0.75, label: 'Activation', note: 'Activation des triceps, coudes fixés' },
      { reps: 12, weightMultiplier: 1.00, label: 'Travail', note: 'Charge principale, extension complète' },
      { reps: 10, weightMultiplier: 1.15, label: 'Intensif', note: 'Charge plus lourde — si tu tiens la forme' },
    ],
    relevanceScore: 90,
    relevanceReason: "Isolation directe des triceps. Les triceps représentent 2/3 du volume du bras — les développer est CRUCIAL pour avoir de gros bras.",
    alternatives: [
      { name: 'Kickback avec haltère', relevanceScore: 78 },
      { name: 'Extension triceps au-dessus de la tête', relevanceScore: 85 },
      { name: 'Skull crusher', relevanceScore: 88 },
    ],
    tips: [
      "Garde les coudes collés au corps, seuls les avant-bras bougent.",
      "Extension complète en bas, contraction maximale.",
      "Peut se faire avec corde (meilleure activation) ou barre droite.",
    ],
    muscleGroups: ['Triceps'],
    defaultWeight: 20,
    weightProgression: "Augmente de 2.5kg quand tu complètes 3x12.",
  },

  // --- BAS DU CORPS A (Quadriceps, Fessiers) ---
  squat: {
    id: 'squat',
    imageUrl: 'https://cdn.jefit.com/assets/img/exercises/gifs/12.gif',
    name: 'Squat (barre)',
    sets: 4,
    repsMin: 6,
    repsMax: 8,
    restSeconds: 180,
    setScheme: [
      { reps: 10, weightMultiplier: 0.65, label: 'Activation', note: 'Série d’échauffement — sens la profondeur, genoux dans l’axe des pieds' },
      { reps: 8,  weightMultiplier: 0.80, label: 'Travail', note: 'Charge de travail — descends sous le parallèle' },
      { reps: 6,  weightMultiplier: 1.00, label: 'Intensif', note: 'Charge maximale — technique Valsalva, pousse le sol' },
      { reps: 8,  weightMultiplier: 0.80, label: 'Décharge', note: 'Retour à 80% — va chercher l’échec, amplitude complète' },
    ],
    relevanceScore: 100,
    relevanceReason: "Le roi des exercices. Stimule une libération hormonale (testostérone, GH) unique qui favorise la croissance musculaire globale. Indispensable pour des jambes massives.",
    alternatives: [
      { name: 'Goblet Squat (haltère lourd)', relevanceScore: 82 },
      { name: 'Hack Squat machine', relevanceScore: 88 },
      { name: 'Presse à cuisses', relevanceScore: 85 },
    ],
    tips: [
      "Pieds à largeur d'épaules, légèrement tournés vers l'extérieur (15-30°).",
      "Descends jusqu'à ce que les cuisses soient parallèles au sol minimum.",
      "Garde le dos droit, la poitrine haute, le regard devant toi.",
      "Pousse sur les talons pour remonter, pas sur les orteils.",
      "Respire profondément avant de descendre (technique Valsalva) pour stabiliser le tronc.",
    ],
    muscleGroups: ['Quadriceps', 'Fessiers', 'Ischio-jambiers', 'Lombaires'],
    defaultWeight: 60,
    weightProgression: "Augmente de 2.5kg par séance tant que la forme est parfaite. C'est l'exercice sur lequel tu progresseras le plus vite.",
  },
  presse_cuisses: {
    id: 'presse_cuisses',
    imageUrl: 'https://cdn.jefit.com/assets/img/exercises/gifs/67.gif',
    name: 'Presse à cuisses',
    sets: 3,
    repsMin: 10,
    repsMax: 12,
    restSeconds: 90,
    relevanceScore: 87,
    relevanceReason: "Complément du squat pour un volume supplémentaire sur les quadriceps sans fatiguer le système nerveux central autant.",
    alternatives: [
      { name: 'Fentes marchées avec haltères', relevanceScore: 85 },
      { name: 'Squat bulgare', relevanceScore: 90 },
    ],
    tips: [
      "Position des pieds haute = plus de fessiers/ischio. Position basse = plus de quadriceps.",
      "Ne verrouille pas les genoux en haut.",
      "Amplitude complète pour maximiser l'hypertrophie.",
    ],
    muscleGroups: ['Quadriceps', 'Fessiers'],
    defaultWeight: 80,
    weightProgression: "Augmente de 5kg quand tu complètes 3x12.",
  },
  leg_extension: {
    id: 'leg_extension',
    videoUrl: 'https://media.musclewiki.com/media/uploads/videos/branded/male-machine-leg-extension-front.mp4',
    name: 'Leg Extension',
    sets: 3,
    repsMin: 12,
    repsMax: 15,
    restSeconds: 60,
    relevanceScore: 82,
    relevanceReason: "Isolation directe des quadriceps. Parfait pour finir la séance jambes et créer une congestion maximale.",
    alternatives: [
      { name: 'Sissy Squat (au poids de corps)', relevanceScore: 72 },
      { name: 'Squat bulgare à amplitude réduite', relevanceScore: 78 },
    ],
    tips: [
      "Contraction maximale en haut, tiens 1 seconde.",
      "Descente contrôlée sur 3 secondes.",
      "Attention aux douleurs au genou — si douleur, remplace par des fentes.",
    ],
    muscleGroups: ['Quadriceps'],
    defaultWeight: 40,
    weightProgression: "Augmente de 5kg quand tu complètes 3x15 avec contraction maximale.",
  },
  hip_thrust: {
    id: 'hip_thrust',
    imageUrl: 'https://cdn.jefit.com/assets/img/exercises/gifs/355.gif',
    name: 'Hip Thrust (barre)',
    sets: 4,
    repsMin: 8,
    repsMax: 10,
    restSeconds: 90,
    setScheme: [
      { reps: 12, weightMultiplier: 0.70, label: 'Activation', note: 'Active les fessiers, contraction en haut 2 secondes' },
      { reps: 10, weightMultiplier: 0.85, label: 'Travail', note: 'Charge principale, pousse sur les talons' },
      { reps: 8,  weightMultiplier: 1.00, label: 'Intensif', note: 'Charge max, tiens la position haute 1-2 secondes' },
      { reps: 12, weightMultiplier: 0.75, label: 'Pump', note: 'Retour à 75% — va chercher la brûlure dans les fessiers' },
    ],
    relevanceScore: 94,
    relevanceReason: "Exercice numéro 1 pour les fessiers. Développe la partie supérieure des fessiers et améliore la puissance des hanches, ce qui booste le squat.",
    alternatives: [
      { name: 'Soulevé de terre jambes tendues', relevanceScore: 85 },
      { name: 'Hip Thrust avec haltère', relevanceScore: 88 },
    ],
    tips: [
      "Dos appuyé sur un banc à hauteur des omoplates.",
      "Pousse sur les talons, contracte les fessiers en haut.",
      "Tiens la position haute 1-2 secondes pour maximiser la contraction.",
      "Pieds à largeur de hanches.",
    ],
    muscleGroups: ['Fessiers', 'Ischio-jambiers', 'Lombaires'],
    defaultWeight: 60,
    weightProgression: "Augmente de 5kg quand tu complètes 4x10 avec contraction maximale.",
  },
  releve_jambes: {
    id: 'releve_jambes',
    imageUrl: 'https://cdn.jefit.com/assets/img/exercises/gifs/109.gif',
    name: 'Relevé de jambes suspendu',
    sets: 3,
    repsMin: 15,
    repsMax: 20,
    restSeconds: 60,
    relevanceScore: 92,
    relevanceReason: "Meilleur exercice pour les abdominaux inférieurs. Maintient la définition abdominale tout en renforçant le core.",
    alternatives: [
      { name: 'Crunches au sol', relevanceScore: 70 },
      { name: 'Relevé de jambes allongé', relevanceScore: 80 },
    ],
    tips: [
      "Garde les jambes légèrement fléchies si tu débutes.",
      "Remonte les hanches en fin de mouvement pour maximiser la contraction.",
      "Évite le balancement — mouvement contrôlé.",
    ],
    muscleGroups: ['Abdominaux inférieurs', 'Fléchisseurs de hanche'],
    defaultWeight: 0,
    weightProgression: "Quand tu fais 3x20 facilement, ajoute un haltère entre les pieds.",
  },
  gainage: {
    id: 'gainage',
    imageUrl: 'https://cdn.jefit.com/assets/img/exercises/gifs/194.gif',
    name: 'Gainage planche',
    sets: 3,
    repsMin: 60,
    repsMax: null,
    restSeconds: 60,
    relevanceScore: 85,
    relevanceReason: "Renforce le core profond, essentiel pour la stabilité lors des exercices lourds (squat, soulevé de terre).",
    alternatives: [
      { name: 'Gainage sur les coudes', relevanceScore: 85 },
      { name: 'Ab Wheel', relevanceScore: 90 },
    ],
    tips: [
      "Corps aligné de la tête aux talons.",
      "Contracte les abdominaux, les fessiers ET les quadriceps.",
      "Respire normalement pendant l'exercice.",
    ],
    muscleGroups: ['Core', 'Abdominaux', 'Lombaires'],
    defaultWeight: 0,
    weightProgression: "Progresse vers le gainage dynamique ou l'Ab Wheel.",
  },

  // --- HAUT DU CORPS B (Dos, Épaules, Biceps) ---
  tractions: {
    id: 'tractions',
    imageUrl: 'https://cdn.jefit.com/assets/img/exercises/gifs/3.gif',
    name: 'Tractions (lesté si possible)',
    sets: 4,
    repsMin: 6,
    repsMax: 8,
    restSeconds: 120,
    setScheme: [
      { reps: 8,  weightMultiplier: 0.00, label: 'Poids de corps', note: 'Sans lest — amplitude complète, descente lente 3 secondes' },
      { reps: 6,  weightMultiplier: 0.00, label: 'Poids de corps', note: 'Tire les coudes vers le bas et l’arrière' },
      { reps: 6,  weightMultiplier: 1.00, label: 'Lesté', note: 'Ajoute 5-10kg si possible — charge maximale' },
      { reps: 8,  weightMultiplier: 0.00, label: 'Poids de corps', note: 'Retour poids de corps — va à l’échec' },
    ],
    relevanceScore: 100,
    relevanceReason: "Exercice roi pour le dos et les biceps. Développe le grand dorsal en largeur (le fameux V-taper) et masse les bras de façon fonctionnelle.",
    alternatives: [
      { name: 'Tirage vertical à la poulie haute', relevanceScore: 88 },
      { name: 'Tractions assistées (machine)', relevanceScore: 80 },
    ],
    tips: [
      "Prise légèrement plus large que les épaules, paumes vers l'avant.",
      "Tire les coudes vers le bas et vers l'arrière, pas juste vers le bas.",
      "Monte jusqu'au menton au-dessus de la barre.",
      "Descente complète pour un étirement maximal du grand dorsal.",
      "Si tu ne peux pas faire 6 reps, utilise la machine assistée.",
    ],
    muscleGroups: ['Grand dorsal', 'Biceps', 'Rhomboïdes'],
    defaultWeight: 0,
    weightProgression: "Ajoute 2.5kg de lest quand tu fais 4x8 avec une bonne forme.",
  },
  rowing_barre: {
    id: 'rowing_barre',
    imageUrl: 'https://cdn.jefit.com/assets/img/exercises/gifs/7.gif',
    name: 'Rowing barre buste penché',
    sets: 4,
    repsMin: 6,
    repsMax: 8,
    restSeconds: 120,
    setScheme: [
      { reps: 10, weightMultiplier: 0.70, label: 'Activation', note: 'Échauffement du dos, dos plat, buste à 45°' },
      { reps: 8,  weightMultiplier: 0.85, label: 'Travail', note: 'Charge principale, rétracte les omoplates en fin de mouvement' },
      { reps: 6,  weightMultiplier: 1.00, label: 'Intensif', note: 'Charge max — tire vers le nombril, pas la poitrine' },
      { reps: 8,  weightMultiplier: 0.85, label: 'Décharge', note: 'Retour à 85% — va chercher l’échec' },
    ],
    relevanceScore: 98,
    relevanceReason: "Développe l'épaisseur du dos (rhomboïdes, trapèzes moyens). Complément parfait des tractions qui développent la largeur.",
    alternatives: [
      { name: 'Rowing haltère unilatéral', relevanceScore: 92 },
      { name: 'Rowing à la machine', relevanceScore: 85 },
    ],
    tips: [
      "Buste penché à environ 45°, dos plat, regard vers le bas.",
      "Tire la barre vers le nombril, pas vers la poitrine.",
      "Rétracte les omoplates en fin de mouvement.",
      "Contrôle la descente — ne laisse pas la barre tomber.",
    ],
    muscleGroups: ['Rhomboïdes', 'Trapèzes', 'Grand dorsal', 'Biceps'],
    defaultWeight: 50,
    weightProgression: "Augmente de 2.5kg quand tu complètes 4x8.",
  },
  tirage_horizontal: {
    id: 'tirage_horizontal',
    imageUrl: 'https://cdn.jefit.com/assets/img/exercises/gifs/29.gif',
    name: 'Tirage horizontal (poulie basse)',
    sets: 3,
    repsMin: 10,
    repsMax: 12,
    restSeconds: 90,
    relevanceScore: 88,
    relevanceReason: "Travail d'isolation du dos en position assise. Permet de se concentrer sur la rétraction des omoplates sans la fatigue du bas du dos.",
    alternatives: [
      { name: 'Rowing inversé (sous une barre basse)', relevanceScore: 80 },
      { name: 'Rowing à la machine', relevanceScore: 85 },
    ],
    tips: [
      "Tire les coudes vers l'arrière, pas les mains vers toi.",
      "Garde le dos droit, ne te penche pas en arrière.",
      "Étirement complet en avant pour maximiser l'amplitude.",
    ],
    muscleGroups: ['Rhomboïdes', 'Grand dorsal', 'Biceps'],
    defaultWeight: 50,
    weightProgression: "Augmente de 5kg quand tu complètes 3x12.",
  },
  face_pull: {
    id: 'face_pull',
    imageUrl: 'https://cdn.jefit.com/assets/img/exercises/gifs/638.gif',
    name: 'Face Pull (poulie haute)',
    sets: 3,
    repsMin: 15,
    repsMax: 20,
    restSeconds: 60,
    relevanceScore: 91,
    relevanceReason: "Exercice correctif et de masse pour les deltoïdes postérieurs et les rotateurs externes. Crucial pour la santé des épaules et l'équilibre musculaire.",
    alternatives: [
      { name: 'Oiseaux avec haltères, buste penché', relevanceScore: 82 },
      { name: 'Élévations latérales penchées', relevanceScore: 80 },
    ],
    tips: [
      "Tire la corde vers le visage, coudes hauts.",
      "Rotation externe des épaules en fin de mouvement.",
      "Poids léger, amplitude complète. Cet exercice protège tes épaules.",
    ],
    muscleGroups: ['Deltoïdes postérieurs', 'Rotateurs externes', 'Trapèzes'],
    defaultWeight: 15,
    weightProgression: "Augmente de 2.5kg quand tu complètes 3x20.",
  },
  curl_incline: {
    id: 'curl_incline',
    imageUrl: 'https://cdn.jefit.com/assets/img/exercises/gifs/33.gif',
    name: 'Curl incliné (haltères)',
    sets: 3,
    repsMin: 10,
    repsMax: 12,
    restSeconds: 60,
    setScheme: [
      { reps: 12, weightMultiplier: 0.80, label: 'Activation', note: 'Poids léger, sens l’étirement maximal du biceps' },
      { reps: 10, weightMultiplier: 1.00, label: 'Travail', note: 'Charge principale — supination complète, descente 3-4 secondes' },
      { reps: 8,  weightMultiplier: 1.15, label: 'Intensif', note: 'Charge plus lourde — si la forme reste parfaite' },
    ],
    relevanceScore: 95,
    relevanceReason: "Position inclinée = étirement maximal du biceps = recrutement maximal des fibres. C'est l'exercice de biceps le plus efficace pour la masse.",
    alternatives: [
      { name: 'Curl avec haltères debout', relevanceScore: 85 },
      { name: 'Curl à la barre EZ', relevanceScore: 88 },
    ],
    tips: [
      "Banc incliné à 45-60°. Bras qui pendent librement derrière le corps.",
      "Supination complète (rotation de la paume vers le haut) pendant la montée.",
      "Contraction maximale en haut, descente très lente (3-4 secondes).",
      "Ne balance pas le corps — mouvement strict.",
    ],
    muscleGroups: ['Biceps', 'Brachial'],
    defaultWeight: 10,
    weightProgression: "Augmente de 2kg quand tu complètes 3x12 avec une forme parfaite.",
  },
  curl_marteau: {
    id: 'curl_marteau',
    videoUrl: 'https://media.musclewiki.com/media/uploads/videos/branded/male-Dumbbells-dumbbell-hammer-curl-front.mp4',
    name: 'Curl marteau',
    sets: 3,
    repsMin: 8,
    repsMax: 10,
    restSeconds: 60,
    setScheme: [
      { reps: 12, weightMultiplier: 0.80, label: 'Activation', note: 'Prise neutre, coudes fixés, mouvement strict' },
      { reps: 10, weightMultiplier: 1.00, label: 'Travail', note: 'Charge principale — ne tourne pas le poignet' },
      { reps: 8,  weightMultiplier: 1.15, label: 'Intensif', note: 'Charge lourde — épaisseur du bras, pas de balancement' },
    ],
    relevanceScore: 90,
    relevanceReason: "Développe le brachial (sous le biceps) et le brachioradial (avant-bras). Donne de l'épaisseur et de la largeur au bras, pas seulement du pic.",
    alternatives: [
      { name: 'Curl marteau à la corde (poulie basse)', relevanceScore: 88 },
      { name: 'Curl inversé', relevanceScore: 80 },
    ],
    tips: [
      "Prise neutre (pouce vers le haut), ne tourne pas le poignet.",
      "Mouvement strict, coudes collés au corps.",
      "Complète les curls inclinés pour un développement complet du bras.",
    ],
    muscleGroups: ['Brachial', 'Brachioradial', 'Biceps'],
    defaultWeight: 12,
    weightProgression: "Augmente de 2kg quand tu complètes 3x10.",
  },

  // --- BAS DU CORPS B (Ischio-jambiers, Mollets) ---
  souleve_de_terre: {
    id: 'souleve_de_terre',
    videoUrl: 'https://media.musclewiki.com/media/uploads/videos/branded/male-Dumbbells-dumbbell-romanian-deadlift-front.mp4',
    name: 'Soulevé de terre',
    sets: 4,
    repsMin: 5,
    repsMax: 6,
    restSeconds: 180,
    setScheme: [
      { reps: 8,  weightMultiplier: 0.60, label: 'Activation', note: 'Série d’échauffement — dos plat, barre contre les tibias' },
      { reps: 6,  weightMultiplier: 0.80, label: 'Travail', note: 'Charge de travail, pousse le sol, ne tire pas la barre' },
      { reps: 5,  weightMultiplier: 1.00, label: 'Intensif', note: 'Charge maximale — technique Valsalva, verrouille les hanches' },
      { reps: 5,  weightMultiplier: 1.00, label: 'Intensif', note: 'Maintiens la charge max — qualité > quantité' },
    ],
    relevanceScore: 100,
    relevanceReason: "Exercice le plus complet qui soit. Développe les ischio-jambiers, les fessiers, le dos, et libère une quantité massive d'hormones anabolisantes.",
    alternatives: [
      { name: 'Soulevé de terre roumain', relevanceScore: 90 },
      { name: 'Good Mornings à la barre', relevanceScore: 80 },
    ],
    tips: [
      "Barre au-dessus des lacets, pieds à largeur de hanches.",
      "Dos plat, poitrine haute, regard droit devant.",
      "Pousse le sol vers le bas (ne tire pas la barre vers le haut).",
      "Barre qui frôle les tibias et les cuisses pendant toute la montée.",
      "Verrouille les hanches en haut, ne cambre pas excessivement.",
    ],
    muscleGroups: ['Ischio-jambiers', 'Fessiers', 'Lombaires', 'Trapèzes', 'Grand dorsal'],
    defaultWeight: 60,
    weightProgression: "Augmente de 2.5-5kg par séance. C'est l'exercice sur lequel tu peux progresser le plus vite.",
  },
  fentes_bulgares: {
    id: 'fentes_bulgares',
    imageUrl: 'https://cdn.jefit.com/assets/img/exercises/gifs/136.gif',
    name: 'Fentes bulgares (haltères)',
    sets: 3,
    repsMin: 10,
    repsMax: 12,
    restSeconds: 90,
    relevanceScore: 93,
    relevanceReason: "Exercice unilatéral exceptionnel pour les quadriceps, fessiers et ischio-jambiers. Corrige les déséquilibres entre les jambes.",
    alternatives: [
      { name: 'Fentes avant statiques', relevanceScore: 85 },
      { name: 'Fentes marchées', relevanceScore: 88 },
    ],
    tips: [
      "Pied arrière sur un banc, pied avant à environ 1m du banc.",
      "Descends verticalement, genou arrière vers le sol.",
      "Garde le buste droit, ne te penche pas en avant.",
      "Pousse sur le talon du pied avant pour remonter.",
    ],
    muscleGroups: ['Quadriceps', 'Fessiers', 'Ischio-jambiers'],
    defaultWeight: 16,
    weightProgression: "Augmente de 2kg (1kg par haltère) quand tu complètes 3x12 par jambe.",
  },
  leg_curl: {
    id: 'leg_curl',
    imageUrl: 'https://cdn.jefit.com/assets/img/exercises/gifs/68.gif',
    name: 'Leg Curl ischios',
    sets: 3,
    repsMin: 12,
    repsMax: 15,
    restSeconds: 60,
    relevanceScore: 88,
    relevanceReason: "Isolation directe des ischio-jambiers. Essentiel pour équilibrer le développement quadriceps/ischio et prévenir les blessures.",
    alternatives: [
      { name: 'Nordic Hamstring Curls', relevanceScore: 92 },
      { name: 'Leg Curl avec haltère (allongé)', relevanceScore: 75 },
    ],
    tips: [
      "Contraction maximale en haut, descente contrôlée.",
      "Ne soulève pas les hanches pendant le mouvement.",
      "Peut se faire couché ou assis selon la machine disponible.",
    ],
    muscleGroups: ['Ischio-jambiers'],
    defaultWeight: 35,
    weightProgression: "Augmente de 5kg quand tu complètes 3x15.",
  },
  extensions_mollets: {
    id: 'extensions_mollets',
    videoUrl: 'https://media.musclewiki.com/media/uploads/videos/branded/male-Vitruvian-standing-calf-raise-side.mp4',
    name: 'Extensions mollets debout',
    sets: 5,
    repsMin: 15,
    repsMax: 20,
    restSeconds: 45,
    relevanceScore: 89,
    relevanceReason: "Les mollets sont des muscles récalcitrants qui nécessitent un volume élevé. 5 séries avec des temps de repos courts est la clé pour les faire grossir.",
    alternatives: [
      { name: 'Extensions mollets sur une marche (poids de corps)', relevanceScore: 82 },
      { name: 'Extensions mollets assis (machine)', relevanceScore: 85 },
    ],
    tips: [
      "Amplitude COMPLÈTE : descente maximale (étirement), montée maximale (sur la pointe des pieds).",
      "Tiens 1-2 secondes en haut pour maximiser la contraction.",
      "Descente lente (3 secondes) pour le temps sous tension.",
      "Varie la position des pieds : droits, en canard, en pigeon.",
    ],
    muscleGroups: ['Gastrocnémiens', 'Soléaires'],
    defaultWeight: 60,
    weightProgression: "Augmente de 5kg quand tu complètes 5x20 avec amplitude complète.",
  },
  crunches_poulie: {
    id: 'crunches_poulie',
    imageUrl: 'https://cdn.jefit.com/assets/img/exercises/gifs/91.gif',
    name: 'Crunches à la poulie haute',
    sets: 3,
    repsMin: 12,
    repsMax: 15,
    restSeconds: 60,
    relevanceScore: 88,
    relevanceReason: "Les abdominaux sont des muscles comme les autres — ils répondent mieux à la résistance progressive. Les crunches lestés développent la masse abdominale.",
    alternatives: [
      { name: 'Crunches lestés (avec un disque)', relevanceScore: 85 },
      { name: 'Crunches au sol', relevanceScore: 65 },
    ],
    tips: [
      "Agenouillé face à la poulie, corde derrière la tête.",
      "Fléchis le tronc vers le bas, contracte les abdominaux.",
      "Ne tire pas avec les bras — c'est le tronc qui fait le travail.",
    ],
    muscleGroups: ['Abdominaux supérieurs', 'Abdominaux inférieurs'],
    defaultWeight: 20,
    weightProgression: "Augmente de 2.5kg quand tu complètes 3x15.",
  },
  russian_twist: {
    id: 'russian_twist',
    imageUrl: 'https://cdn.jefit.com/assets/img/exercises/gifs/195.gif',
    name: 'Russian Twist (lesté)',
    sets: 3,
    repsMin: 15,
    repsMax: 20,
    restSeconds: 60,
    relevanceScore: 82,
    relevanceReason: "Travaille les obliques, essentiels pour définir la taille et maintenir les abdos visibles.",
    alternatives: [
      { name: 'Essuie-glaces au sol', relevanceScore: 80 },
      { name: 'Rotation du tronc à la poulie', relevanceScore: 85 },
    ],
    tips: [
      "Pieds décollés du sol pour plus d'intensité.",
      "Rotation complète de chaque côté.",
      "Garde le dos droit, ne t'affaisse pas.",
    ],
    muscleGroups: ['Obliques', 'Abdominaux'],
    defaultWeight: 5,
    weightProgression: "Augmente de 2kg quand tu complètes 3x20 par côté.",
  },
};


// ============================================================
// EXERCICES SUPPLEMENTAIRES -- Variations Phase 2 & 3
// ============================================================

const exerciseDatabasePhase2: Record<string, Exercise> = {
  // --- HAUT A Phase 2 (Pectoraux, Epaules, Triceps) ---
  developpe_halteres_incline: {
    id: "developpe_halteres_incline",
    videoUrl: "https://media.musclewiki.com/media/uploads/videos/branded/male-Dumbbells-dumbbell-incline-bench-press-front.mp4",
    name: "Developpe incline halteres",
    sets: 4, repsMin: 8, repsMax: 10, restSeconds: 120,
    setScheme: [
      { reps: 12, weightMultiplier: 0.70, label: "Activation", note: "Echauffement -- amplitude complete, coudes a 75 degres" },
      { reps: 10, weightMultiplier: 0.85, label: "Travail", note: "Charge principale -- pectoraux superieurs" },
      { reps: 8,  weightMultiplier: 1.00, label: "Intensif", note: "Charge max -- contraction en haut 1 seconde" },
      { reps: 10, weightMultiplier: 0.85, label: "Decharge", note: "Va chercher l'echec -- drop set si possible" },
    ],
    relevanceScore: 94,
    relevanceReason: "Cible les pectoraux superieurs avec une amplitude plus grande. Variation essentielle pour un developpement complet.",
    alternatives: [{ name: "Developpe couche barre", relevanceScore: 95 }, { name: "Pompes inclinees lestees", relevanceScore: 78 }],
    tips: ["Banc a 30-45 degres. Coudes a 75 degres du corps.", "Descends les halteres jusqu'a l'etirement maximal.", "Pousse vers le haut ET legerement vers l'interieur."],
    muscleGroups: ["Pectoraux superieurs", "Deltoides anterieurs", "Triceps"],
    defaultWeight: 18, weightProgression: "Augmente de 2kg quand tu completes 4x10.",
  },
  developpe_arnold: {
    id: "developpe_arnold",
    videoUrl: "https://media.musclewiki.com/media/uploads/videos/branded/male-Dumbbells-dumbbell-arnold-press-front.mp4",
    name: "Developpe Arnold",
    sets: 3, repsMin: 10, repsMax: 12, restSeconds: 90,
    setScheme: [
      { reps: 12, weightMultiplier: 0.75, label: "Activation", note: "Rotation complete -- sens les 3 faisceaux des deltoides" },
      { reps: 10, weightMultiplier: 1.00, label: "Travail", note: "Charge principale -- rotation lente et controlee" },
      { reps: 10, weightMultiplier: 1.00, label: "Travail", note: "Maintiens la forme -- ne compense pas avec le dos" },
    ],
    relevanceScore: 91,
    relevanceReason: "Sollicite les 3 faisceaux des deltoides grace a la rotation. Developpe des epaules plus completes que le developpe militaire classique.",
    alternatives: [{ name: "Developpe militaire halteres", relevanceScore: 93 }, { name: "Developpe militaire barre", relevanceScore: 88 }],
    tips: ["Pars paumes vers toi, fais pivoter pendant la montee.", "Mouvement lent et controle -- pas de momentum.", "Amplitude complete : descends jusqu'aux epaules."],
    muscleGroups: ["Deltoides anterieurs", "Deltoides lateraux", "Triceps"],
    defaultWeight: 12, weightProgression: "Augmente de 2kg quand tu completes 3x12.",
  },
  skull_crusher: {
    id: "skull_crusher",
    imageUrl: "https://cdn.jefit.com/assets/img/exercises/gifs/87.gif",
    name: "Skull Crusher (barre EZ)",
    sets: 3, repsMin: 10, repsMax: 12, restSeconds: 75,
    setScheme: [
      { reps: 12, weightMultiplier: 0.75, label: "Activation", note: "Coudes fixes -- ne les laisse pas s'ecarter" },
      { reps: 10, weightMultiplier: 1.00, label: "Travail", note: "Descente lente 3 secondes -- etirement maximal" },
      { reps: 8,  weightMultiplier: 1.15, label: "Intensif", note: "Charge lourde -- si la forme reste parfaite" },
    ],
    relevanceScore: 92,
    relevanceReason: "Etirement maximal des triceps en position allongee. Recrute le chef long du triceps souvent sous-developpe.",
    alternatives: [{ name: "Extension triceps au-dessus de la tete", relevanceScore: 88 }, { name: "Extension poulie haute", relevanceScore: 87 }],
    tips: ["Allonge sur un banc, barre EZ tenue au-dessus du front.", "Descends la barre vers le front (pas derriere la tete).", "Coudes fixes -- seuls les avant-bras bougent."],
    muscleGroups: ["Triceps (chef long)"],
    defaultWeight: 20, weightProgression: "Augmente de 2.5kg quand tu completes 3x12.",
  },
  cable_fly: {
    id: "cable_fly",
    imageUrl: "https://cdn.jefit.com/assets/img/exercises/gifs/41.gif",
    name: "Ecarte poulie croisee (cables)",
    sets: 3, repsMin: 12, repsMax: 15, restSeconds: 60,
    setScheme: [
      { reps: 15, weightMultiplier: 0.80, label: "Leger", note: "Sens la contraction des pectoraux a chaque rep" },
      { reps: 12, weightMultiplier: 1.00, label: "Travail", note: "Tension constante grace aux cables" },
      { reps: 12, weightMultiplier: 1.00, label: "Pump", note: "Va chercher la brulure -- drop set si possible" },
    ],
    relevanceScore: 90,
    relevanceReason: "Tension constante sur les pectoraux tout au long du mouvement. Ideal pour la finition et la congestion.",
    alternatives: [{ name: "Ecarte incline halteres", relevanceScore: 86 }, { name: "Pompes diamant", relevanceScore: 72 }],
    tips: ["Legere inclinaison vers l'avant.", "Croise les mains en fin de mouvement pour maximiser la contraction.", "Poids leger -- la forme prime."],
    muscleGroups: ["Pectoraux", "Deltoides anterieurs"],
    defaultWeight: 10, weightProgression: "Augmente de 2.5kg quand tu completes 3x15.",
  },
  // --- BAS A Phase 2 (Quadriceps, Fessiers) ---
  hack_squat: {
    id: "hack_squat",
    imageUrl: "https://cdn.jefit.com/assets/img/exercises/gifs/69.gif",
    name: "Hack Squat (machine)",
    sets: 4, repsMin: 8, repsMax: 10, restSeconds: 120,
    setScheme: [
      { reps: 12, weightMultiplier: 0.65, label: "Activation", note: "Descente profonde, genoux dans l'axe des orteils" },
      { reps: 10, weightMultiplier: 0.80, label: "Travail", note: "Charge principale -- amplitude complete" },
      { reps: 8,  weightMultiplier: 1.00, label: "Intensif", note: "Charge max -- pousse fort sur les talons" },
      { reps: 10, weightMultiplier: 0.80, label: "Decharge", note: "Retour a 80% -- va a l'echec" },
    ],
    relevanceScore: 90,
    relevanceReason: "Variation du squat qui cible davantage les quadriceps. Moins de stress sur le bas du dos.",
    alternatives: [{ name: "Squat barre", relevanceScore: 100 }, { name: "Presse a cuisses", relevanceScore: 87 }],
    tips: ["Pieds legerement plus hauts sur la plateforme pour plus de quadriceps.", "Amplitude complete -- descends jusqu'a 90 degres minimum.", "Ne verrouille pas les genoux en haut."],
    muscleGroups: ["Quadriceps", "Fessiers"],
    defaultWeight: 80, weightProgression: "Augmente de 5-10kg quand tu completes 4x10.",
  },
  squat_bulgare_p2: {
    id: "squat_bulgare_p2",
    imageUrl: "https://cdn.jefit.com/assets/img/exercises/gifs/136.gif",
    name: "Squat bulgare (halteres)",
    sets: 3, repsMin: 10, repsMax: 12, restSeconds: 90,
    setScheme: [
      { reps: 12, weightMultiplier: 0.70, label: "Activation", note: "Equilibre et amplitude -- pied arriere sur banc" },
      { reps: 10, weightMultiplier: 0.90, label: "Travail", note: "Descends le genou arriere vers le sol" },
      { reps: 8,  weightMultiplier: 1.00, label: "Intensif", note: "Charge max -- pousse sur le talon avant" },
    ],
    relevanceScore: 93,
    relevanceReason: "Exercice unilateral qui corrige les desequilibres et developpe les quadriceps et fessiers avec une amplitude superieure.",
    alternatives: [{ name: "Fentes avant statiques", relevanceScore: 85 }, { name: "Fentes marchees", relevanceScore: 88 }],
    tips: ["Pied arriere sur un banc a hauteur du genou.", "Pied avant a 1m du banc.", "Descends verticalement -- ne te penche pas en avant."],
    muscleGroups: ["Quadriceps", "Fessiers", "Ischio-jambiers"],
    defaultWeight: 16, weightProgression: "Augmente de 2kg (1kg/haltere) quand tu completes 3x12 par jambe.",
  },
  // --- HAUT B Phase 2 (Dos, Epaules, Biceps) ---
  tirage_vertical_prise_serree: {
    id: "tirage_vertical_prise_serree",
    imageUrl: "https://cdn.jefit.com/assets/img/exercises/gifs/5.gif",
    name: "Tirage vertical prise serree (poulie)",
    sets: 4, repsMin: 8, repsMax: 10, restSeconds: 90,
    setScheme: [
      { reps: 12, weightMultiplier: 0.70, label: "Activation", note: "Tire les coudes vers les hanches, pas vers l'arriere" },
      { reps: 10, weightMultiplier: 0.85, label: "Travail", note: "Contraction maximale en bas -- tiens 1 seconde" },
      { reps: 8,  weightMultiplier: 1.00, label: "Intensif", note: "Charge max -- etirement complet en haut" },
      { reps: 10, weightMultiplier: 0.85, label: "Decharge", note: "Retour a 85% -- va a l'echec" },
    ],
    relevanceScore: 90,
    relevanceReason: "Prise serree neutre = activation maximale du grand dorsal inferieur. Variation complementaire des tractions.",
    alternatives: [{ name: "Tractions prise serree", relevanceScore: 92 }, { name: "Tirage vertical prise large", relevanceScore: 88 }],
    tips: ["Prise neutre (paumes face a face).", "Tire les coudes vers les hanches.", "Etirement complet en haut pour maximiser l'amplitude."],
    muscleGroups: ["Grand dorsal", "Biceps", "Rhomboides"],
    defaultWeight: 55, weightProgression: "Augmente de 5kg quand tu completes 4x10.",
  },
  rowing_haltere: {
    id: "rowing_haltere",
    videoUrl: "https://media.musclewiki.com/media/uploads/videos/branded/male-Dumbbells-dumbbell-single-arm-row-side.mp4",
    name: "Rowing haltere unilateral",
    sets: 4, repsMin: 10, repsMax: 12, restSeconds: 90,
    setScheme: [
      { reps: 12, weightMultiplier: 0.75, label: "Activation", note: "Dos plat, coude qui remonte haut" },
      { reps: 10, weightMultiplier: 1.00, label: "Travail", note: "Charge principale -- retracte l'omoplate en fin de mouvement" },
      { reps: 10, weightMultiplier: 1.00, label: "Travail", note: "Meme charge -- qualite de contraction" },
      { reps: 12, weightMultiplier: 0.80, label: "Pump", note: "Retour a 80% -- va chercher la brulure" },
    ],
    relevanceScore: 93,
    relevanceReason: "Permet une amplitude et une contraction superieures au rowing barre. Corrige les desequilibres gauche/droite.",
    alternatives: [{ name: "Rowing barre", relevanceScore: 96 }, { name: "Rowing machine", relevanceScore: 85 }],
    tips: ["Main et genou du meme cote sur le banc.", "Tire le coude vers le plafond, pas vers l'arriere.", "Amplitude complete -- etirement complet en bas."],
    muscleGroups: ["Grand dorsal", "Rhomboides", "Trapezes", "Biceps"],
    defaultWeight: 22, weightProgression: "Augmente de 2kg quand tu completes 4x12.",
  },
  curl_barre_ez: {
    id: "curl_barre_ez",
    imageUrl: "https://cdn.jefit.com/assets/img/exercises/gifs/32.gif",
    name: "Curl barre EZ",
    sets: 3, repsMin: 8, repsMax: 10, restSeconds: 75,
    setScheme: [
      { reps: 12, weightMultiplier: 0.70, label: "Activation", note: "Coudes fixes, amplitude complete" },
      { reps: 10, weightMultiplier: 0.90, label: "Travail", note: "Charge principale -- contraction maximale en haut" },
      { reps: 8,  weightMultiplier: 1.00, label: "Intensif", note: "Charge max -- descente 3-4 secondes" },
    ],
    relevanceScore: 91,
    relevanceReason: "Permet de charger plus lourd que les halteres. La barre EZ reduit le stress sur les poignets.",
    alternatives: [{ name: "Curl halteres debout", relevanceScore: 85 }, { name: "Curl incline", relevanceScore: 95 }],
    tips: ["Coudes colles au corps -- ne les laisse pas partir vers l'avant.", "Descente lente (3-4 secondes) pour maximiser le temps sous tension.", "Contraction maximale en haut -- tiens 1 seconde."],
    muscleGroups: ["Biceps", "Brachial"],
    defaultWeight: 25, weightProgression: "Augmente de 2.5kg quand tu completes 3x10.",
  },
  // --- BAS B Phase 2 (Ischio-jambiers, Mollets) ---
  rdl_halteres: {
    id: "rdl_halteres",
    videoUrl: "https://media.musclewiki.com/media/uploads/videos/branded/male-Dumbbells-dumbbell-romanian-deadlift-front.mp4",
    name: "Souleve de terre roumain (halteres)",
    sets: 4, repsMin: 10, repsMax: 12, restSeconds: 90,
    setScheme: [
      { reps: 12, weightMultiplier: 0.70, label: "Activation", note: "Sens l'etirement des ischio-jambiers -- dos plat" },
      { reps: 10, weightMultiplier: 0.85, label: "Travail", note: "Charge principale -- hanches vers l'arriere" },
      { reps: 8,  weightMultiplier: 1.00, label: "Intensif", note: "Charge max -- etirement maximal en bas" },
      { reps: 12, weightMultiplier: 0.75, label: "Pump", note: "Retour a 75% -- va chercher la brulure dans les ischio" },
    ],
    relevanceScore: 92,
    relevanceReason: "Isole davantage les ischio-jambiers que le souleve de terre classique. Amplitude plus grande avec les halteres.",
    alternatives: [{ name: "Souleve de terre barre", relevanceScore: 100 }, { name: "Good Mornings", relevanceScore: 80 }],
    tips: ["Descends les halteres le long des tibias.", "Hanches vers l'arriere, dos plat -- ne flechis pas les genoux.", "Sens l'etirement des ischio avant de remonter."],
    muscleGroups: ["Ischio-jambiers", "Fessiers", "Lombaires"],
    defaultWeight: 20, weightProgression: "Augmente de 2kg quand tu completes 4x12.",
  },
  nordic_hamstring: {
    id: "nordic_hamstring",
    imageUrl: "https://cdn.jefit.com/assets/img/exercises/gifs/68.gif",
    name: "Nordic Hamstring Curls",
    sets: 3, repsMin: 6, repsMax: 8, restSeconds: 90,
    setScheme: [
      { reps: 6, weightMultiplier: 0.00, label: "Poids de corps", note: "Descente lente 3-5 secondes -- controle maximal" },
      { reps: 6, weightMultiplier: 0.00, label: "Poids de corps", note: "Si trop difficile, aide-toi des mains pour remonter" },
      { reps: 6, weightMultiplier: 0.00, label: "Poids de corps", note: "Qualite > quantite -- ne triche pas" },
    ],
    relevanceScore: 95,
    relevanceReason: "L'exercice le plus efficace pour prevenir les blessures aux ischio-jambiers. Reduit de 51% le risque de dechirure (etudes FIFA). Indispensable pour le football.",
    alternatives: [{ name: "Leg Curl machine", relevanceScore: 85 }, { name: "Leg Curl avec haltere", relevanceScore: 72 }],
    tips: ["Genoux sur un tapis, pieds bloques sous un banc ou tenus par un partenaire.", "Descente lente et controlee -- c'est la phase la plus importante.", "Aide-toi des mains pour remonter si necessaire."],
    muscleGroups: ["Ischio-jambiers"],
    defaultWeight: 0, weightProgression: "Progresse vers des descentes de plus en plus lentes (5-7 secondes).",
  },
};

const exerciseDatabasePhase3: Record<string, Exercise> = {
  // --- HAUT A Phase 3 (Pectoraux, Epaules, Triceps -- Intensification) ---
  developpe_couche_prise_serree: {
    id: "developpe_couche_prise_serree",
    imageUrl: "https://cdn.jefit.com/assets/img/exercises/gifs/26.gif",
    name: "Developpe couche prise serree",
    sets: 4, repsMin: 6, repsMax: 8, restSeconds: 120,
    setScheme: [
      { reps: 10, weightMultiplier: 0.65, label: "Activation", note: "Prise a largeur d'epaules -- triceps en priorite" },
      { reps: 8,  weightMultiplier: 0.80, label: "Travail", note: "Charge principale -- coudes proches du corps" },
      { reps: 6,  weightMultiplier: 1.00, label: "Intensif", note: "Charge max -- REST-PAUSE si besoin" },
      { reps: 8,  weightMultiplier: 0.80, label: "Drop Set", note: "Drop set immediat -- descends de 20% et va a l'echec" },
    ],
    relevanceScore: 93,
    relevanceReason: "Cible les triceps et les pectoraux internes. La prise serree permet de surcharger les triceps avec un mouvement polyarticulaire.",
    alternatives: [{ name: "Developpe couche barre", relevanceScore: 98 }, { name: "Skull Crusher", relevanceScore: 90 }],
    tips: ["Prise a 30-40cm d'ecart (pas trop serree -- risque poignets).", "Coudes proches du corps pendant la descente.", "Pousse vers le haut et legerement vers les pieds."],
    muscleGroups: ["Triceps", "Pectoraux internes", "Deltoides anterieurs"],
    defaultWeight: 45, weightProgression: "Augmente de 2.5kg quand tu completes 4x8.",
  },
  dips_lestes_avances: {
    id: "dips_lestes_avances",
    videoUrl: "https://media.musclewiki.com/media/uploads/videos/branded/male-Bodyweight-bench-dips-front.mp4",
    name: "Dips lestes + Rest-Pause",
    sets: 3, repsMin: 6, repsMax: 8, restSeconds: 120,
    setScheme: [
      { reps: 8,  weightMultiplier: 0.00, label: "Poids de corps", note: "Sans lest -- amplitude maximale, descente 3 secondes" },
      { reps: 6,  weightMultiplier: 1.00, label: "Leste", note: "Avec lest -- REST-PAUSE : 6 reps, 15s pause, max reps" },
      { reps: 6,  weightMultiplier: 1.00, label: "Leste", note: "Meme protocole REST-PAUSE" },
    ],
    relevanceScore: 96,
    relevanceReason: "Technique REST-PAUSE pour depasser le plateau. Augmente le volume effectif sans augmenter la duree de la seance.",
    alternatives: [{ name: "Dips poids de corps", relevanceScore: 95 }, { name: "Extension triceps poulie", relevanceScore: 88 }],
    tips: ["Lest de 10-20kg si possible.", "REST-PAUSE : fais tes reps, pose 15 secondes, reprends jusqu'a l'echec.", "Amplitude complete -- descends jusqu'a 90 degres."],
    muscleGroups: ["Triceps", "Pectoraux inferieurs"],
    defaultWeight: 10, weightProgression: "Augmente le lest de 5kg quand tu completes 3x8+3 en rest-pause.",
  },
  // --- BAS A Phase 3 (Quadriceps, Fessiers -- Intensification) ---
  squat_pause: {
    id: "squat_pause",
    imageUrl: "https://cdn.jefit.com/assets/img/exercises/gifs/12.gif",
    name: "Squat Pause (2 secondes en bas)",
    sets: 4, repsMin: 5, repsMax: 6, restSeconds: 180,
    setScheme: [
      { reps: 8,  weightMultiplier: 0.60, label: "Activation", note: "Echauffement -- sens la position basse" },
      { reps: 6,  weightMultiplier: 0.75, label: "Travail", note: "Pause 2 secondes en bas -- elimine le rebond" },
      { reps: 5,  weightMultiplier: 0.90, label: "Intensif", note: "Charge lourde + pause -- force pure" },
      { reps: 5,  weightMultiplier: 0.90, label: "Intensif", note: "Maintiens la qualite -- pas de triche" },
    ],
    relevanceScore: 98,
    relevanceReason: "La pause elimine le rebond et force un recrutement maximal des fibres musculaires. Developpe une force explosive superieure.",
    alternatives: [{ name: "Squat barre classique", relevanceScore: 100 }, { name: "Hack Squat", relevanceScore: 88 }],
    tips: ["Pause complete en bas -- aucun rebond.", "Garde la tension dans tout le corps pendant la pause.", "Poids legerement reduit par rapport au squat classique (normal)."],
    muscleGroups: ["Quadriceps", "Fessiers", "Ischio-jambiers"],
    defaultWeight: 55, weightProgression: "Augmente de 2.5kg quand tu completes 4x6 avec pause complete.",
  },
  // --- HAUT B Phase 3 (Dos, Epaules, Biceps -- Intensification) ---
  tractions_lestees_avancees: {
    id: "tractions_lestees_avancees",
    imageUrl: "https://cdn.jefit.com/assets/img/exercises/gifs/3.gif",
    name: "Tractions lestees + Drop Set",
    sets: 4, repsMin: 5, repsMax: 6, restSeconds: 150,
    setScheme: [
      { reps: 8,  weightMultiplier: 0.00, label: "Poids de corps", note: "Sans lest -- amplitude complete, descente 3 secondes" },
      { reps: 6,  weightMultiplier: 1.00, label: "Leste", note: "Avec lest max -- DROP SET : retire le lest et continue" },
      { reps: 5,  weightMultiplier: 1.00, label: "Leste", note: "Meme protocole DROP SET" },
      { reps: 6,  weightMultiplier: 0.00, label: "Drop Set", note: "Poids de corps jusqu'a l'echec -- va chercher les dernieres fibres" },
    ],
    relevanceScore: 100,
    relevanceReason: "Drop set sur tractions lestees = volume et intensite maximaux. Technique avancee pour depasser les plateaux de progression.",
    alternatives: [{ name: "Tractions poids de corps", relevanceScore: 98 }, { name: "Tirage vertical poulie", relevanceScore: 88 }],
    tips: ["Lest de 10-20kg.", "DROP SET : fais tes reps lestees, retire le lest immediatement, continue jusqu'a l'echec.", "Amplitude complete -- descente complete obligatoire."],
    muscleGroups: ["Grand dorsal", "Biceps", "Rhomboides"],
    defaultWeight: 10, weightProgression: "Augmente le lest de 2.5kg quand tu completes 4x6 + 4+ reps en drop set.",
  },
  curl_concentration: {
    id: "curl_concentration",
    imageUrl: "https://cdn.jefit.com/assets/img/exercises/gifs/34.gif",
    name: "Curl concentration + Drop Set",
    sets: 3, repsMin: 10, repsMax: 12, restSeconds: 60,
    setScheme: [
      { reps: 12, weightMultiplier: 1.00, label: "Travail", note: "Coude contre la cuisse -- supination maximale en haut" },
      { reps: 10, weightMultiplier: 1.00, label: "Travail", note: "DROP SET : descends de 2kg et continue jusqu'a l'echec" },
      { reps: 10, weightMultiplier: 1.00, label: "Drop Set", note: "Meme protocole -- brulure maximale dans le biceps" },
    ],
    relevanceScore: 88,
    relevanceReason: "Isolation maximale du biceps. Le drop set en phase 3 cree un stress metabolique eleve pour maximiser l'hypertrophie.",
    alternatives: [{ name: "Curl incline", relevanceScore: 95 }, { name: "Curl barre EZ", relevanceScore: 89 }],
    tips: ["Assis, coude contre la cuisse interieure.", "Supination maximale en haut -- tourne la paume vers le plafond.", "Contraction maximale -- tiens 2 secondes en haut."],
    muscleGroups: ["Biceps (pic)"],
    defaultWeight: 12, weightProgression: "Augmente de 2kg quand tu completes 3x12 + 4+ reps en drop set.",
  },
  // --- BAS B Phase 3 (Ischio-jambiers, Mollets -- Intensification) ---
  souleve_sumo: {
    id: "souleve_sumo",
    imageUrl: "https://cdn.jefit.com/assets/img/exercises/gifs/11.gif",
    name: "Souleve de terre Sumo",
    sets: 4, repsMin: 5, repsMax: 6, restSeconds: 180,
    setScheme: [
      { reps: 8,  weightMultiplier: 0.60, label: "Activation", note: "Pieds larges, orteils vers l'exterieur -- dos plat" },
      { reps: 6,  weightMultiplier: 0.80, label: "Travail", note: "Charge principale -- pousse le sol, genoux vers l'exterieur" },
      { reps: 5,  weightMultiplier: 1.00, label: "Intensif", note: "Charge max -- technique Valsalva" },
      { reps: 5,  weightMultiplier: 1.00, label: "Intensif", note: "Maintiens la charge max -- qualite > quantite" },
    ],
    relevanceScore: 95,
    relevanceReason: "Variation sumo = plus d'activation des adducteurs et des fessiers. Variation essentielle pour un developpement complet des jambes.",
    alternatives: [{ name: "Souleve de terre classique", relevanceScore: 100 }, { name: "Souleve roumain", relevanceScore: 90 }],
    tips: ["Pieds a 1.5x largeur d'epaules, orteils a 45 degres.", "Genoux pousses vers l'exterieur pendant toute la montee.", "Barre plus proche du corps qu'en conventionnel."],
    muscleGroups: ["Ischio-jambiers", "Adducteurs", "Fessiers", "Quadriceps"],
    defaultWeight: 65, weightProgression: "Augmente de 2.5-5kg quand tu completes 4x6.",
  },
  mollets_drop_set: {
    id: "mollets_drop_set",
    videoUrl: "https://media.musclewiki.com/media/uploads/videos/branded/male-Vitruvian-standing-calf-raise-side.mp4",
    name: "Extensions mollets -- Triple Drop Set",
    sets: 4, repsMin: 12, repsMax: 15, restSeconds: 45,
    setScheme: [
      { reps: 15, weightMultiplier: 1.00, label: "Travail", note: "Charge normale -- amplitude complete" },
      { reps: 12, weightMultiplier: 1.00, label: "DROP 1", note: "Descends de 20% -- continue immediatement" },
      { reps: 12, weightMultiplier: 0.80, label: "DROP 2", note: "Descends encore de 20% -- continue" },
      { reps: 15, weightMultiplier: 0.60, label: "DROP 3", note: "Dernier drop -- va jusqu'a l'echec total" },
    ],
    relevanceScore: 91,
    relevanceReason: "Les mollets sont tres resistants a la fatigue. Le triple drop set cree un stress metabolique suffisant pour les faire hypertrophier.",
    alternatives: [{ name: "Extensions mollets classiques", relevanceScore: 89 }, { name: "Extensions mollets assis", relevanceScore: 85 }],
    tips: ["Amplitude COMPLETE a chaque repetition.", "Drop set : reduis la charge immediatement sans pause.", "Tiens 1-2 secondes en haut a chaque rep."],
    muscleGroups: ["Gastrocnemiens", "Soleaires"],
    defaultWeight: 60, weightProgression: "Augmente la charge de depart de 5kg quand tu completes 4x15 + 12 + 12 + 12.",
  },
};

// ============================================================
// SESSIONS VARIANTES PAR PHASE
// ============================================================

const sessionsPhase2: WorkoutSession[] = [
  {
    id: "upper_a_p2",
    day: 1, type: "gym" as const,
    name: "Haut du corps A -- Phase 2",
    focus: "Pectoraux superieurs . Epaules . Triceps",
    durationMin: 70,
    exercises: [
      exerciseDatabasePhase2.developpe_halteres_incline,
      exerciseDatabasePhase2.developpe_arnold,
      exerciseDatabasePhase2.skull_crusher,
      exerciseDatabasePhase2.cable_fly,
      exerciseDatabase.elevations_laterales,
      exerciseDatabase.extension_triceps_poulie,
    ],
    coachNote: "Phase 2 : on monte en intensite. Le developpe incline halteres cible les pectoraux superieurs -- la partie qui donne du relief. Le skull crusher est ton arme secrete pour des triceps massifs. Augmente les charges par rapport a la phase 1.",
  },
  {
    id: "lower_a_p2",
    day: 3, type: "gym" as const,
    name: "Bas du corps A -- Phase 2",
    focus: "Quadriceps . Fessiers . Abdos",
    durationMin: 75,
    exercises: [
      exerciseDatabasePhase2.hack_squat,
      exerciseDatabasePhase2.squat_bulgare_p2,
      exerciseDatabase.leg_extension,
      exerciseDatabase.hip_thrust,
      exerciseDatabase.releve_jambes,
      exerciseDatabase.gainage,
    ],
    coachNote: "Phase 2 : le hack squat remplace le squat barre pour cibler davantage les quadriceps. Le squat bulgare corrige les desequilibres. Volume plus eleve qu'en phase 1.",
  },
  {
    id: "upper_b_p2",
    day: 4, type: "gym" as const,
    name: "Haut du corps B -- Phase 2",
    focus: "Dos . Epaules . Biceps",
    durationMin: 70,
    exercises: [
      exerciseDatabasePhase2.tirage_vertical_prise_serree,
      exerciseDatabasePhase2.rowing_haltere,
      exerciseDatabase.tirage_horizontal,
      exerciseDatabase.face_pull,
      exerciseDatabasePhase2.curl_barre_ez,
      exerciseDatabase.curl_marteau,
    ],
    coachNote: "Phase 2 : tirage prise serree pour le grand dorsal inferieur, rowing haltere unilateral pour corriger les desequilibres. Curl barre EZ pour charger plus lourd sur les biceps.",
  },
  {
    id: "lower_b_p2",
    day: 8, type: "gym" as const,
    name: "Bas du corps B -- Phase 2",
    focus: "Ischio-jambiers . Mollets . Abdos",
    durationMin: 70,
    exercises: [
      exerciseDatabasePhase2.rdl_halteres,
      exerciseDatabasePhase2.nordic_hamstring,
      exerciseDatabase.fentes_bulgares,
      exerciseDatabase.extensions_mollets,
      exerciseDatabase.crunches_poulie,
      exerciseDatabase.russian_twist,
    ],
    coachNote: "Phase 2 : RDL halteres pour un etirement maximal des ischio-jambiers. Nordic Hamstring Curls -- l'exercice le plus important pour prevenir les blessures au foot. Indispensable.",
  },
];

const sessionsPhase3: WorkoutSession[] = [
  {
    id: "upper_a_p3",
    day: 1, type: "gym" as const,
    name: "Haut du corps A -- Phase 3",
    focus: "Pectoraux . Triceps . Intensification",
    durationMin: 75,
    exercises: [
      exerciseDatabase.developpe_couche,
      exerciseDatabasePhase3.developpe_couche_prise_serree,
      exerciseDatabasePhase3.dips_lestes_avances,
      exerciseDatabasePhase2.cable_fly,
      exerciseDatabase.elevations_laterales,
      exerciseDatabase.extension_triceps_poulie,
    ],
    coachNote: "Phase 3 : intensite maximale. Developpe couche lourd + prise serree = double attaque sur les triceps. Dips lestes en REST-PAUSE pour depasser tes limites. Drop sets sur les cables.",
  },
  {
    id: "lower_a_p3",
    day: 3, type: "gym" as const,
    name: "Bas du corps A -- Phase 3",
    focus: "Quadriceps . Fessiers . Force explosive",
    durationMin: 80,
    exercises: [
      exerciseDatabasePhase3.squat_pause,
      exerciseDatabasePhase2.hack_squat,
      exerciseDatabase.leg_extension,
      exerciseDatabase.hip_thrust,
      exerciseDatabase.releve_jambes,
      exerciseDatabase.gainage,
    ],
    coachNote: "Phase 3 : squat pause pour eliminer le rebond et recruter 100% des fibres. Technique avancee qui developpe une force explosive directement transferable au football.",
  },
  {
    id: "upper_b_p3",
    day: 4, type: "gym" as const,
    name: "Haut du corps B -- Phase 3",
    focus: "Dos . Biceps . Techniques avancees",
    durationMin: 75,
    exercises: [
      exerciseDatabasePhase3.tractions_lestees_avancees,
      exerciseDatabase.rowing_barre,
      exerciseDatabasePhase2.tirage_vertical_prise_serree,
      exerciseDatabase.face_pull,
      exerciseDatabasePhase3.curl_concentration,
      exerciseDatabase.curl_marteau,
    ],
    coachNote: "Phase 3 : tractions lestees en DROP SET -- la technique la plus efficace pour maximiser le volume sur les biceps et le dos en une seule serie. Curl concentration pour le pic du biceps.",
  },
  {
    id: "lower_b_p3",
    day: 8, type: "gym" as const,
    name: "Bas du corps B -- Phase 3",
    focus: "Ischio-jambiers . Adducteurs . Mollets",
    durationMin: 75,
    exercises: [
      exerciseDatabasePhase3.souleve_sumo,
      exerciseDatabasePhase2.nordic_hamstring,
      exerciseDatabase.leg_curl,
      exerciseDatabasePhase3.mollets_drop_set,
      exerciseDatabase.crunches_poulie,
      exerciseDatabase.russian_twist,
    ],
    coachNote: "Phase 3 : souleve sumo pour les adducteurs et fessiers -- variation essentielle. Triple drop set sur les mollets pour les forcer a grandir. Nordic Hamstring obligatoire pour le football.",
  },
];

// Fonction pour obtenir la session selon la phase
export function getSessionForPhase(sessionId: string, weekNumber: number): WorkoutSession | undefined {
  // Phase 1 : semaines 1-4
  // Phase 2 : semaines 5-8
  // Phase 3 : semaines 9-12
  const baseId = sessionId.replace(/_p[23]$/, "");
  
  if (weekNumber >= 9) {
    // Phase 3
    const p3Map: Record<string, string> = {
      upper_a: "upper_a_p3",
      lower_a: "lower_a_p3",
      upper_b: "upper_b_p3",
      lower_b: "lower_b_p3",
    };
    if (p3Map[baseId]) {
      return sessionsPhase3.find(s => s.id === p3Map[baseId]);
    }
  } else if (weekNumber >= 5) {
    // Phase 2
    const p2Map: Record<string, string> = {
      upper_a: "upper_a_p2",
      lower_a: "lower_a_p2",
      upper_b: "upper_b_p2",
      lower_b: "lower_b_p2",
    };
    if (p2Map[baseId]) {
      return sessionsPhase2.find(s => s.id === p2Map[baseId]);
    }
  }
  
  // Phase 1 (semaines 1-4) ou sessions non-musculation
  return sessions.find(s => s.id === sessionId);
}

// ============================================================
// EXERCICES FOOTBALL — Explosivité, Appuis, Accélération
// ============================================================

const footballDrills: FootballDrill[] = [
  {
    id: 'activation',
    name: 'Activation neuromusculaire',
    phase: 'Échauffement',
    durationMin: 10,
    equipment: 'Aucun',
    description: 'Footing léger 3 min → montées de genoux progressives 2×20m → talons-fesses 2×20m → fentes dynamiques 10/jambe → sauts sur place ×20 → rotations de hanches 10/sens.',
    coachTip: "L'échauffement est obligatoire pour les sprints. Un muscle froid = blessure assurée. Prends ces 10 minutes au sérieux.",
    progressionPhase2: 'Ajoute des skips A et B (course technique) sur 20m.',
    progressionPhase3: 'Ajoute des sauts en contrebas (drop jumps) pour activer les réflexes.',
    videoUrl: 'https://www.youtube.com/embed/R0mMyV5OtcM',
    imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&q=80',
  },
  {
    id: 'appuis_rythme',
    name: 'Travail d\'appuis — Rythme',
    phase: 'Appuis',
    durationMin: 6,
    reps: 6,
    equipment: 'Plots ou objets au sol',
    description: '10 cases imaginaires de 50cm. Passer 1 pied par case, puis 2 pieds par case. 6 passages à vitesse progressive. Focus sur la fréquence des appuis et la légèreté.',
    coachTip: 'Pense à poser les pieds sous le centre de gravité, pas devant. Les bras doivent se balancer activement.',
    progressionPhase2: 'Augmenter la vitesse maximale, ajouter des changements de direction à mi-parcours.',
    progressionPhase3: 'Ajouter un ballon à conduire entre les cases.',
    videoUrl: 'https://www.youtube.com/embed/tFBGLJnFpSU',
    imageUrl: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=400&q=80',
  },
  {
    id: 'slalom_plots',
    name: 'Slalom plots — Changements de direction',
    phase: 'Appuis',
    durationMin: 6,
    reps: 6,
    equipment: '8 plots espacés de 1m',
    description: '8 plots en ligne droite espacés de 1m. Slalom aller-retour ×6 passages. Chronométre les 3 derniers passages. Objectif : descendre sous 8 secondes.',
    coachTip: 'Baisse le centre de gravité dans les virages. Pousse fort sur la jambe extérieure pour changer de direction.',
    progressionPhase2: 'Réduire l\'espacement à 80cm.',
    progressionPhase3: 'Ajouter un ballon en conduite.',
    videoUrl: 'https://www.youtube.com/embed/2_LKfxBNEhw',
    imageUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400&q=80',
  },
  {
    id: 'appuis_lateraux',
    name: 'Appuis latéraux réactifs',
    phase: 'Appuis',
    durationMin: 5,
    reps: 4,
    equipment: '2 plots espacés de 5m',
    description: 'Déplacements latéraux (pas chassés) entre 2 plots. 4 séries ×30 secondes. Variante : changement de direction sur signal (clap ou cri). Focus sur la réactivité.',
    coachTip: 'Ne croise pas les pieds. Reste sur les avant-pieds. La vitesse de réaction se travaille en restant concentré à 100%.',
    progressionPhase2: 'Ajouter un sprint de 5m après chaque changement de direction.',
    progressionPhase3: 'Ajouter une réception de balle après le sprint.',
    videoUrl: 'https://www.youtube.com/embed/Oy5ORnlGME4',
    imageUrl: 'https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?w=400&q=80',
  },
  {
    id: 'sprint_10m',
    name: 'Sprint 10m — Démarrage explosif',
    phase: 'Accélération',
    durationMin: 8,
    reps: 8,
    equipment: 'Plots',
    description: 'Départ debout, position foot (légèrement fléchi). 8 sprints ×10m. Récupération 45 secondes entre chaque. Objectif : < 1.8 secondes. Chronométre chaque sprint.',
    coachTip: 'Les 3 premières foulées sont décisives. Penche le corps vers l\'avant à 45° au départ. Bras qui propulsent fort.',
    progressionPhase2: 'Passer à 10 sprints, réduire la récupération à 40 secondes.',
    progressionPhase3: 'Départ dos à la direction de course (demi-tour + sprint).',
    videoUrl: 'https://www.youtube.com/embed/nSfGzGCxFBc',
    imageUrl: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=400&q=80',
  },
  {
    id: 'sprint_20m_cdc',
    name: 'Sprint 20m avec changement de direction',
    phase: 'Accélération',
    durationMin: 8,
    reps: 6,
    equipment: 'Plots',
    description: 'Sprint 10m → toucher plot → sprint retour 10m. 6 répétitions. Récupération 60 secondes. Variante : départ dos à la direction (réaction + demi-tour).',
    coachTip: 'Le changement de direction doit être explosif. Plante le pied extérieur, pousse fort, ne ralentis pas avant le plot.',
    progressionPhase2: 'Ajouter une troisième direction (T-test : gauche, droite, retour).',
    progressionPhase3: 'Ajouter un sprint final de 15m après le retour.',
    videoUrl: 'https://www.youtube.com/embed/6H5-VGQW_EY',
    imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&q=80',
  },
  {
    id: 'depart_positions',
    name: 'Démarrage depuis positions variées',
    phase: 'Accélération',
    durationMin: 8,
    reps: 9,
    equipment: 'Aucun',
    description: 'Départ assis → sprint 10m (×3). Départ allongé face au sol → sprint 10m (×3). Départ allongé dos au sol → sprint 10m (×3). Récupération 45 secondes.',
    coachTip: 'Simule les situations de jeu réelles. Au foot, tu n\'es jamais en position parfaite pour démarrer.',
    progressionPhase2: 'Ajouter un départ depuis une position de combat (lutte légère avec partenaire).',
    progressionPhase3: 'Ajouter un ballon à contrôler après le sprint.',
    videoUrl: 'https://www.youtube.com/embed/Oy5ORnlGME4',
    imageUrl: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=400&q=80',
  },
  {
    id: 'conduite_acceleration',
    name: 'Conduite de balle + accélération',
    phase: 'Ballon',
    durationMin: 6,
    reps: 8,
    equipment: 'Ballon',
    description: 'Conduite lente 10m → accélération maximale 10m. 8 répétitions. Récupération 30 secondes. Focus sur la transition conduite lente → sprint.',
    coachTip: 'La balle doit rester proche du pied pendant l\'accélération. Pousse la balle devant toi sur 1-2m pour accélérer.',
    progressionPhase2: 'Ajouter un défenseur passif (qui essaie de toucher la balle).',
    progressionPhase3: 'Ajouter une frappe au but à l\'arrivée.',
    videoUrl: 'https://www.youtube.com/embed/2_LKfxBNEhw',
    imageUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400&q=80',
  },
  {
    id: 'dribble_carre',
    name: 'Dribble en carré — Changements de direction',
    phase: 'Ballon',
    durationMin: 6,
    reps: 6,
    equipment: 'Ballon + 4 plots (5m×5m)',
    description: '4 plots en carré de 5m×5m. Dribble autour du carré en changeant de direction à chaque plot. 6 passages chronométrés. Varie les feintes (crochet, Zidane, Ronaldo).',
    coachTip: 'Utilise l\'intérieur ET l\'extérieur du pied. La feinte doit être convaincante — pas juste un changement de direction.',
    progressionPhase2: 'Réduire le carré à 4m×4m.',
    progressionPhase3: 'Ajouter un défenseur dans le carré.',
    videoUrl: 'https://www.youtube.com/embed/nSfGzGCxFBc',
    imageUrl: 'https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?w=400&q=80',
  },
  {
    id: 'frappe_apres_sprint',
    name: 'Frappe après sprint — Technique sous fatigue',
    phase: 'Ballon',
    durationMin: 8,
    reps: 8,
    equipment: 'Ballon + but ou cible',
    description: 'Sprint 15m → réception balle → frappe au but. 8 répétitions. Récupération 45 secondes. Travaille la coordination vitesse + technique sous fatigue.',
    coachTip: 'La frappe sous fatigue révèle tes vrais automatismes. Concentre-toi sur la technique même quand tu es essoufflé.',
    progressionPhase2: 'Ajouter une passe de tête avant la frappe.',
    progressionPhase3: 'Sprint + dribble 1v1 + frappe.',
    videoUrl: 'https://www.youtube.com/embed/6H5-VGQW_EY',
    imageUrl: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=400&q=80',
  },
];

const footballScores: FootballScore[] = [
  { id: 'sprint_10m_time', name: 'Temps sprint 10m', unit: 'secondes', target: '< 1.8s', description: 'Temps moyen sur les 3 meilleurs sprints de 10m. Mesure l\'explosivité pure au démarrage.' },
  { id: 'slalom_time', name: 'Temps slalom 8 plots', unit: 'secondes', target: '< 8s', description: 'Temps sur le slalom de 8 plots espacés de 1m. Mesure la vitesse de changement de direction.' },
  { id: 'sprints_completed', name: 'Sprints sans perte de vitesse', unit: 'sur 8', target: '8/8', description: 'Nombre de sprints maintenus à intensité maximale. Mesure l\'endurance explosive.' },
  { id: 'session_feeling', name: 'Ressenti global', unit: '/10', target: '≥ 7/10', description: 'Évaluation subjective de la séance. Prend en compte la fatigue, la qualité des appuis et la progression.' },
];

// ============================================================
// STRUCTURE DES SÉANCES
// ============================================================

const sessions: WorkoutSession[] = [
  {
    id: 'upper_a',
    day: 1,
    type: 'gym' as const,
    name: 'Haut du corps A',
    focus: 'Pectoraux · Épaules · Triceps',
    durationMin: 65,
    exercises: [
      exerciseDatabase.developpe_couche,
      exerciseDatabase.developpe_militaire,
      exerciseDatabase.dips,
      exerciseDatabase.ecarte_incline,
      exerciseDatabase.elevations_laterales,
      exerciseDatabase.extension_triceps_poulie,
    ],
    coachNote: "Commence par t'échauffer 10 min : vélo léger + 2 séries légères de développé couché. Les triceps représentent 2/3 du volume du bras — ne néglige pas les dips et les extensions. Concentre-toi sur la connexion esprit-muscle.",
  },
  {
    id: 'lower_a',
    day: 3,
    type: 'gym' as const,
    name: 'Bas du corps A',
    focus: 'Quadriceps · Fessiers · Abdos',
    durationMin: 70,
    exercises: [
      exerciseDatabase.squat,
      exerciseDatabase.presse_cuisses,
      exerciseDatabase.leg_extension,
      exerciseDatabase.hip_thrust,
      exerciseDatabase.releve_jambes,
      exerciseDatabase.gainage,
    ],
    coachNote: "Le squat est LA priorité de cette séance. Prends le temps de bien t'échauffer (10 min cardio + squats progressifs). Si tu as des douleurs aux genoux, remplace le leg extension par des fentes. Les abdos se font à la fin, jamais au début.",
  },
  {
    id: 'upper_b',
    day: 4,
    type: 'gym' as const,
    name: 'Haut du corps B',
    focus: 'Dos · Épaules · Biceps',
    durationMin: 65,
    exercises: [
      exerciseDatabase.tractions,
      exerciseDatabase.rowing_barre,
      exerciseDatabase.tirage_horizontal,
      exerciseDatabase.face_pull,
      exerciseDatabase.curl_incline,
      exerciseDatabase.curl_marteau,
    ],
    coachNote: "Les tractions sont l'exercice le plus important pour les bras — elles développent les biceps ET le dos. Le curl incliné est ton arme secrète pour des biceps massifs. Face pull en fin de séance pour protéger tes épaules sur le long terme.",
  },
  {
    id: 'lower_b',
    day: 8,
    type: 'gym' as const,
    name: 'Bas du corps B',
    focus: 'Ischio-jambiers · Mollets · Abdos',
    durationMin: 65,
    exercises: [
      exerciseDatabase.souleve_de_terre,
      exerciseDatabase.fentes_bulgares,
      exerciseDatabase.leg_curl,
      exerciseDatabase.extensions_mollets,
      exerciseDatabase.crunches_poulie,
      exerciseDatabase.russian_twist,
    ],
    coachNote: "Le soulevé de terre est l'exercice le plus complet qui soit. Priorité absolue à la technique — un mauvais dos peut te mettre hors service des semaines. Les mollets nécessitent un volume élevé (5 séries) et une amplitude complète pour progresser.",
  },
  // --- SÉANCE FOOTBALL ---
  {
    id: 'football',
    day: 5,
    type: 'football' as const,
    name: 'Séance Football',
    focus: 'Explosivité · Appuis · Accélération',
    durationMin: 70,
    exercises: [],
    coachNote: "Cette séance est conçue pour te rendre DOMINANT sur le terrain. Chaque exercice simule une situation de jeu réelle. Chronomètre tes sprints et note tes scores — c'est comme ça que tu verras ta progression. La créatine (5g/jour) va directement booster tes performances ici.",
    cardioDetails: {
      type: 'football',
      warmupMin: 10,
      cooldownMin: 8,
      totalCaloriesBurned: 450,
      mainBlocks: [
        { name: 'Travail d\'appuis', description: 'Rythme, slalom, latéralité', durationMin: 15, intensity: 'high', coachTip: 'Appuis légers, fréquence élevée, centre de gravité bas.' },
        { name: 'Accélération & démarrage', description: 'Sprints 10m, 20m avec CDC, positions variées', durationMin: 22, intensity: 'maximal', coachTip: 'Récupération complète entre chaque sprint — qualité > quantité.' },
        { name: 'Technique avec ballon', description: 'Conduite + accélération, dribble, frappe sous fatigue', durationMin: 18, intensity: 'high', coachTip: 'La balle doit être une extension de ton pied. Même sous fatigue.' },
      ],
      footballDrills,
      scores: footballScores,
    },
  },
  // --- COURSE ENDURANCE ---
  {
    id: 'running_endurance',
    day: 2,
    type: 'running' as const,
    name: 'Course — Endurance',
    focus: 'Base aérobie · Endurance football',
    durationMin: 40,
    exercises: [],
    coachNote: "Cette course développe ta base aérobie — indispensable pour tenir 90 minutes au foot. Allure conversation (tu peux parler). Ne t'épuise pas, c'est une séance de développement, pas de performance.",
    cardioDetails: {
      type: 'running_endurance',
      warmupMin: 5,
      cooldownMin: 5,
      totalCaloriesBurned: 320,
      mainBlocks: [
        { name: 'Footing zone 2', description: '30 minutes à allure conversation (65-70% FC max). Tu dois pouvoir parler en courant.', durationMin: 30, intensity: 'low', coachTip: 'Si tu ne peux plus parler, ralentis. Zone 2 = la zone où les adaptations aérobies sont maximales.' },
      ],
    },
  },
  // --- COURSE FRACTIONNÉE ---
  {
    id: 'running_intervals',
    day: 6,
    type: 'running' as const,
    name: 'Course — Fractionné',
    focus: 'VMA · Vitesse · Explosivité cardio',
    durationMin: 35,
    exercises: [],
    coachNote: "Le fractionné développe ta VMA (vitesse maximale aérobie) — directement transférable au foot. 8 sprints de 30 secondes à fond, récupération 90 secondes. C'est difficile mais c'est ce qui te rend plus rapide.",
    cardioDetails: {
      type: 'running_intervals',
      warmupMin: 10,
      cooldownMin: 8,
      totalCaloriesBurned: 380,
      mainBlocks: [
        { name: 'Fractionné 30/90', description: '8 × 30 secondes à vitesse maximale / 90 secondes récupération active (marche ou footing très léger).', durationMin: 16, reps: 8, intensity: 'maximal', coachTip: 'Chaque sprint doit être à 95-100% de ton maximum. Si tu peux tenir une conversation, tu n\'es pas assez vite.' },
      ],
    },
  },
  // --- VÉLO ---
  {
    id: 'cycling',
    day: 7,
    type: 'cycling' as const,
    name: 'Vélo — Récupération active',
    focus: 'Récupération · Endurance douce',
    durationMin: 55,
    exercises: [],
    coachNote: "Le vélo est ta séance de récupération active. Intensité légère à modérée — jamais épuisant. Il favorise la circulation sanguine dans les jambes et accélère la récupération musculaire sans les abîmer. Profites-en pour te vider la tête.",
    cardioDetails: {
      type: 'cycling',
      warmupMin: 5,
      cooldownMin: 5,
      totalCaloriesBurned: 280,
      mainBlocks: [
        { name: 'Vélo intensité modérée', description: '45 minutes à intensité légère à modérée. Cadence régulière, jamais essoufflé. Profite du paysage.', durationMin: 45, intensity: 'low', coachTip: 'Résistance légère, cadence de pédalage élevée (80-90 tours/min). Évite les grosses montées.' },
      ],
    },
  },
  // --- REPOS ---
  {
    id: 'rest',
    day: 14,
    type: 'rest' as const,
    name: 'Repos total',
    focus: 'Récupération · Croissance musculaire',
    durationMin: 0,
    exercises: [],
    coachNote: "Le muscle grandit pendant le repos, pas pendant l'entraînement. Cette journée est aussi importante que tes séances. Dors 8h+, mange bien, étire-toi légèrement si tu veux. Pas de sport.",
  },
];

// ============================================================
// CYCLE 14 JOURS — Planning
// ============================================================

export const cycle14Days: Cycle14Day[] = [
  { dayNumber: 1,  sessionId: 'upper_a',           label: 'Musculation Haut A',    type: 'gym',      icon: '💪', colorClass: 'orange' },
  { dayNumber: 2,  sessionId: 'running_endurance',  label: 'Course — Endurance',    type: 'running',  icon: '🏃', colorClass: 'blue' },
  { dayNumber: 3,  sessionId: 'lower_a',            label: 'Musculation Bas A',     type: 'gym',      icon: '🦵', colorClass: 'orange' },
  { dayNumber: 4,  sessionId: 'upper_b',            label: 'Musculation Haut B',    type: 'gym',      icon: '💪', colorClass: 'orange' },
  { dayNumber: 5,  sessionId: 'football',           label: 'Séance Football',       type: 'football', icon: '⚽', colorClass: 'green' },
  { dayNumber: 6,  sessionId: 'running_intervals',  label: 'Course — Fractionné',   type: 'running',  icon: '⚡', colorClass: 'blue' },
  { dayNumber: 7,  sessionId: 'cycling',            label: 'Vélo',                  type: 'cycling',  icon: '🚴', colorClass: 'teal' },
  { dayNumber: 8,  sessionId: 'lower_b',            label: 'Musculation Bas B',     type: 'gym',      icon: '🦵', colorClass: 'orange' },
  { dayNumber: 9,  sessionId: 'upper_a',            label: 'Musculation Haut A',    type: 'gym',      icon: '💪', colorClass: 'orange' },
  { dayNumber: 10, sessionId: 'running_endurance',  label: 'Course — Endurance',    type: 'running',  icon: '🏃', colorClass: 'blue' },
  { dayNumber: 11, sessionId: 'lower_a',            label: 'Musculation Bas A',     type: 'gym',      icon: '🦵', colorClass: 'orange' },
  { dayNumber: 12, sessionId: 'upper_b',            label: 'Musculation Haut B',    type: 'gym',      icon: '💪', colorClass: 'orange' },
  { dayNumber: 13, sessionId: 'football',           label: 'Séance Football',       type: 'football', icon: '⚽', colorClass: 'green' },
  { dayNumber: 14, sessionId: 'rest',               label: 'Repos Total',           type: 'rest',     icon: '😴', colorClass: 'gray' },
];

// Retourne la séance correspondant à un jour du cycle
export function getSessionForCycleDay(dayNumber: number): WorkoutSession | undefined {
  const cycleDay = cycle14Days.find(d => d.dayNumber === dayNumber);
  if (!cycleDay) return undefined;
  return sessions.find(s => s.id === cycleDay.sessionId);
}

// Retourne le jour du cycle (1-14) pour une date donnée
export function getCycleDayForDate(date: Date, programStartDate: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  const daysSinceStart = Math.floor((date.getTime() - programStartDate.getTime()) / msPerDay);
  return (daysSinceStart % 14) + 1;
}

// ============================================================
// PHASES DU PROGRAMME SUR 3 MOIS
// ============================================================

export const phases = [
  {
    id: 'phase1',
    name: 'Phase 1 — Fondation',
    weeks: '1 à 4',
    weekRange: [1, 4],
    description: "Apprentissage des mouvements, mise en place des habitudes. Charges modérées pour maîtriser la technique. Objectif : finir chaque séance avec la sensation d'avoir pu faire 1-2 reps de plus.",
    color: '#FF6B35',
    keyFocus: ['Maîtrise technique', 'Connexion esprit-muscle', 'Établir les charges de base'],
  },
  {
    id: 'phase2',
    name: 'Phase 2 — Développement',
    weeks: '5 à 8',
    weekRange: [5, 8],
    description: "Augmentation progressive du volume et des charges. Les bases sont solides, il est temps de pousser. Chaque séance doit être légèrement plus difficile que la précédente.",
    color: '#FF3366',
    keyFocus: ['Surcharge progressive systématique', 'Augmentation du volume', 'Optimisation de la nutrition'],
  },
  {
    id: 'phase3',
    name: 'Phase 3 — Intensification',
    weeks: '9 à 12',
    weekRange: [9, 12],
    description: "Intensité maximale. Introduction de techniques avancées (drop sets, rest-pause). Semaine 12 = semaine de décharge (volume réduit de 40%) pour permettre une super-compensation.",
    color: '#CC2255',
    keyFocus: ['Intensité maximale', 'Techniques avancées', 'Semaine de décharge (S12)'],
  },
];

// ============================================================
// DONNÉES NUTRITIONNELLES
// ============================================================

export const foodItems: FoodItem[] = [
  // PROTÉINES
  {
    id: 'poulet',
    name: 'Blanc de poulet / dinde',
    category: 'proteins',
    relevanceScore: 100,
    relevanceReason: "Source de protéines maigre par excellence. Haute valeur biologique, faible en lipides. Polyvalent et économique.",
    per100g: { proteins: 27, carbs: 0, fats: 3, calories: 135 },
    tips: "Cuit à la vapeur ou grillé. Évite la friture. Peut être préparé en batch pour la semaine.",
    timing: "Déjeuner, dîner",
  },
  {
    id: 'oeufs',
    name: 'Œufs entiers (bio)',
    category: 'proteins',
    relevanceScore: 95,
    relevanceReason: "Protéine de référence (score PDCAAS = 1.0). Riches en leucine (déclencheur de la synthèse protéique), en vitamines B12, D et en bonnes graisses.",
    per100g: { proteins: 13, carbs: 1, fats: 10, calories: 143 },
    tips: "Consomme les jaunes ! Ils contiennent la majorité des nutriments. 3-4 œufs entiers par jour est optimal.",
    timing: "Petit-déjeuner, collation",
  },
  {
    id: 'saumon',
    name: 'Saumon',
    category: 'proteins',
    relevanceScore: 92,
    relevanceReason: "Riche en oméga-3 (anti-inflammatoire, favorise la récupération), en protéines et en vitamine D. Légèrement plus calorique mais très bénéfique.",
    per100g: { proteins: 20, carbs: 0, fats: 13, calories: 208 },
    tips: "2-3 fois par semaine. Préférer le saumon sauvage ou label rouge.",
    timing: "Dîner",
  },
  {
    id: 'poisson_blanc',
    name: 'Poisson blanc (cabillaud, colin)',
    category: 'proteins',
    relevanceScore: 95,
    relevanceReason: "Très maigre, haute teneur en protéines. Idéal pour les jours où tu veux contrôler les calories.",
    per100g: { proteins: 23, carbs: 0, fats: 1, calories: 82 },
    tips: "Facile à préparer en papillote avec des légumes. Très digeste.",
    timing: "Dîner",
  },
  {
    id: 'viande_rouge',
    name: 'Viande rouge maigre (5% MG)',
    category: 'proteins',
    relevanceScore: 85,
    relevanceReason: "Riche en créatine naturelle, en fer et en zinc — tous essentiels à la performance. À consommer 2-3 fois par semaine maximum.",
    per100g: { proteins: 25, carbs: 0, fats: 5, calories: 145 },
    tips: "Préfère le bœuf haché 5% MG, le steak ou le filet. Évite les charcuteries.",
    timing: "Déjeuner, dîner",
  },
  {
    id: 'whey',
    name: 'Whey Protein Isolate',
    category: 'proteins',
    relevanceScore: 83,
    relevanceReason: "Pratique pour atteindre les objectifs protéiques. Absorption rapide, idéale en post-training. Ne remplace pas les vrais aliments.",
    per100g: { proteins: 85, carbs: 4, fats: 1, calories: 370 },
    tips: "1 shake de 30g après l'entraînement. Choisir une whey isolate (moins de lactose). Pas indispensable si l'alimentation est bien structurée.",
    timing: "Post-training",
  },
  {
    id: 'fromage_blanc',
    name: 'Fromage blanc 0%',
    category: 'proteins',
    relevanceScore: 88,
    relevanceReason: "Riche en caséine (protéine à digestion lente). Idéal avant de dormir pour alimenter les muscles pendant la nuit.",
    per100g: { proteins: 8, carbs: 4, fats: 0, calories: 48 },
    tips: "250g avant de dormir = 20g de protéines à digestion lente. Ajoute des fruits rouges pour les antioxydants.",
    timing: "Avant de dormir",
  },

  // GLUCIDES
  {
    id: 'patate_douce',
    name: 'Patate douce',
    category: 'carbs',
    relevanceScore: 100,
    relevanceReason: "Index glycémique bas, riche en vitamines A, C et B6. Énergie durable sans pic d'insuline. Le glucide parfait pour la prise de masse sèche.",
    per100g: { proteins: 2, carbs: 20, fats: 0, calories: 86 },
    tips: "Cuite au four ou à la vapeur. Prépare-en plusieurs à l'avance pour la semaine.",
    timing: "Déjeuner, dîner",
  },
  {
    id: 'flocons_avoine',
    name: 'Flocons d\'avoine',
    category: 'carbs',
    relevanceScore: 100,
    relevanceReason: "Énergie durable, riche en fibres bêta-glucanes (santé cardiovasculaire), en fer et en magnésium. Le petit-déjeuner idéal pour un athlète.",
    per100g: { proteins: 13, carbs: 60, fats: 7, calories: 389 },
    tips: "100g (poids sec) avec du lait ou de l'eau. Ajoute une banane et une poignée d'amandes.",
    timing: "Petit-déjeuner",
  },
  {
    id: 'riz_basmati',
    name: 'Riz basmati / complet',
    category: 'carbs',
    relevanceScore: 95,
    relevanceReason: "Excellente source d'énergie, facile à digérer. Le riz complet apporte plus de fibres et de micronutriments.",
    per100g: { proteins: 3, carbs: 28, fats: 0, calories: 130 },
    tips: "Cuit. Prépare en grande quantité et conserve au frigo. Idéal autour de l'entraînement.",
    timing: "Déjeuner, dîner (surtout autour de l'entraînement)",
  },
  {
    id: 'quinoa',
    name: 'Quinoa',
    category: 'carbs',
    relevanceScore: 90,
    relevanceReason: "Contient tous les acides aminés essentiels (protéine complète). Riche en fer et en magnésium. Excellent pour la variété.",
    per100g: { proteins: 4, carbs: 21, fats: 2, calories: 120 },
    tips: "Cuit. Peut remplacer le riz dans n'importe quel repas.",
    timing: "Déjeuner, dîner",
  },
  {
    id: 'pates_completes',
    name: 'Pâtes complètes',
    category: 'carbs',
    relevanceScore: 85,
    relevanceReason: "Bonne source d'énergie, plus riche en fibres que les pâtes blanches. Pratique et économique.",
    per100g: { proteins: 5, carbs: 28, fats: 1, calories: 140 },
    tips: "Cuites al dente (index glycémique plus bas). Avec une sauce tomate maison et du poulet.",
    timing: "Déjeuner, dîner",
  },
  {
    id: 'banane',
    name: 'Banane',
    category: 'carbs',
    relevanceScore: 82,
    relevanceReason: "Riche en potassium (prévient les crampes), en glucides rapides. Idéale avant ou après l'entraînement.",
    per100g: { proteins: 1, carbs: 23, fats: 0, calories: 89 },
    tips: "1-2 bananes autour de l'entraînement. Évite d'en manger trop le soir.",
    timing: "Pré/post-training",
  },

  // LIPIDES
  {
    id: 'avocat',
    name: 'Avocat',
    category: 'fats',
    relevanceScore: 100,
    relevanceReason: "Riche en acides gras mono-insaturés (santé cardiovasculaire), en potassium et en vitamines E et K. Favorise l'absorption des vitamines liposolubles.",
    per100g: { proteins: 2, carbs: 9, fats: 15, calories: 160 },
    tips: "1/2 avocat par jour. Avec des œufs au petit-déjeuner ou en guacamole.",
    timing: "Tout moment",
  },
  {
    id: 'huile_olive',
    name: 'Huile d\'olive extra vierge',
    category: 'fats',
    relevanceScore: 100,
    relevanceReason: "Riche en polyphénols (anti-inflammatoires), en acides gras mono-insaturés. La base de la cuisine méditerranéenne.",
    per100g: { proteins: 0, carbs: 0, fats: 100, calories: 884 },
    tips: "1-2 cuillères à soupe par repas pour l'assaisonnement. Ne pas cuire à haute température.",
    timing: "Assaisonnement",
  },
  {
    id: 'amandes',
    name: 'Amandes, noix, noisettes',
    category: 'fats',
    relevanceScore: 92,
    relevanceReason: "Riches en bonnes graisses, en magnésium (récupération musculaire), en vitamine E. Collation parfaite entre les repas.",
    per100g: { proteins: 21, carbs: 22, fats: 49, calories: 579 },
    tips: "Une poignée (30g) par jour. Attention aux calories — facile de trop en manger.",
    timing: "Collation",
  },

  // LÉGUMES
  {
    id: 'brocolis',
    name: 'Brocolis, haricots verts, épinards',
    category: 'vegetables',
    relevanceScore: 95,
    relevanceReason: "Riches en fibres, vitamines C et K, calcium et antioxydants. Favorisent la santé intestinale et la récupération. À volonté.",
    per100g: { proteins: 3, carbs: 7, fats: 0, calories: 34 },
    tips: "À chaque repas principal. Cuits à la vapeur pour préserver les nutriments.",
    timing: "Déjeuner, dîner",
  },
];

// ============================================================
// MACROS CIBLES
// ============================================================

export const macroTargets = {
  calories: 2900,
  proteins: 140,
  carbs: 430,
  fats: 70,
  proteinPerKg: 2.0, // g/kg de poids de corps
};

// ============================================================
// CONSEILS AVANCÉS
// ============================================================

export const advancedTips = {
  sleep: [
    "7-9 heures de sommeil par nuit sont non-négociables. C'est pendant le sommeil que 70% de la GH (hormone de croissance) est sécrétée.",
    "Évite les écrans 1h avant de dormir — la lumière bleue perturbe la mélatonine.",
    "Une température de chambre entre 16-19°C optimise la qualité du sommeil.",
  ],
  hydration: [
    "Bois 3-4L d'eau par jour. La déshydratation réduit les performances de 10-20%.",
    "Bois 500ml d'eau 30 min avant l'entraînement.",
    "Ajoute une pincée de sel de mer dans ton eau post-training pour rééquilibrer les électrolytes.",
  ],
  recovery: [
    "Les étirements statiques (30 sec par muscle) après l'entraînement réduisent les courbatures.",
    "Un bain froid (10-15°C) de 10 min après une séance intense accélère la récupération.",
    "Le massage avec un rouleau en mousse (foam roller) améliore la circulation et réduit les tensions.",
  ],
  supplements: [
    "Créatine monohydrate : 5g/jour (sans phase de charge). Le supplément le plus étudié et le plus efficace pour la force et la masse musculaire.",
    "Vitamine D3 : 2000-4000 UI/jour (surtout en hiver). Essentielle pour la testostérone et la santé osseuse.",
    "Magnésium bisglycinate : 300-400mg le soir. Améliore la qualité du sommeil et la récupération musculaire.",
    "Oméga-3 : 2-3g d'EPA+DHA/jour. Anti-inflammatoire, favorise la synthèse protéique.",
  ],
  mindset: [
    "La progression n'est pas linéaire. Il y aura des plateaux — c'est normal. Continue à te présenter à la salle.",
    "Prends des photos toutes les 2 semaines. Le miroir ment, les photos montrent la vérité.",
    "Entraîne-toi avec quelqu'un de plus fort que toi quand c'est possible — ça tire vers le haut.",
    "La cohérence sur 3 mois vaut mieux que 3 semaines parfaites suivies d'un abandon.",
  ],
};

// ============================================================
// EXPORT PRINCIPAL
// ============================================================

export const programData = {
  sessions,
  phases,
  foodItems,
  macroTargets,
  advancedTips,
  exerciseDatabase,
  cycle14Days,
  footballDrills,
  footballScores,
};

export default programData;
