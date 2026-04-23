import type { MealieRecipeOutput } from "@/shared/types/mealie/Recipes.ts"

interface RecipeCacheEntry {
  recipe: MealieRecipeOutput
  fetchedAt: number
}

const CACHE_TTL = 15 * 60 * 1000

const recipeCache = new Map<string, RecipeCacheEntry>()
const slugToRecipeId = new Map<string, string>()

function isEntryValid(entry: RecipeCacheEntry | undefined): entry is RecipeCacheEntry {
  return entry !== undefined && Date.now() - entry.fetchedAt < CACHE_TTL
}

function deleteRecipeEntry(recipeId: string) {
  const entry = recipeCache.get(recipeId)
  if (entry?.recipe.slug) {
    slugToRecipeId.delete(entry.recipe.slug)
  }
  recipeCache.delete(recipeId)
}

export function setRecipeSummaryCache(recipes: MealieRecipeOutput[]) {
  const fetchedAt = Date.now()

  for (const recipe of recipes) {
    recipeCache.set(recipe.id, {
      recipe,
      fetchedAt,
    })
    slugToRecipeId.set(recipe.slug, recipe.id)
  }
}

export function getCachedRecipeById(recipeId: string): MealieRecipeOutput | null {
  const entry = recipeCache.get(recipeId)

  if (!isEntryValid(entry)) {
    deleteRecipeEntry(recipeId)
    return null
  }

  return entry.recipe
}

export function getCachedRecipeBySlug(slug: string): MealieRecipeOutput | null {
  const recipeId = slugToRecipeId.get(slug)
  if (!recipeId) return null
  return getCachedRecipeById(recipeId)
}

export function getCachedRecipesByIds(recipeIds: string[]): MealieRecipeOutput[] {
  return recipeIds.flatMap((recipeId) => {
    const recipe = getCachedRecipeById(recipeId)
    return recipe ? [recipe] : []
  })
}

export function getMissingRecipeIds(recipeIds: string[]): string[] {
  return recipeIds.filter((recipeId) => !getCachedRecipeById(recipeId))
}

export function invalidateRecipeSummaryCache() {
  recipeCache.clear()
  slugToRecipeId.clear()
}
