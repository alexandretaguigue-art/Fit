/**
 * OnboardingPage — First-time onboarding 5 étapes
 * Design "Coach Nocturne" — dark premium
 *
 * Étape 1 : Identité (prénom, âge, sexe, poids, taille)
 * Étape 2 : Objectif (lean bulk, sèche, recompo, performance, santé, maintien)
 * Étape 3 : Mode de vie (activité quotidienne, régime, repas/jour)
 * Étape 4 : Sports (type, niveau, séances/semaine)
 * Étape 5 : Cibles (poids cible, délai, aliments à éviter, préférences)
 * → Génération IA + sauvegarde DB + redirection accueil
 */
import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useUserProfile } from "@/hooks/useUserProfile";
import {
  ChevronRight,
  ChevronLeft,
  Dumbbell,
  Target,
  Zap,
  Utensils,
  Trophy,
  Loader2,
  Check,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProfileData {
  // Étape 1
  name: string;
  age: number;
  sex: "homme" | "femme" | "autre";
  weight: number;
  height: number;
  // Étape 2
  goal: string;
  // Étape 3
  activity: string;
  diet: string;
  mealsPerDay: number;
  // Étape 4
  sports: string[];
  level: string;
  sessionsPerWeek: number;
  // Étape 5
  targetWeight: number;
  timeline: number;
  avoid: string;
  foodPrefs: string;
}

const DEFAULT_PROFILE: ProfileData = {
  name: "",
  age: 25,
  sex: "homme",
  weight: 75,
  height: 175,
  goal: "lean_bulk",
  activity: "moderate",
  diet: "omnivore",
  mealsPerDay: 5,
  sports: ["musculation"],
  level: "intermediaire",
  sessionsPerWeek: 4,
  targetWeight: 80,
  timeline: 12,
  avoid: "",
  foodPrefs: "",
};

// ─── Step components ──────────────────────────────────────────────────────────

function StepIdentity({
  data,
  onChange,
}: {
  data: ProfileData;
  onChange: (d: Partial<ProfileData>) => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <label className="block text-white/60 text-xs font-semibold uppercase tracking-wider mb-2">
          Prénom
        </label>
        <input
          type="text"
          value={data.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="Ex : Alex"
          className="w-full px-4 py-3 rounded-xl text-white placeholder-white/30 outline-none focus:ring-2 focus:ring-orange-500/50 transition-all"
          style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-white/60 text-xs font-semibold uppercase tracking-wider mb-2">
            Âge
          </label>
          <input
            type="number"
            value={data.age}
            onChange={(e) => onChange({ age: Number(e.target.value) })}
            min={10}
            max={100}
            className="w-full px-4 py-3 rounded-xl text-white outline-none focus:ring-2 focus:ring-orange-500/50 transition-all"
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}
          />
        </div>
        <div>
          <label className="block text-white/60 text-xs font-semibold uppercase tracking-wider mb-2">
            Sexe
          </label>
          <select
            value={data.sex}
            onChange={(e) => onChange({ sex: e.target.value as ProfileData["sex"] })}
            className="w-full px-4 py-3 rounded-xl text-white outline-none focus:ring-2 focus:ring-orange-500/50 transition-all"
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            <option value="homme">Homme</option>
            <option value="femme">Femme</option>
            <option value="autre">Autre</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-white/60 text-xs font-semibold uppercase tracking-wider mb-2">
            Poids (kg)
          </label>
          <input
            type="number"
            value={data.weight}
            onChange={(e) => onChange({ weight: Number(e.target.value) })}
            min={30}
            max={300}
            className="w-full px-4 py-3 rounded-xl text-white outline-none focus:ring-2 focus:ring-orange-500/50 transition-all"
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}
          />
        </div>
        <div>
          <label className="block text-white/60 text-xs font-semibold uppercase tracking-wider mb-2">
            Taille (cm)
          </label>
          <input
            type="number"
            value={data.height}
            onChange={(e) => onChange({ height: Number(e.target.value) })}
            min={100}
            max={250}
            className="w-full px-4 py-3 rounded-xl text-white outline-none focus:ring-2 focus:ring-orange-500/50 transition-all"
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}
          />
        </div>
      </div>
    </div>
  );
}

