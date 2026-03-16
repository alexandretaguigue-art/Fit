/**
 * useAgent — hooks tRPC pour le router agentRouter (Claude / Anthropic)
 *
 * Utilisation :
 *   const { generateNutritionPlan, generateSportPlan, chatNutrition, chatSport } = useAgent();
 *
 *   // Générer un plan nutrition
 *   generateNutritionPlan.mutate(profile, {
 *     onSuccess: (plan) => console.log(plan.targets, plan.week),
 *     onError: (err) => console.error(err),
 *   });
 *
 *   // Chat nutritionniste
 *   chatNutrition.mutate({ profile, targets, consumed, remainingMeals, history, message }, {
 *     onSuccess: ({ reply }) => console.log(reply),
 *   });
 */

import { trpc } from "@/lib/trpc";

export function useAgent() {
  const generateNutritionPlan = trpc.agent.generateNutritionPlan.useMutation();
  const generateSportPlan = trpc.agent.generateSportPlan.useMutation();
  const chatNutrition = trpc.agent.chatNutrition.useMutation();
  const chatSport = trpc.agent.chatSport.useMutation();

  return {
    generateNutritionPlan,
    generateSportPlan,
    chatNutrition,
    chatSport,
  };
}

/**
 * Types exportés pour faciliter l'usage dans les composants
 */
export type AgentProfile = Parameters<
  ReturnType<typeof trpc.agent.generateNutritionPlan.useMutation>["mutate"]
>[0];

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};
