import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function callClaude(prompt: string, maxTokens = 4000): Promise<string> {
  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: maxTokens,
    messages: [{ role: "user", content: prompt }],
  });
  const block = response.content[0];
  if (block.type !== "text") throw new Error("Réponse inattendue");
  return block.text.trim();
}

function parseJSON<T>(raw: string): T {
  const cleaned = raw
    .replace(/^```json\s*/, "").replace(/^```\s*/, "").replace(/\s*```$/, "").trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    let fixed = cleaned;
    let ob = 0, cb = 0, oa = 0, ca = 0;
    for (const c of fixed) {
      if (c === "{") ob++; else if (c === "}") cb++;
      else if (c === "[") oa++; else if (c === "]") ca++;
    }
    for (let i = 0; i < ob - cb; i++) fixed += "}";
    for (let i = 0; i < oa - ca; i++) fixed += "]";
    return JSON.parse(fixed) as T;
  }
}

const ProfileSchema = z.object({
  name: z.string(),
  age: z.number(),
  sex: z.string(),
  weight: z.number(),
  height: z.number(),
  goal: z.string(),
  activity: z.string(),
  sports: z.array(z.string()),
  diet: z.string().optional(),
  avoid: z.string().optional(),
  foodPrefs: z.string().optional(),
  mealsPerDay: z.number(),
  level: z.string(),
  sessionsPerWeek: z.number(),
  targetWeight: z.number().nullable().optional(),
  timeline: z.number().optional(),
});

const ChatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
});

// Calcul BMR + TDEE côté serveur pour être précis
function calculateNeeds(p: z.infer<typeof ProfileSchema>) {
  // Mifflin-St Jeor
  const bmr = p.sex === "homme"
    ? 10 * p.weight + 6.25 * p.height - 5 * p.age + 5
    : 10 * p.weight + 6.25 * p.height - 5 * p.age - 161;

  const activityFactors: Record<string, number> = {
    sedentaire: 1.2, leger: 1.375, modere: 1.55, actif: 1.725, tres_actif: 1.9
  };
  const tdee = bmr * (activityFactors[p.activity] || 1.375);

  const goalDeltas: Record<string, number> = {
    lean_bulk: 250, cut: -400, recomp: 0, perf: 200, maintain: 0, health: 0
  };
  const targetKcal = Math.round(tdee + (goalDeltas[p.goal] || 0));

  const isMuscu = p.sports.includes("gym") || p.sports.includes("musculation");
  const isEndurance = p.sports.includes("running") || p.sports.includes("cycling") || p.sports.includes("swimming");
  const proteinPerKg = isMuscu ? 1.8 : isEndurance ? 1.4 : 1.6;
  const targetPro = Math.round(p.weight * proteinPerKg);
  const targetLip = Math.round((targetKcal * 0.25) / 9);
  const targetGlu = Math.round((targetKcal - targetPro * 4 - targetLip * 9) / 4);

  return { targetKcal, targetPro, targetGlu, targetLip, bmr: Math.round(bmr), tdee: Math.round(tdee) };
}

export const agentRouter = router({

  generateNutritionPlan: publicProcedure
    .input(ProfileSchema)
    .mutation(async ({ input }) => {
      const needs = calculateNeeds(input);
      const mealIds = input.mealsPerDay >= 5 ? ["b","s1","l","s2","d"]
        : input.mealsPerDay === 4 ? ["b","l","s2","d"] : ["b","l","d"];

      const prompt = [
        "Tu es un coach nutritionniste expert. Reponds en JSON UNIQUEMENT, sans markdown.",
        "",
        "PROFIL COMPLET:",
        "Nom: " + input.name + " | Age: " + input.age + "ans | Sexe: " + input.sex,
        "Poids: " + input.weight + "kg | Taille: " + input.height + "cm",
        "IMC: " + (input.weight / Math.pow(input.height/100, 2)).toFixed(1),
        "Objectif: " + input.goal + " | Delai: " + (input.timeline || 3) + " mois",
        "Poids cible: " + (input.targetWeight || "non defini") + "kg",
        "Activite quotidienne: " + input.activity,
        "Sports: " + input.sports.join(", "),
        "Regime: " + (input.diet || "aucun"),
        "Aliments a eviter: " + (input.avoid || "aucun"),
        "Aliments preferes: " + (input.foodPrefs || "pas de preference"),
        "Repas par jour: " + input.mealsPerDay,
        "",
        "BESOINS CALCULES (Mifflin-St Jeor):",
        "BMR: " + needs.bmr + " kcal | TDEE: " + needs.tdee + " kcal",
        "CIBLE: " + needs.targetKcal + " kcal/j | P" + needs.targetPro + "g | G" + needs.targetGlu + "g | L" + needs.targetLip + "g",
        "",
        "MISSION: Cree un plan alimentaire 7 jours (Lundi a Dimanche) parfaitement adapte a CE profil specifique.",
        "- Choisis des aliments realistes, savoureux, accessibles en supermarche",
        "- Adapte les portions exactement au poids et objectif de cette personne",
        "- Respecte strictement le regime et les allergies/evictions",
        "- Favorise les aliments preferes si mentionnes",
        "- Varie les repas chaque jour pour eviter la monotonie",
        "- Pour chaque repas: MAX 4 aliments, quantites precises en grammes",
        "- ids repas a utiliser: " + mealIds.join(","),
        "",
        "FORMAT JSON STRICT (rien d autre):",
        '{"targets":{"kcal":' + needs.targetKcal + ',"pro":' + needs.targetPro + ',"glu":' + needs.targetGlu + ',"lip":' + needs.targetLip + '},"rationale":"explication du calcul en 1 phrase","week":[{"dayName":"Lundi","meals":[{"id":"b","icon":"emoji","name":"nom du repas","time":"horaire","kcal":0,"pro":0,"glu":0,"lip":0,"hypo":false,"note":null,"foods":[{"n":"aliment","g":0,"kcal":0,"p":0,"gl":0,"l":0}]}]}]}',
      ].join("\n");

      const raw = await callClaude(prompt, 8000);
      const plan = parseJSON<{
        targets: { kcal: number; pro: number; glu: number; lip: number };
        rationale: string;
        week: unknown[];
      }>(raw);

      if (!plan.targets || !plan.week) throw new Error("Structure nutrition invalide");
      return plan;
    }),

  generateSportPlan: publicProcedure
    .input(ProfileSchema)
    .mutation(async ({ input }) => {
      const isMuscu = input.sports.includes("gym") || input.sports.includes("musculation");
      const isRunning = input.sports.includes("running");
      const isMMA = input.sports.includes("mma");
      const isTeamSport = input.sports.includes("football") || input.sports.includes("basketball");

      const prompt = [
        "Tu es un coach sportif expert certifie. Reponds en JSON UNIQUEMENT, sans markdown.",
        "",
        "PROFIL COMPLET:",
        "Nom: " + input.name + " | Age: " + input.age + "ans | Sexe: " + input.sex,
        "Poids: " + input.weight + "kg | Taille: " + input.height + "cm",
        "Niveau: " + input.level,
        "Objectif: " + input.goal,
        "Sports pratiques: " + input.sports.join(", "),
        "Seances disponibles par semaine: " + input.sessionsPerWeek,
        "Activite quotidienne: " + input.activity,
        "Poids cible: " + (input.targetWeight || "non defini") + "kg en " + (input.timeline || 3) + " mois",
        "",
        "MISSION: Cree un programme d entrainement 1 semaine parfaitement adapte a CE profil.",
        "",
        isMuscu ? [
          "REGLES MUSCULATION:",
          "- Niveau debutant: exercices de base, charges legeres (apprentissage technique), 3x8-10 reps",
          "- Niveau intermediaire: surcharge progressive, 3-4x8-12 reps, charges moderees",
          "- Niveau avance: periodisation, 4-5x6-12 reps, charges lourdes",
          "- Progression: +2.5kg sur barre quand toutes les series sont completees",
          "- Alterner groupes musculaires (Push/Pull/Legs ou Full Body selon frequence)",
          "- Temps de repos: 60-90s exercices isolation, 2-3min exercices compound",
        ].join("\n") : "",
        isRunning ? [
          "REGLES RUNNING:",
          "- Debutant: fractionner marche/course, max 30min",
          "- Intermediaire: sorties 30-60min, inclure 1 seance fractionnee",
          "- Avance: sorties longues, tempo runs, intervalles",
          "- Progression: +10% volume max par semaine",
        ].join("\n") : "",
        isMMA ? [
          "REGLES MMA/COMBAT:",
          "- Alterner technique (shadow boxing, sac) et conditionnement physique",
          "- Inclure travail cardio specifique (circuits, HIIT)",
          "- Exercices de gainage et mobilite",
        ].join("\n") : "",
        isTeamSport ? [
          "REGLES SPORT COLLECTIF:",
          "- Combiner prepartion physique et travail technique",
          "- Inclure travail explosivite et agilite",
          "- Seances de cardio specifique au sport",
        ].join("\n") : "",
        "",
        "Genere exactement " + input.sessionsPerWeek + " seances + jours de repos sur 7 jours.",
        "MAX 5 exercices par seance. Notes courtes et pratiques.",
        "",
        'FORMAT JSON STRICT: {"program_name":"nom programme","goal_statement":"objectif en 1 phrase adaptee a ce profil","weeks":[{"week_number":1,"theme":"theme semaine 1","days":[{"day":"Lundi","type":"strength|cardio|technique|rest","name":"nom seance","duration_min":0,"exercises":[{"id":"id_unique","name":"nom exercice","sets":3,"reps":"10","weight_kg":0,"rest_sec":90,"progression":"regle progression","notes":"conseil technique"}]}]}]}',
      ].filter(Boolean).join("\n");

      const raw = await callClaude(prompt, 4000);
      const plan = parseJSON<{ weeks: unknown[] }>(raw);
      if (!plan.weeks) throw new Error("Structure sport invalide");
      return plan;
    }),

  chatNutrition: publicProcedure
    .input(z.object({
      profile: ProfileSchema,
      targets: z.object({ kcal: z.number(), pro: z.number(), glu: z.number(), lip: z.number() }),
      consumed: z.object({ kcal: z.number(), pro: z.number(), glu: z.number(), lip: z.number() }),
      remainingMeals: z.string(),
      history: z.array(ChatMessageSchema),
      message: z.string(),
    }))
    .mutation(async ({ input }) => {
      const system = [
        "Tu es un coach nutritionniste personnel expert. Reponds en francais, de facon concise et bienveillante.",
        "",
        "PROFIL: " + input.profile.name + ", " + input.profile.weight + "kg, " + input.profile.age + "ans, objectif: " + input.profile.goal,
        "REGIME: " + (input.profile.diet || "aucun") + " | eviter: " + (input.profile.avoid || "rien"),
        "CIBLES JOUR: " + input.targets.kcal + "kcal | P" + input.targets.pro + "g G" + input.targets.glu + "g L" + input.targets.lip + "g",
        "DEJA CONSOMME: " + Math.round(input.consumed.kcal) + "kcal | P" + Math.round(input.consumed.pro) + "g G" + Math.round(input.consumed.glu) + "g L" + Math.round(input.consumed.lip) + "g",
        "RESTANT: " + Math.round(input.targets.kcal - input.consumed.kcal) + "kcal | P" + Math.round(input.targets.pro - input.consumed.pro) + "g",
        "REPAS RESTANTS: " + input.remainingMeals,
        "",
        "REFERENCES CALORIES REELLES: pizza individuelle=700-800kcal, burger+frites=900-1100kcal, pates resto grande portion=800-1000kcal, kebab=700-900kcal, sushi 10 pieces=400-550kcal.",
        "REGLES: Ne jamais sous-estimer les quantites. Adapter les repas restants en fonction de ce qui a ete mange. Rester positif et pratique, jamais moralisateur.",
        "Si la journee depasse les cibles, expliquer comment compenser sur les prochains repas ou la journee suivante.",
      ].join("\n");

      const response = await client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 800,
        system,
        messages: [
          ...input.history,
          { role: "user", content: input.message },
        ],
      });

      const block = response.content[0];
      if (block.type !== "text") throw new Error("Reponse inattendue");
      return { reply: block.text };
    }),

  chatSport: publicProcedure
    .input(z.object({
      profile: ProfileSchema,
      currentSession: z.string().optional(),
      sessionLog: z.string().optional(),
      history: z.array(ChatMessageSchema),
      message: z.string(),
    }))
    .mutation(async ({ input }) => {
      const system = [
        "Tu es un coach sportif personnel expert certifie. Reponds en francais, de facon concise et motivante.",
        "",
        "PROFIL: " + input.profile.name + ", " + input.profile.age + "ans, " + input.profile.weight + "kg, " + input.profile.height + "cm",
        "NIVEAU: " + input.profile.level + " | OBJECTIF: " + input.profile.goal,
        "SPORTS: " + input.profile.sports.join(", "),
        "SESSION DU JOUR: " + (input.currentSession || "aucune session programmee"),
        "LOG SEANCE: " + (input.sessionLog || "aucun log"),
        "",
        "PRINCIPES FONDAMENTAUX:",
        "- Surcharge progressive: +2.5kg quand toutes les series sont completees avec bonne technique",
        "- Jamais plus de +10% de volume par semaine pour eviter les blessures",
        "- La recuperation est aussi importante que l entrainement",
        "- Adapter les conseils au niveau reel de la personne",
        "- Si l utilisateur signale une douleur, orienter vers un professionnel de sante",
        "- Baser les recommandations sur le log reel de la seance si disponible",
      ].join("\n");

      const response = await client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 600,
        system,
        messages: [
          ...input.history,
          { role: "user", content: input.message },
        ],
      });

      const block = response.content[0];
      if (block.type !== "text") throw new Error("Reponse inattendue");
      return { reply: block.text };
    }),
});
