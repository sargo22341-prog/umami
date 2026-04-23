import type { MealieRecipeOutput } from "@/shared/types/mealie/Recipes.ts"

export function getRecipeServingsBase(recipe: MealieRecipeOutput): number {
  const raw = recipe.recipeServings

  if (typeof raw === "number" && Number.isFinite(raw) && raw > 0) {
    return raw
  }

  return 1
}

export function scaleRecipeIngredientQuantity(
  quantity: number | undefined,
  recipe: MealieRecipeOutput,
  portions: number,
): number | undefined {
  if (quantity == null || Number.isNaN(quantity)) {
    return undefined
  }

  return (quantity / getRecipeServingsBase(recipe)) * Math.max(1, portions)
}
