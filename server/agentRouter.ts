import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import Anthropic from "@anthropic-ai/sdk";

// Modèle rapide et économique disponible sur ce compte
const MODEL = "claude-haiku-4-5-20251001";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  timeout: 120_000, // 2 minutes max
});

async function callClaude(prompt: string, maxTokens = 2000): Promise<string> {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    messages: [{ role: "user", content: prompt }],
  });
  const block = response.content[0];
  if (block.type !== "text") throw new Error("Réponse inattendue de l'API");
  return block.text.trim();
}

function parseJSON<T>(raw: string): T {
  const cleaned = raw
    .replace(/^```json\s*/m, "")
    .replace(/^```\s*/m, "")
    .replace(/\s*```$/m, "")
    .trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    let fixed = cleaned;
    let ob = 0, cb = 0, oa = 0, ca = 0;
    for (const c of fixed) {
      if (c === "{") ob++;
      else if (c === "}") cb++;
      else if (c === "[") oa++;
      else if (c === "]") ca++;
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

export const agentRouter = router({

  generateNutritionPlan: publicProcedure
    .input(ProfileSchema)
    .mutation(async ({ input }) => {
      const mealIds =
        input.mealsPerDay >= 5 ? ["b", "s1", "l", "s2", "d"] :
        input.mealsPerDay === 4 ? ["b", "l", "s2", "d"] :
        ["b", "l", "d"];

      // Prompt ultra-compact : génère UNIQUEMENT les targets + 1 jour modèle
      // Le client duplique ce jour pour les 7 jours de la semaine
      const prompt = `Expert nutrition sport. JSON UNIQUEMENT sans markdown.
PROFIL: ${input.name}, ${input.age}ans, ${input.sex}, ${input.weight}kg, ${input.height}cm
OBJECTIF: ${input.goal} | activite: ${input.activity} | sports: ${input.sports.join("+")}
REGIME: ${input.diet || "omnivore"} | eviter: ${input.avoid || "/"} | preferes: ${input.foodPrefs || "/"}
REPAS/JOUR: ${input.mealsPerDay} ids=${mealIds.join(",")}

Calcul kcal: Mifflin-St Jeor + facteur(sedentaire=1.2,leger=1.375,modere=1.55,actif=1.725) + delta(lean_bulk=+250,cut=-400,recomp=0,perf=+200,sinon=0).
Proteines: muscu=1.8g/kg, endurance=1.4g/kg, sinon=1.6g/kg.
Genere EXACTEMENT 1 jour avec ${input.mealsPerDay} repas. MAX 2 aliments par repas. Valeurs numeriques entiers.

FORMAT STRICT (respecte exactement cette structure):
{"targets":{"kcal":2800,"pro":160,"glu":320,"lip":80},"rationale":"1 phrase courte","week":[{"dayName":"Lundi","meals":[{"id":"b","icon":"🥣","name":"Petit-dejeuner","time":"7h30","kcal":600,"pro":35,"glu":70,"lip":18,"hypo":false,"note":null,"foods":[{"n":"Flocons avoine","g":80,"kcal":300,"p":10,"gl":54,"l":5},{"n":"Oeufs entiers","g":120,"kcal":180,"p":15,"gl":1,"l":12}]}]}]}`;

      const raw = await callClaude(prompt, 2000);
      const plan = parseJSON<{
        targets: { kcal: number; pro: number; glu: number; lip: number };
        rationale: string;
        week: unknown[];
      }>(raw);

      if (!plan.targets || !plan.week) {
        throw new Error("Structure nutrition invalide");
      }

      // Dupliquer le jour modèle pour les 7 jours de la semaine
      const dayNames = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
      const templateDay = plan.week[0] as any;
      if (templateDay && plan.week.length === 1) {
        plan.week = dayNames.map((dayName) => ({
          ...templateDay,
          dayName,
          meals: templateDay.meals?.map((m: any) => ({ ...m })) ?? [],
        }));
      }

      return plan;
    }),

  generateSportPlan: publicProcedure
    .input(ProfileSchema)
    .mutation(async ({ input }) => {
      // Prompt ultra-compact : génère 1 seule semaine modèle (MAX 2 exercices/séance)
      // Le serveur duplique cette semaine 12 fois avec progression des charges
      const sportsLabel = input.sports.slice(0, 2).join("+");

      const prompt = `Coach sportif expert. JSON UNIQUEMENT sans markdown.
PROFIL: ${input.name}, ${input.age}ans, ${input.sex}, ${input.weight}kg
NIVEAU: ${input.level} | OBJECTIF: ${input.goal} | SPORTS: ${sportsLabel}
SEANCES/SEMAINE: ${input.sessionsPerWeek}

Genere EXACTEMENT 1 semaine modele avec ${input.sessionsPerWeek} jours actifs. MAX 2 exercices par seance. Charges realistes.

FORMAT STRICT:
{"program_name":"Mon Programme","goal_statement":"1 phrase","week_template":{"days":[{"day":"Lundi","type":"strength","name":"Push Day","duration_min":60,"exercises":[{"id":"dc","name":"Developpe couche","sets":3,"reps":"10","weight_kg":60,"rest_sec":90,"progression":"+2.5kg si OK","notes":"Dos plat"},{"id":"sq","name":"Squat","sets":4,"reps":"8","weight_kg":80,"rest_sec":120,"progression":"+2.5kg si OK","notes":"Profondeur parallele"}]},{"day":"Mardi","type":"rest","name":"Repos","duration_min":0,"exercises":[]}]}}`;

      const raw = await callClaude(prompt, 1800);
      const plan = parseJSON<{
        program_name: string;
        goal_statement: string;
        week_template: { days: unknown[] };
      }>(raw);

      if (!plan.week_template?.days) throw new Error("Structure sport invalide");

      // Dupliquer la semaine modèle pour 12 semaines avec progression des charges (+2.5kg/semaine)
      const weeks = Array.from({ length: 12 }, (_, i) => ({
        week_number: i + 1,
        theme: i < 4 ? "Phase 1 — Fondation" : i < 8 ? "Phase 2 — Progression" : "Phase 3 — Intensification",
        days: (plan.week_template.days as any[]).map((day: any) => ({
          ...day,
          exercises: (day.exercises ?? []).map((ex: any) => ({
            ...ex,
            weight_kg: ex.weight_kg ? Math.round((ex.weight_kg + i * 2.5) * 2) / 2 : ex.weight_kg,
          })),
        })),
      }));

      return {
        program_name: plan.program_name,
        goal_statement: plan.goal_statement,
        weeks,
      };
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
        "Tu es un nutritionniste expert. Reponds en francais, concis et pratique.",
        `PROFIL: ${input.profile.name}, ${input.profile.weight}kg, objectif: ${input.profile.goal}`,
        `CIBLES: ${input.targets.kcal}kcal/j | P${input.targets.pro}g G${input.targets.glu}g L${input.targets.lip}g`,
        `CONSOMME: ${Math.round(input.consumed.kcal)}kcal | P${Math.round(input.consumed.pro)}g`,
        `REPAS RESTANTS: ${input.remainingMeals}`,
      ].join("\n");

      const response = await client.messages.create({
        model: MODEL,
        max_tokens: 600,
        system,
        messages: [
          ...input.history,
          { role: "user", content: input.message },
        ],
      });

      const block = response.content[0];
      if (block.type !== "text") throw new Error("Réponse inattendue");
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
        "Tu es un coach sportif expert. Reponds en francais, concis et pratique.",
        `PROFIL: ${input.profile.name}, ${input.profile.age}ans, ${input.profile.weight}kg, niveau ${input.profile.level}`,
        `OBJECTIF: ${input.profile.goal} | sports: ${input.profile.sports.join(", ")}`,
        `SESSION DU JOUR: ${input.currentSession || "aucune"}`,
        `LOG SEANCE: ${input.sessionLog || "aucun log"}`,
      ].join("\n");

      const response = await client.messages.create({
        model: MODEL,
        max_tokens: 600,
        system,
        messages: [
          ...input.history,
          { role: "user", content: input.message },
        ],
      });

      const block = response.content[0];
      if (block.type !== "text") throw new Error("Réponse inattendue");
      return { reply: block.text };
    }),
});
