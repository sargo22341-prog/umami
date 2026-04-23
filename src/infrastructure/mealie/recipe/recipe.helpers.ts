// recipe.helpers.ts

import type {
  MealieNutrition,
  MealieRecipeOutput,
  RecipeFormData,
} from "@/shared/types/mealie/Recipes.ts"
import type { Season } from "@/shared/types/Season.ts"
import type { MealieRecipeTag } from "@/shared/types/mealie/Tags.ts"
import { isCalorieTag } from "@/shared/utils/calorie.ts"
import { generateId } from "@/shared/utils/id.ts"
import { mealieApiClient } from "../api/index.ts"

interface MealieTagObject {
  id?: string
  name: string
  slug: string
}

export const ORDER_BY_MAP: Record<string, string> = {
  createdAt: "created_at",
  updatedAt: "updated_at",
  totalTime: "total_time",
  prepTime: "prep_time",
  performTime: "perform_time",
}

export function sanitizeNutrition(nutrition: MealieNutrition): MealieNutrition | null {
  const entries = Object.entries(nutrition).filter(([, value]) => {
    if (value == null) return false
    return String(value).trim() !== ""
  })

  if (entries.length === 0) return null
  return Object.fromEntries(entries) as MealieNutrition
}

export function minutesToString(minutes: number | string): string | undefined {
  const value = typeof minutes === "string" ? parseInt(minutes, 10) : minutes

  if (Number.isNaN(value) || value <= 0) return undefined
  return value === 1 ? "1 minute" : `${value} minutes`
}

export async function resolveSeasonTags(seasons: Season[]): Promise<MealieTagObject[]> {
  const response = await mealieApiClient.get<{ items: MealieRecipeTag[] }>("/api/organizers/tags")
  const existing = response.items

  return seasons.map((season) => {
    const tagName = `saison-${season}`
    const found = existing.find((tag) => tag.slug === tagName)

    return found
      ? { id: found.id ?? undefined, name: found.name, slug: found.slug }
      : { name: tagName, slug: tagName }
  })
}

export async function buildRecipeUpdatePayload(
  current: MealieRecipeOutput,
  data: RecipeFormData,
) {
  const seasonTags = await resolveSeasonTags(data.seasons)

  const calorieTags = (current.tags ?? [])
    .filter(isCalorieTag)
    .map((tag) => ({
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
    }))

  const mappedIngredients = data.recipeIngredient
    .filter((ing) => ing.food || ing.note || ing.unit || (ing.quantity && ing.quantity !== "1"))
    .map((ing) => {
      const original = ing.referenceId
        ? current.recipeIngredient?.find((item) => item.referenceId === ing.referenceId)
        : undefined

      const quantity = ing.quantity ? parseFloat(ing.quantity) : 0
      const hasFood = Boolean(ing.foodId)
      const hasUnit = Boolean(ing.unitId)

      return {
        ...(original ?? {}),
        referenceId: ing.referenceId ?? original?.referenceId ?? generateId(),
        quantity,
        unit: hasUnit ? { id: ing.unitId, name: ing.unit } : undefined,
        food: hasFood ? { id: ing.foodId, name: ing.food } : (original?.food ?? null),
        note: ing.note || (!hasFood && !hasUnit ? ing.food : "") || "",
      }
    })

  return {
    ...current,
    name: data.name,
    description: data.description.trim() || null,
    orgURL: data.orgURL === undefined ? (current.orgURL ?? null) : (data.orgURL.trim() || null),
    prepTime: minutesToString(data.prepTime) ?? null,
    performTime: minutesToString(data.performTime) ?? null,
    totalTime: minutesToString(data.totalTime) ?? null,
    recipeServings: data.recipeServings.trim() ? Number(data.recipeServings) : 0,
    nutrition: sanitizeNutrition(data.nutrition),
    recipeCategory: data.categories.map((category) => {
      const original = current.recipeCategory?.find((item) => item.id === category.id)
      return original ? { ...original, ...category } : category
    }),
    tools: data.tools.map((tool) => {
      const original = current.tools?.find((item) => item.id === tool.id)
      return original ? { ...original, ...tool } : tool
    }),
    recipeIngredient: mappedIngredients,
    recipeInstructions: data.recipeInstructions
      .filter((step) => step.text.trim())
      .map((step) => ({
        id: step.id ?? generateId(),
        text: step.text,
        ingredientReferences: (step.ingredientReferences ?? [])
          .filter((reference): reference is { referenceId: string } => Boolean(reference.referenceId))
          .map((reference) => ({
            referenceId: reference.referenceId,
          })),
      })),
    tags: [...data.tags, ...calorieTags, ...seasonTags],
  }
}
