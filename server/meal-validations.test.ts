/**
 * Tests pour la persistance des validations de repas dans FitnessData.
 * Ces tests vérifient la logique pure des helpers getMealValidations,
 * setMealValidation et clearDayMealValidations en simulant les opérations
 * sur la structure de données FitnessData.
 */
import { describe, expect, it } from "vitest";

// ============================================================
// Helpers purs (extraits de la logique de useFitnessTracker)
// ============================================================

type MealStatus = 'validated' | 'modified' | null;
type MealValidations = Record<string, Record<string, MealStatus>>;

function getMealValidations(
  mealValidations: MealValidations,
  dateKey: string
): Record<string, MealStatus> {
  return mealValidations[dateKey] ?? {};
}

function setMealValidation(
  mealValidations: MealValidations,
  dateKey: string,
  mealKey: string,
  status: MealStatus
): MealValidations {
  const dayValidations = { ...(mealValidations[dateKey] ?? {}) };
  if (status === null) {
    delete dayValidations[mealKey];
  } else {
    dayValidations[mealKey] = status;
  }
  return {
    ...mealValidations,
    [dateKey]: dayValidations,
  };
}

function clearDayMealValidations(
  mealValidations: MealValidations,
  dateKey: string
): MealValidations {
  const updated = { ...mealValidations };
  delete updated[dateKey];
  return updated;
}

// ============================================================
// Tests
// ============================================================

describe("mealValidations — persistance des repas validés", () => {
  it("retourne un objet vide pour un jour sans validation", () => {
    const state: MealValidations = {};
    const result = getMealValidations(state, "2026-03-06");
    expect(result).toEqual({});
  });

  it("enregistre une validation 'validated' pour un repas", () => {
    let state: MealValidations = {};
    state = setMealValidation(state, "2026-03-06", "breakfast", "validated");

    const result = getMealValidations(state, "2026-03-06");
    expect(result["breakfast"]).toBe("validated");
  });

  it("enregistre une validation 'modified' pour un repas", () => {
    let state: MealValidations = {};
    state = setMealValidation(state, "2026-03-06", "dinner", "modified");

    const result = getMealValidations(state, "2026-03-06");
    expect(result["dinner"]).toBe("modified");
  });

  it("met à jour une validation existante", () => {
    let state: MealValidations = {};
    state = setMealValidation(state, "2026-03-06", "lunch", "modified");
    state = setMealValidation(state, "2026-03-06", "lunch", "validated");

    const result = getMealValidations(state, "2026-03-06");
    expect(result["lunch"]).toBe("validated");
  });

  it("supprime une validation quand status est null", () => {
    let state: MealValidations = {};
    state = setMealValidation(state, "2026-03-06", "snack", "validated");
    state = setMealValidation(state, "2026-03-06", "snack", null);

    const result = getMealValidations(state, "2026-03-06");
    expect(result["snack"]).toBeUndefined();
  });

  it("isole les validations par dateKey", () => {
    let state: MealValidations = {};
    state = setMealValidation(state, "2026-03-06", "breakfast", "validated");
    state = setMealValidation(state, "2026-03-07", "breakfast", "modified");

    expect(getMealValidations(state, "2026-03-06")["breakfast"]).toBe("validated");
    expect(getMealValidations(state, "2026-03-07")["breakfast"]).toBe("modified");
  });

  it("conserve les autres repas du même jour lors d'une mise à jour", () => {
    let state: MealValidations = {};
    state = setMealValidation(state, "2026-03-06", "breakfast", "validated");
    state = setMealValidation(state, "2026-03-06", "lunch", "validated");
    state = setMealValidation(state, "2026-03-06", "dinner", "modified");

    const result = getMealValidations(state, "2026-03-06");
    expect(result["breakfast"]).toBe("validated");
    expect(result["lunch"]).toBe("validated");
    expect(result["dinner"]).toBe("modified");
  });

  it("efface toutes les validations d'un jour avec clearDayMealValidations", () => {
    let state: MealValidations = {};
    state = setMealValidation(state, "2026-03-06", "breakfast", "validated");
    state = setMealValidation(state, "2026-03-06", "lunch", "validated");
    state = clearDayMealValidations(state, "2026-03-06");

    const result = getMealValidations(state, "2026-03-06");
    expect(result).toEqual({});
  });

  it("clearDayMealValidations ne touche pas les autres jours", () => {
    let state: MealValidations = {};
    state = setMealValidation(state, "2026-03-06", "breakfast", "validated");
    state = setMealValidation(state, "2026-03-07", "breakfast", "validated");
    state = clearDayMealValidations(state, "2026-03-06");

    expect(getMealValidations(state, "2026-03-07")["breakfast"]).toBe("validated");
    expect(getMealValidations(state, "2026-03-06")).toEqual({});
  });

  it("compte correctement les repas validés ou modifiés", () => {
    let state: MealValidations = {};
    state = setMealValidation(state, "2026-03-06", "breakfast", "validated");
    state = setMealValidation(state, "2026-03-06", "morning_snack", null);
    state = setMealValidation(state, "2026-03-06", "lunch", "modified");
    state = setMealValidation(state, "2026-03-06", "snack", "validated");
    state = setMealValidation(state, "2026-03-06", "dinner", null);

    const dayValidations = getMealValidations(state, "2026-03-06");
    const completedCount = Object.values(dayValidations).filter(v => v !== null).length;
    expect(completedCount).toBe(3); // breakfast + lunch + snack
  });

  it("ne modifie pas l'état original (immutabilité)", () => {
    const original: MealValidations = { "2026-03-06": { breakfast: "validated" } };
    const updated = setMealValidation(original, "2026-03-06", "lunch", "modified");

    // L'original ne doit pas être modifié
    expect(original["2026-03-06"]["lunch"]).toBeUndefined();
    // Le nouvel état doit avoir la modification
    expect(updated["2026-03-06"]["lunch"]).toBe("modified");
  });
});
