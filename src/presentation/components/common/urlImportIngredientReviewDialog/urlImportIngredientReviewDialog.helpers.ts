import type { UrlImportReviewDraft } from "@/infrastructure/recipeSources/urlImportReviewService.ts"
import type { RecipeFormIngredient } from "@/shared/types/mealie/Recipes.ts"
import type { MealieIngredientFoodOutput } from "@/shared/types/mealie/food.ts"
import {
  findBestFoodMatch, findBestUnitMatch, isIngredientFullyMatched, normalizeFoodAliasValue, normalizeMatcherText,
} from "@/shared/utils"

export interface AliasActionFeedback {
  state: "idle" | "loading" | "success" | "error"
  message?: string
}

export interface SingularPluralSuggestion {
  candidate: string
  mode: "pluralName" | "alias"
}

export interface ReviewRow {
  item: UrlImportReviewDraft["analyzedIngredients"][number]
  index: number
  ingredient: RecipeFormIngredient
  foodMatch: ReturnType<typeof findBestFoodMatch>
  unitMatch: ReturnType<typeof findBestUnitMatch>
  isUnitOptional: boolean
  isFullMatch: boolean
  completenessScore: number
}

export function buildEmptyIngredient(): RecipeFormIngredient {
  return {
    quantity: "",
    unit: "",
    unitId: undefined,
    food: "",
    foodId: undefined,
    note: "",
  }
}

export function hasMeaningfulIngredient(ingredient: RecipeFormIngredient) {
  return Boolean(
    ingredient.quantity.trim()
    || ingredient.unit.trim()
    || ingredient.food.trim()
    || ingredient.note.trim(),
  )
}

export function buildIngredientsFromDraft(draft: UrlImportReviewDraft): RecipeFormIngredient[] {
  return draft.analyzedIngredients.map((item) => ({ ...item.parsed }))
}

export function buildInitialOpenState(draft: UrlImportReviewDraft) {
  return Object.fromEntries(
    draft.analyzedIngredients.map((item) => [
      item.id,
      !isIngredientFullyMatched({
        ingredient: item.parsed,
        availableFoods: draft.availableFoods,
        availableUnits: draft.availableUnits,
      }),
    ]),
  ) as Record<string, boolean>
}

export function buildFoodOptions(foods: MealieIngredientFoodOutput[]) {
  return foods.map((food) => ({ id: food.id, label: food.name }))
}

export function getSingularPluralSuggestion(
  item: UrlImportReviewDraft["analyzedIngredients"][number],
  availableFoods: MealieIngredientFoodOutput[],
): SingularPluralSuggestion | null {
  if (item.foodMatch?.strategy !== "singular") return null

  const targetFood = availableFoods.find((food) => food.id === item.foodMatch?.item.id)
  if (!targetFood) return null

  const candidate = normalizeFoodAliasValue(item.sourceFood)
  const normalizedCandidate = normalizeMatcherText(candidate)
  if (!normalizedCandidate) return null
  if (normalizedCandidate === normalizeMatcherText(targetFood.name)) return null

  const normalizedPluralName = normalizeMatcherText(targetFood.pluralName ?? "")
  if (!normalizedPluralName) {
    return {
      candidate,
      mode: "pluralName",
    }
  }

  if (normalizedPluralName === normalizedCandidate) return null

  const aliasExists = (targetFood.aliases ?? []).some((alias) =>
    normalizeMatcherText(alias.name) === normalizedCandidate)

  if (aliasExists) return null

  return {
    candidate,
    mode: "alias",
  }
}

export function buildReviewRows(
  draft: UrlImportReviewDraft,
  ingredients: RecipeFormIngredient[],
  availableFoods: MealieIngredientFoodOutput[],
): ReviewRow[] {
  return draft.analyzedIngredients.map((item, index) => {
    const ingredient = ingredients[index] ?? buildEmptyIngredient()
    const foodMatch = ingredient.food.trim()
      ? findBestFoodMatch(ingredient.food, availableFoods, ingredient.foodId)
      : null
    const unitMatch = ingredient.unit.trim()
      ? findBestUnitMatch(ingredient.unit, draft.availableUnits, ingredient.unitId)
      : null
    const isUnitOptional = !ingredient.unit.trim()
    const completenessScore = Number(Boolean(foodMatch)) + Number(isUnitOptional || Boolean(unitMatch))

    return {
      item,
      index,
      ingredient,
      foodMatch,
      unitMatch,
      isUnitOptional,
      isFullMatch: Boolean(foodMatch) && (isUnitOptional || Boolean(unitMatch)),
      completenessScore,
    }
  })
}
