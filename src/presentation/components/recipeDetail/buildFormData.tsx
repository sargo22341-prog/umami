// type
import type { MealieRecipeOutput, RecipeFormData } from "@/shared/types/mealie/Recipes.ts"

// utils
import { isCalorieTag, formatDurationToNumber, getRecipeSeasonsFromTags, isSeasonTag } from "@/shared/utils"


export function buildFormData(recipe: MealieRecipeOutput): RecipeFormData {
  const structured =
    recipe.recipeIngredient
      ?.filter(
        (ing) =>
          ing.food?.name || ing.unit?.name || (ing.quantity != null && ing.quantity !== 0) || ing.note,
      )
      .map((ing) => ({
        quantity: ing.quantity != null && ing.quantity !== 0 ? String(ing.quantity) : "",
        unit: ing.unit?.name ?? "",
        unitId: ing.unit?.id ?? undefined,
        food: ing.food?.name ?? "",
        foodId: ing.food?.id ?? undefined,
        note: ing.note ?? "",
        referenceId: ing.referenceId ?? undefined,
      })) ?? []

  return {
    name: recipe.name,
    description: recipe.description ?? "",
    orgURL: recipe.orgURL ?? "",
    prepTime: recipe.prepTime ? String(formatDurationToNumber(recipe.prepTime)) : "",
    performTime: recipe.performTime ? String(formatDurationToNumber(recipe.performTime)) : "",
    totalTime: recipe.totalTime ? String(formatDurationToNumber(recipe.totalTime)) : "",
    recipeServings: recipe.recipeServings != null ? String(recipe.recipeServings) : "",
    nutrition: recipe.nutrition ?? {},
    recipeIngredient: structured,
    recipeInstructions: recipe.recipeInstructions?.length
      ? recipe.recipeInstructions.map((s) => ({
        text: s.text,
        id: s.id ?? undefined,
        ingredientReferences: s.ingredientReferences?.map((reference) => ({
          referenceId: reference.referenceId,
        })) ?? [],
      }))
      : [{ text: "" }],
    seasons: getRecipeSeasonsFromTags(recipe.tags),
    categories: (recipe.recipeCategory ?? []).map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      groupId: c.groupId,
    })),
    tags: (recipe.tags ?? [])
      .filter((t) => !isSeasonTag(t) && !isCalorieTag(t))
      .map((t) => ({ id: t.id, name: t.name, slug: t.slug })),
    tools: (recipe.tools ?? []).map((tool) => ({
      id: tool.id,
      name: tool.name,
      slug: tool.slug,
    })),
  }
}
