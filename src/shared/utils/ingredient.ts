import type { MealieRecipeIngredientOutput} from "@/shared/types/mealie/Recipes.ts"

export function renderIngredientText(ingredient: MealieRecipeIngredientOutput) {
  const parts = [
    ingredient.quantity != null ? String(ingredient.quantity) : "",
    ingredient.unit?.name ?? "",
    ingredient.food?.name ?? "",
  ].filter(Boolean)

  if (ingredient.note) {
    parts.push(`- ${ingredient.note}`)
  }

  return parts.join(" ")
}