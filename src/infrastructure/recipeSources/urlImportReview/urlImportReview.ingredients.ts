import type {
  MealieRecipeIngredientOutput,
  MealieRecipeOutput,
  RecipeFormData,
  RecipeFormIngredient,
} from "@/shared/types/mealie/Recipes.ts"
import type { MealieIngredientFoodOutput } from "@/shared/types/mealie/food.ts"
import type { MealieIngredientUnitOutput } from "@/shared/types/mealie/Units.ts"
import {
  buildPreferredUnitLabel,
  findBestFoodMatch,
  findBestUnitMatch,
  normalizeMatcherText,
} from "@/shared/utils/ingredientMatching.ts"
import { parseSourceIngredients } from "../ingredientParsingService.ts"
import type { AnalyzedIngredient } from "./urlImportReview.types.ts"
import { getCachedFoods, getCachedUnits } from "./urlImportReview.cache.ts"

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

function extractRawIngredientText(ingredient: MealieRecipeIngredientOutput): string {
  const rawCandidates = [
    ingredient.note,
    ingredient.originalText,
    ingredient.display,
  ]
    .map((value) => String(value ?? "").trim())
    .filter(Boolean)

  if (rawCandidates.length > 0) return rawCandidates[0]

  return [
    ingredient.quantity != null && ingredient.quantity !== 0 ? String(ingredient.quantity) : "",
    ingredient.unit?.name ?? "",
    ingredient.food?.name ?? "",
  ]
    .filter(Boolean)
    .join(" ")
    .trim()
}

function splitIngredientParentheticalNote(raw: string): {
  matchingRaw: string
  extractedNote: string
} {
  const trimmedRaw = raw.trim()
  const parentheticalMatch = trimmedRaw.match(/\(([^()]*)\)/)

  if (!parentheticalMatch) {
    return {
      matchingRaw: trimmedRaw,
      extractedNote: "",
    }
  }

  const extractedNote = parentheticalMatch[1]?.trim() ?? ""
  const matchingRaw = trimmedRaw.replace(parentheticalMatch[0], " ").replace(/\s+/g, " ").trim()

  return {
    matchingRaw: matchingRaw || trimmedRaw,
    extractedNote,
  }
}

function buildAnalyzedIngredientDraft(
  raw: string,
  parsed: RecipeFormIngredient,
  availableUnits: MealieIngredientUnitOutput[],
  availableFoods: MealieIngredientFoodOutput[],
  referenceId?: string,
): AnalyzedIngredient {
  const sourceFood = parsed.food.trim()
  const nextParsed = {
    ...parsed,
    referenceId,
  }

  const unitMatch = nextParsed.unit
    ? findBestUnitMatch(nextParsed.unit, availableUnits, nextParsed.unitId)
    : null
  const foodMatch = nextParsed.food
    ? findBestFoodMatch(nextParsed.food, availableFoods, nextParsed.foodId)
    : null

  if (unitMatch) {
    nextParsed.unit = buildPreferredUnitLabel(unitMatch.item)
    nextParsed.unitId = unitMatch.item.id
  }

  if (foodMatch) {
    nextParsed.food = foodMatch.item.name
    nextParsed.foodId = foodMatch.item.id
  }

  return {
    id: referenceId ?? `ingredient-${normalizeMatcherText(raw)}`,
    raw,
    sourceFood,
    parsed: nextParsed,
    unitMatch: unitMatch ? { item: unitMatch.item, via: unitMatch.via, strategy: unitMatch.strategy } : undefined,
    foodMatch: foodMatch ? { item: foodMatch.item, via: foodMatch.via, strategy: foodMatch.strategy } : undefined,
  }
}

export function replaceFormIngredients(
  formData: RecipeFormData,
  analyzedIngredients: AnalyzedIngredient[],
): RecipeFormData {
  const nextIngredients = analyzedIngredients.length > 0
    ? analyzedIngredients.map((item) => item.parsed)
    : [buildEmptyIngredient()]

  return {
    ...formData,
    recipeIngredient: nextIngredients,
  }
}

export async function analyzeIngredients(
  recipe: MealieRecipeOutput,
): Promise<{
  analyzedIngredients: AnalyzedIngredient[]
  availableUnits: MealieIngredientUnitOutput[]
  availableFoods: MealieIngredientFoodOutput[]
}> {
  const [availableUnits, availableFoods] = await Promise.all([
    getCachedUnits(),
    getCachedFoods(),
  ])

  return analyzeRecipeIngredientOutputs(recipe.recipeIngredient ?? [], availableUnits, availableFoods)
}

export async function analyzeRecipeIngredientOutputs(
  sourceIngredients: MealieRecipeIngredientOutput[],
  availableUnits?: MealieIngredientUnitOutput[],
  availableFoods?: MealieIngredientFoodOutput[],
): Promise<{
  analyzedIngredients: AnalyzedIngredient[]
  availableUnits: MealieIngredientUnitOutput[]
  availableFoods: MealieIngredientFoodOutput[]
}> {
  const resolvedUnits = availableUnits ?? await getCachedUnits()
  const resolvedFoods = availableFoods ?? await getCachedFoods()

  const ingredientSources = sourceIngredients
    .map((ingredient) => {
      const raw = extractRawIngredientText(ingredient)
      const { matchingRaw, extractedNote } = splitIngredientParentheticalNote(raw)

      return {
        raw,
        matchingRaw,
        extractedNote,
        referenceId: ingredient.referenceId ?? undefined,
      }
    })
    .filter((ingredient) => Boolean(ingredient.matchingRaw))

  const rawIngredients = ingredientSources.map((ingredient) => ingredient.matchingRaw)
  const parsedIngredients = await parseSourceIngredients(rawIngredients, resolvedUnits, resolvedFoods)

  return {
    availableUnits: resolvedUnits,
    availableFoods: resolvedFoods,
    analyzedIngredients: rawIngredients.map((raw, index) =>
      buildAnalyzedIngredientDraft(
        ingredientSources[index]?.raw ?? raw,
        {
          ...(parsedIngredients[index] ?? buildEmptyIngredient()),
          note: ingredientSources[index]?.extractedNote || parsedIngredients[index]?.note || "",
        },
        resolvedUnits,
        resolvedFoods,
        ingredientSources[index]?.referenceId,
      )),
  }
}
