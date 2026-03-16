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

      // Prompt compact pour haiku — génère 3 jours seulement (lundi/mercredi/vendredi) pour rester rapide
      const prompt = `Expert nutrition sport. JSON UNIQUEMENT sans markdown.
PROFIL: ${input.name}, ${input.age}ans, ${input.sex}, ${input.weight}kg, ${input.height}cm
OBJECTIF: ${input.goal} | activite: ${input.activity} | sports: ${input.sports.join("+")}
REGIME: ${input.diet || "omnivore"} | eviter: ${input.avoid || "/"} | preferes: ${input.foodPrefs || "/"}
REPAS/JOUR: ${input.mealsPerDay} ids=${mealIds.join(",")}

Calcul kcal: Mifflin-St Jeor + facteur(sedentaire=1.2,leger=1.375,modere=1.55,actif=1.725) + delta(lean_bulk=+250,cut=-400,recomp=0,perf=+200,sinon=0).
Proteines: muscu=1.8g/kg, endurance=1.4g/kg, sinon=1.6g/kg.
Genere 3 jours (Lundi, Mercredi, Vendredi). MAX 3 aliments par repas.

FORMAT: {"targets":{"kcal":0,"pro":0,"glu":0,"lip":0},"rationale":"1 phrase","week":[{"dayName":"Lundi","meals":[{"id":"b","icon":"🥣","name":"Petit-dej","time":"7h","kcal":0,"pro":0,"glu":0,"lip":0,"hypo":false,"note":null,"foods":[{"n":"Flocons avoine","g":80,"kcal":300,"p":10,"gl":54,"l":5}]}]}]}`;

      const raw = await callClaude(prompt, 3000);
      const plan = parseJSON<{
        targets: { kcal: number; pro: number; glu: number; lip: number };
        rationale: string;
        week: unknown[];
      }>(raw);

      if (!plan.targets || !plan.week) {
        throw new Error("Structure nutrition invalide");
      }
      return plan;
    }),

  generateSportPlan: publicProcedure
    .input(ProfileSchema)
    .mutation(async ({ input }) => {
      const prompt = `Coach sportif expert. JSON UNIQUEMENT sans markdown.
PROFIL: ${input.name}, ${input.age}ans, ${input.sex}, ${input.weight}kg
NIVEAU: ${input.level} | OBJECTIF: ${input.goal} | SPORTS: ${input.sports.join("+")}
SEANCES/SEMAINE: ${input.sessionsPerWeek}

Genere 1 semaine avec ${input.sessionsPerWeek} seances + repos. MAX 4 exercices/seance.
Charges realistes selon niveau. Progression: +2.5kg si toutes reps OK.

FORMAT: {"program_name":"Mon Programme","goal_statement":"1 phrase","weeks":[{"week_number":1,"theme":"Semaine 1","days":[{"day":"Lundi","type":"strength","name":"Push Day","duration_min":60,"exercises":[{"id":"dc","name":"Developpe couche","sets":3,"reps":"10","weight_kg":60,"rest_sec":90,"progression":"+2.5kg si OK","notes":"Dos plat"}]}]}]}`;

      const raw = await callClaude(prompt, 2000);
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