const GOALS = [
  { id: "lean_bulk", label: "Lean Bulk", desc: "Prise de masse propre", emoji: "💪" },
  { id: "seche", label: "Sèche", desc: "Perte de graisse", emoji: "🔥" },
  { id: "recomposition", label: "Recomposition", desc: "Muscle + perte de gras", emoji: "⚡" },
  { id: "performance", label: "Performance", desc: "Force & endurance", emoji: "🏆" },
  { id: "sante", label: "Santé", desc: "Bien-être général", emoji: "🌿" },
  { id: "maintien", label: "Maintien", desc: "Garder la forme", emoji: "⚖️" },
];

function StepGoal({
  data,
  onChange,
}: {
  data: ProfileData;
  onChange: (d: Partial<ProfileData>) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {GOALS.map((g) => (
        <button
          key={g.id}
          onClick={() => onChange({ goal: g.id })}
          className="p-4 rounded-2xl text-left transition-all duration-200 active:scale-95"
          style={{
            background:
              data.goal === g.id
                ? "rgba(255,107,53,0.15)"
                : "rgba(255,255,255,0.05)",
            border:
              data.goal === g.id
                ? "1px solid rgba(255,107,53,0.5)"
                : "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div className="text-2xl mb-2">{g.emoji}</div>
          <div
            className="font-bold text-sm"
            style={{ color: data.goal === g.id ? "#FF6B35" : "white", fontFamily: "Syne, sans-serif" }}
          >
            {g.label}
          </div>
          <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)", fontFamily: "Inter, sans-serif" }}>
            {g.desc}
          </div>
        </button>
      ))}
    </div>
  );
}

const ACTIVITIES = [
  { id: "sedentary", label: "Sédentaire", desc: "Bureau, peu de marche" },
  { id: "light", label: "Léger", desc: "1-2 sorties/sem" },
  { id: "moderate", label: "Modéré", desc: "3-4 activités/sem" },
  { id: "active", label: "Actif", desc: "5-6 séances/sem" },
  { id: "very_active", label: "Très actif", desc: "Sportif quotidien" },
];

const DIETS = [
  { id: "omnivore", label: "Omnivore" },
  { id: "vegetarian", label: "Végétarien" },
  { id: "vegan", label: "Vegan" },
  { id: "pescatarian", label: "Pescétarien" },
  { id: "keto", label: "Keto" },
  { id: "paleo", label: "Paléo" },
];

function StepLifestyle({
  data,
  onChange,
}: {
  data: ProfileData;
  onChange: (d: Partial<ProfileData>) => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <label className="block text-white/60 text-xs font-semibold uppercase tracking-wider mb-3">
          Activité quotidienne
        </label>
        <div className="space-y-2">
          {ACTIVITIES.map((a) => (
            <button
              key={a.id}
              onClick={() => onChange({ activity: a.id })}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 active:scale-98"
              style={{
                background:
                  data.activity === a.id
                    ? "rgba(255,107,53,0.12)"
                    : "rgba(255,255,255,0.05)",
                border:
                  data.activity === a.id
                    ? "1px solid rgba(255,107,53,0.4)"
                    : "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <div className="text-left">
                <div className="text-sm font-semibold" style={{ color: data.activity === a.id ? "#FF6B35" : "white", fontFamily: "Inter, sans-serif" }}>
                  {a.label}
                </div>
                <div className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>{a.desc}</div>
              </div>
              {data.activity === a.id && <Check size={16} style={{ color: "#FF6B35" }} />}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-white/60 text-xs font-semibold uppercase tracking-wider mb-3">
          Régime alimentaire
        </label>
        <div className="grid grid-cols-3 gap-2">
          {DIETS.map((d) => (
            <button
              key={d.id}
              onClick={() => onChange({ diet: d.id })}
              className="py-2.5 px-3 rounded-xl text-xs font-semibold transition-all duration-200 active:scale-95"
              style={{
                background:
                  data.diet === d.id
                    ? "rgba(255,107,53,0.15)"
                    : "rgba(255,255,255,0.05)",
                border:
                  data.diet === d.id
                    ? "1px solid rgba(255,107,53,0.5)"
                    : "1px solid rgba(255,255,255,0.08)",
                color: data.diet === d.id ? "#FF6B35" : "rgba(255,255,255,0.7)",
                fontFamily: "Inter, sans-serif",
              }}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-white/60 text-xs font-semibold uppercase tracking-wider mb-2">
          Repas par jour : {data.mealsPerDay}
        </label>
        <input
          type="range"
          min={2}
          max={7}
          value={data.mealsPerDay}
          onChange={(e) => onChange({ mealsPerDay: Number(e.target.value) })}
          className="w-full accent-orange-500"
        />
        <div className="flex justify-between text-xs mt-1" style={{ color: "rgba(255,255,255,0.3)" }}>
          <span>2</span><span>7</span>
        </div>
      </div>
    </div>
  );
}

const SPORTS_LIST = [
  { id: "musculation", label: "Musculation", emoji: "🏋️" },
  { id: "running", label: "Running", emoji: "🏃" },
  { id: "velo", label: "Vélo", emoji: "🚴" },
  { id: "natation", label: "Natation", emoji: "🏊" },
  { id: "football", label: "Football", emoji: "⚽" },
  { id: "basket", label: "Basket", emoji: "🏀" },
  { id: "mma", label: "MMA", emoji: "🥊" },
  { id: "yoga", label: "Yoga", emoji: "🧘" },
  { id: "autre", label: "Autre", emoji: "🎯" },
];

const LEVELS = [
  { id: "debutant", label: "Débutant", desc: "< 1 an" },
  { id: "intermediaire", label: "Intermédiaire", desc: "1-3 ans" },
  { id: "avance", label: "Avancé", desc: "3+ ans" },
];

function StepSports({
  data,
  onChange,
}: {
  data: ProfileData;
  onChange: (d: Partial<ProfileData>) => void;
}) {
  const toggleSport = (id: string) => {
    const current = data.sports;
    if (current.includes(id)) {
      onChange({ sports: current.filter((s) => s !== id) });
    } else {
      onChange({ sports: [...current, id] });
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-white/60 text-xs font-semibold uppercase tracking-wider mb-3">
          Sports pratiqués (plusieurs choix)
        </label>
        <div className="grid grid-cols-3 gap-2">
          {SPORTS_LIST.map((s) => {
            const selected = data.sports.includes(s.id);
            return (
              <button
                key={s.id}
                onClick={() => toggleSport(s.id)}
                className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl transition-all duration-200 active:scale-95"
                style={{
                  background: selected ? "rgba(255,107,53,0.15)" : "rgba(255,255,255,0.05)",
                  border: selected ? "1px solid rgba(255,107,53,0.5)" : "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <span className="text-xl">{s.emoji}</span>
                <span className="text-xs font-semibold" style={{ color: selected ? "#FF6B35" : "rgba(255,255,255,0.7)", fontFamily: "Inter, sans-serif" }}>
                  {s.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="block text-white/60 text-xs font-semibold uppercase tracking-wider mb-3">
          Niveau
        </label>
        <div className="grid grid-cols-3 gap-2">
          {LEVELS.map((l) => (
            <button
              key={l.id}
              onClick={() => onChange({ level: l.id })}
              className="py-3 px-2 rounded-xl text-center transition-all duration-200 active:scale-95"
              style={{
                background: data.level === l.id ? "rgba(255,107,53,0.15)" : "rgba(255,255,255,0.05)",
                border: data.level === l.id ? "1px solid rgba(255,107,53,0.5)" : "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div className="text-sm font-bold" style={{ color: data.level === l.id ? "#FF6B35" : "white", fontFamily: "Syne, sans-serif" }}>
                {l.label}
              </div>
              <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>{l.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-white/60 text-xs font-semibold uppercase tracking-wider mb-2">
          Séances par semaine : {data.sessionsPerWeek}
        </label>
        <input
          type="range"
          min={1}
          max={14}
          value={data.sessionsPerWeek}
          onChange={(e) => onChange({ sessionsPerWeek: Number(e.target.value) })}
          className="w-full accent-orange-500"
        />
        <div className="flex justify-between text-xs mt-1" style={{ color: "rgba(255,255,255,0.3)" }}>
          <span>1</span><span>14</span>
        </div>
      </div>
    </div>
  );
}

function StepTargets({
  data,
  onChange,
}: {
  data: ProfileData;
  onChange: (d: Partial<ProfileData>) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-white/60 text-xs font-semibold uppercase tracking-wider mb-2">
            Poids cible (kg)
          </label>
          <input
            type="number"
            value={data.targetWeight}
            onChange={(e) => onChange({ targetWeight: Number(e.target.value) })}
            min={30}
            max={300}
            className="w-full px-4 py-3 rounded-xl text-white outline-none focus:ring-2 focus:ring-orange-500/50 transition-all"
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}
          />
        </div>
        <div>
          <label className="block text-white/60 text-xs font-semibold uppercase tracking-wider mb-2">
            Délai (semaines)
          </label>
          <input
            type="number"
            value={data.timeline}
            onChange={(e) => onChange({ timeline: Number(e.target.value) })}
            min={4}
            max={52}
            className="w-full px-4 py-3 rounded-xl text-white outline-none focus:ring-2 focus:ring-orange-500/50 transition-all"
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}
          />
        </div>
      </div>

      <div>
        <label className="block text-white/60 text-xs font-semibold uppercase tracking-wider mb-2">
          Aliments à éviter
        </label>
        <textarea
          value={data.avoid}
          onChange={(e) => onChange({ avoid: e.target.value })}
          placeholder="Ex : gluten, lactose, fruits de mer..."
          rows={2}
          className="w-full px-4 py-3 rounded-xl text-white placeholder-white/30 outline-none focus:ring-2 focus:ring-orange-500/50 transition-all resize-none"
          style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}
        />
      </div>

      <div>
        <label className="block text-white/60 text-xs font-semibold uppercase tracking-wider mb-2">
          Aliments préférés
        </label>
        <textarea
          value={data.foodPrefs}
          onChange={(e) => onChange({ foodPrefs: e.target.value })}
          placeholder="Ex : poulet, riz, œufs, avocat, pâtes..."
          rows={2}
          className="w-full px-4 py-3 rounded-xl text-white placeholder-white/30 outline-none focus:ring-2 focus:ring-orange-500/50 transition-all resize-none"
          style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}
        />
      </div>
    </div>
  );
}

// ─── Loading screen ────────────────────────────────────────────────────────────

function GeneratingScreen({ steps }: { steps: { label: string; done: boolean }[] }) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: "#0F0F14" }}
    >
      <div
        className="w-20 h-20 rounded-3xl flex items-center justify-center mb-8"
        style={{
          background: "linear-gradient(135deg, #FF6B35, #FF3366)",
          boxShadow: "0 8px 40px rgba(255,107,53,0.5)",
        }}
      >
        <Dumbbell size={36} className="text-white" />
      </div>

      <h2
        className="text-2xl font-bold text-white mb-2 text-center"
        style={{ fontFamily: "Syne, sans-serif" }}
      >
        Génération de ton programme
      </h2>
      <p
        className="text-white/50 text-sm text-center mb-10"
        style={{ fontFamily: "Inter, sans-serif" }}
      >
        L'IA analyse ton profil et crée un plan personnalisé…
      </p>

      <div className="w-full max-w-xs space-y-4">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-4">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{
                background: step.done
                  ? "rgba(34,197,94,0.2)"
                  : "rgba(255,255,255,0.07)",
                border: step.done
                  ? "1px solid rgba(34,197,94,0.5)"
                  : "1px solid rgba(255,255,255,0.1)",
              }}
            >
              {step.done ? (
                <Check size={14} style={{ color: "#22C55E" }} />
              ) : (
                <Loader2 size={14} className="animate-spin" style={{ color: "rgba(255,255,255,0.4)" }} />
              )}
            </div>
            <span
              className="text-sm"
              style={{
                color: step.done ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.4)",
                fontFamily: "Inter, sans-serif",
              }}
            >
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

const STEPS = [
  { title: "Qui es-tu ?", subtitle: "Dis-moi qui je suis", icon: <Dumbbell size={20} /> },
  { title: "Ton objectif", subtitle: "Qu'est-ce que tu veux atteindre ?", icon: <Target size={20} /> },
  { title: "Ton mode de vie", subtitle: "Alimentation & activité", icon: <Utensils size={20} /> },
  { title: "Tes sports", subtitle: "Ce que tu pratiques", icon: <Zap size={20} /> },
  { title: "Tes cibles", subtitle: "Où tu veux aller", icon: <Trophy size={20} /> },
];

export default function OnboardingPage() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<ProfileData>(DEFAULT_PROFILE);
  const { setAiNutritionPlan, setAiSportPlan } = useUserProfile();
  const [generating, setGenerating] = useState(false);
  const [genSteps, setGenSteps] = useState([
    { label: "Analyse du profil", done: false },
    { label: "Génération du plan nutrition", done: false },
    { label: "Génération du programme sport", done: false },
    { label: "Sauvegarde des données", done: false },
  ]);

  const updateProfile = (partial: Partial<ProfileData>) => {
    setProfile((prev) => ({ ...prev, ...partial }));
  };

  // tRPC mutations
  const saveProfile = trpc.onboarding.saveProfile.useMutation();
  const saveNutritionPlan = trpc.onboarding.saveNutritionPlan.useMutation();
  const saveSportPlan = trpc.onboarding.saveSportPlan.useMutation();
  const completeOnboarding = trpc.onboarding.complete.useMutation();
  const generateNutrition = trpc.agent.generateNutritionPlan.useMutation();
  const generateSport = trpc.agent.generateSportPlan.useMutation();

  const markGenStep = (idx: number) => {
    setGenSteps((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, done: true } : s))
    );
  };

  const handleFinish = async () => {
    setGenerating(true);

    try {
      // Step 0 — save profile
      await saveProfile.mutateAsync({
        name: profile.name || "Utilisateur",
        age: profile.age,
        sex: profile.sex,
        weight: profile.weight,
        height: profile.height,
        goal: profile.goal,
        activity: profile.activity,
        sports: profile.sports,
        diet: profile.diet,
        mealsPerDay: profile.mealsPerDay,
        level: profile.level,
        sessionsPerWeek: profile.sessionsPerWeek,
        targetWeight: profile.targetWeight,
        timeline: profile.timeline,
        avoid: profile.avoid,
        foodPrefs: profile.foodPrefs,
      });
      markGenStep(0);

      // Step 1 — generate nutrition plan
      const nutritionResult = await generateNutrition.mutateAsync({
        name: profile.name || "Utilisateur",
        age: profile.age,
        sex: profile.sex,
        weight: profile.weight,
        height: profile.height,
        goal: profile.goal,
        activity: profile.activity,
        sports: profile.sports,
        diet: profile.diet,
        mealsPerDay: profile.mealsPerDay,
        level: profile.level,
        sessionsPerWeek: profile.sessionsPerWeek,
        targetWeight: profile.targetWeight,
        timeline: profile.timeline,
        avoid: profile.avoid,
        foodPrefs: profile.foodPrefs,
      });
      markGenStep(1);

      // Step 2 — generate sport plan
      const sportResult = await generateSport.mutateAsync({
        name: profile.name || "Utilisateur",
        age: profile.age,
        sex: profile.sex,
        weight: profile.weight,
        height: profile.height,
        goal: profile.goal,
        activity: profile.activity,
        sports: profile.sports,
        diet: profile.diet,
        mealsPerDay: profile.mealsPerDay,
        level: profile.level,
        sessionsPerWeek: profile.sessionsPerWeek,
        targetWeight: profile.targetWeight,
        timeline: profile.timeline,
        avoid: profile.avoid,
        foodPrefs: profile.foodPrefs,
      });
      markGenStep(2);

      // Step 3 — save plans to DB + localStorage + mark onboarding done
      const nutritionPlan = nutritionResult as any;
      const sportPlan = sportResult as any;

      // Sauvegarder dans localStorage pour affichage immédiat
      if (nutritionPlan?.targets && nutritionPlan?.week) {
        setAiNutritionPlan({
          targets: nutritionPlan.targets,
          rationale: nutritionPlan.rationale ?? '',
          week: nutritionPlan.week,
        });
      }
      if (sportPlan?.program_name && sportPlan?.weeks) {
        setAiSportPlan({
          program_name: sportPlan.program_name,
          goal_statement: sportPlan.goal_statement ?? '',
          weeks: sportPlan.weeks,
        });
      }

      await Promise.all([
        saveNutritionPlan.mutateAsync({
          targets: nutritionPlan?.targets ?? { kcal: 2500, pro: 150, glu: 300, lip: 70 },
          week: nutritionPlan?.week ?? [],
        }),
        saveSportPlan.mutateAsync({
          programName: sportPlan?.program_name ?? "Mon Programme",
          goalStatement: sportPlan?.goal_statement ?? "",
          weeks: sportPlan?.weeks ?? [],
        }),
        completeOnboarding.mutateAsync(),
      ]);
      markGenStep(3);

      // Small delay so user sees all steps done
      await new Promise((r) => setTimeout(r, 800));
      toast.success("Ton programme est prêt ! 🎉");
      navigate("/");
    } catch (err: any) {
      console.error("[Onboarding] Generation failed:", err);
      // If Anthropic credits are exhausted, still complete onboarding
      if (err?.message?.includes("credit") || err?.message?.includes("529") || err?.message?.includes("overloaded")) {
        toast.error("Génération IA indisponible (crédits Anthropic épuisés). Profil sauvegardé.");
        try {
          await completeOnboarding.mutateAsync();
        } catch (_) {}
        navigate("/");
      } else {
        toast.error("Erreur lors de la génération. Réessaie.");
        setGenerating(false);
        setGenSteps((prev) => prev.map((s) => ({ ...s, done: false })));
      }
    }
  };

  if (generating) {
    return <GeneratingScreen steps={genSteps} />;
  }

  const canNext = () => {
    if (step === 0) return profile.name.trim().length > 0;
    if (step === 3) return profile.sports.length > 0;
    return true;
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "#0F0F14" }}
    >
      {/* Header */}
      <div className="px-5 pt-10 pb-4">
        {/* Progress bar */}
        <div className="flex gap-1.5 mb-6">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className="flex-1 h-1 rounded-full transition-all duration-500"
              style={{
                background:
                  i <= step
                    ? "linear-gradient(90deg, #FF6B35, #FF3366)"
                    : "rgba(255,255,255,0.1)",
              }}
            />
          ))}
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-1">
          <span
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: "#FF6B35", fontFamily: "Inter, sans-serif" }}
          >
            Étape {step + 1}/{STEPS.length}
          </span>
        </div>
        <h1
          className="text-2xl font-bold text-white"
          style={{ fontFamily: "Syne, sans-serif" }}
        >
          {STEPS[step].title}
        </h1>
        <p
          className="text-white/50 text-sm mt-0.5"
          style={{ fontFamily: "Inter, sans-serif" }}
        >
          {STEPS[step].subtitle}
        </p>
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-y-auto px-5 pb-6">
        {step === 0 && <StepIdentity data={profile} onChange={updateProfile} />}
        {step === 1 && <StepGoal data={profile} onChange={updateProfile} />}
        {step === 2 && <StepLifestyle data={profile} onChange={updateProfile} />}
        {step === 3 && <StepSports data={profile} onChange={updateProfile} />}
        {step === 4 && <StepTargets data={profile} onChange={updateProfile} />}
      </div>

      {/* Navigation */}
      <div
        className="px-5 pb-8 pt-4 flex gap-3"
        style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
      >
        {step > 0 && (
          <button
            onClick={() => setStep((s) => s - 1)}
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200 active:scale-95"
            style={{
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <ChevronLeft size={20} className="text-white/60" />
          </button>
        )}

        <button
          onClick={() => {
            if (step < STEPS.length - 1) {
              setStep((s) => s + 1);
            } else {
              handleFinish();
            }
          }}
          disabled={!canNext()}
          className="flex-1 h-12 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all duration-200 active:scale-95 disabled:opacity-40"
          style={{
            background: canNext()
              ? "linear-gradient(135deg, #FF6B35, #FF3366)"
              : "rgba(255,255,255,0.1)",
            boxShadow: canNext() ? "0 4px 20px rgba(255,107,53,0.3)" : "none",
            fontFamily: "Inter, sans-serif",
          }}
        >
          {step < STEPS.length - 1 ? (
            <>
              Continuer <ChevronRight size={18} />
            </>
          ) : (
            <>
              Générer mon programme <Zap size={18} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
