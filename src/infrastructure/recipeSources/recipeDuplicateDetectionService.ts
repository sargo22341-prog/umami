import { getRecipesUseCase } from "../container.ts"
import type { MealieRecipeSummary } from "@/shared/types/mealie/Recipes.ts"
import type { RecipeSourceRecipe } from "./providers/types.ts"

const SEARCH_PAGE_SIZE = 1000
const duplicateCheckCache = new Map<string, Promise<RecipeDuplicateCheckResult>>()

export interface RecipeDuplicateMatch {
  confidence: "exact" | "probable"
  reason: "source_url" | "title_only"
  message: string
  existingRecipe: Pick<MealieRecipeSummary, "id" | "slug" | "name" | "orgURL" | "dateUpdated">
}

export interface RecipeDuplicateCheckResult {
  sourceUrl: string
  sourceName: string
  scrapedName: string
  match: RecipeDuplicateMatch | null
}

function normalizeName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
}

function buildTitleOnlyMessage(existingRecipe: Pick<MealieRecipeSummary, "name">): string {
  return `Une recette Mealie porte deja le meme nom (${existingRecipe.name}).`
}

function buildSourceUrlMessage(existingRecipe: Pick<MealieRecipeSummary, "name">): string {
  return `Cette URL source est deja liee a la recette "${existingRecipe.name}".`
}

function buildTitleOnlyMatch(recipe: MealieRecipeSummary): RecipeDuplicateMatch {
  return {
    confidence: "probable",
    reason: "title_only",
    message: buildTitleOnlyMessage(recipe),
    existingRecipe: {
      id: recipe.id,
      slug: recipe.slug,
      name: recipe.name,
      orgURL: recipe.orgURL,
      dateUpdated: recipe.dateUpdated,
    },
  }
}

function buildSourceUrlMatch(recipe: MealieRecipeSummary): RecipeDuplicateMatch {
  return {
    confidence: "exact",
    reason: "source_url",
    message: buildSourceUrlMessage(recipe),
    existingRecipe: {
      id: recipe.id,
      slug: recipe.slug,
      name: recipe.name,
      orgURL: recipe.orgURL,
      dateUpdated: recipe.dateUpdated,
    },
  }
}

async function loadRecipeBatchForDuplicateCheck() {
  return getRecipesUseCase.execute(1, SEARCH_PAGE_SIZE, {
    search: "",
    orderBy: "createdAt",
    orderDirection: "desc",
    paginationSeed: `duplicate-check-${Date.now()}`,
  })
}

export async function findExistingRecipeForSource(
  source: Pick<RecipeSourceRecipe, "sourceUrl" | "name"> | { sourceUrl: string; name?: string; excludeSlug?: string },
): Promise<RecipeDuplicateCheckResult> {
  const sourceUrl = source.sourceUrl.trim()
  const sourceName = "name" in source ? source.name?.trim() ?? "" : ""
  const excludeSlug = "excludeSlug" in source ? source.excludeSlug?.trim() ?? "" : ""
  const normalizedSourceName = normalizeName(sourceName)
  const cacheKey = `${sourceUrl}::${normalizedSourceName}::${excludeSlug}`

  if (!sourceUrl && !normalizedSourceName) {
    return {
      sourceUrl,
      sourceName,
      scrapedName: sourceName,
      match: null,
    }
  }

  const existingPromise = duplicateCheckCache.get(cacheKey)
  if (existingPromise) {
    return existingPromise
  }

  const promise = (async () => {
    const response = await loadRecipeBatchForDuplicateCheck()
    const exactSourceUrlMatch = sourceUrl
      ? response.items.find((recipe) => recipe.slug !== excludeSlug && recipe.orgURL?.trim() === sourceUrl)
      : undefined
    if (exactSourceUrlMatch) {
      return {
        sourceUrl,
        sourceName,
        scrapedName: sourceName,
        match: buildSourceUrlMatch(exactSourceUrlMatch),
      }
    }

    const exactNameMatch = response.items.find((recipe) =>
      recipe.slug !== excludeSlug && normalizeName(recipe.name) === normalizedSourceName)

    return {
      sourceUrl,
      sourceName,
      scrapedName: sourceName,
      match: exactNameMatch ? buildTitleOnlyMatch(exactNameMatch) : null,
    }
  })()

  duplicateCheckCache.set(cacheKey, promise)
  return promise
}

export async function findExistingRecipesForSearchResults(
  recipes: RecipeSourceRecipe[],
): Promise<Record<string, RecipeDuplicateMatch | null>> {
  if (recipes.length === 0) {
    return {}
  }

  const keysByNormalizedName = new Map<string, string[]>()

  for (const recipe of recipes) {
    const key = recipe.sourceUrl || recipe.name
    const normalizedName = normalizeName(recipe.name)

    if (!normalizedName) {
      continue
    }

    const existingKeys = keysByNormalizedName.get(normalizedName) ?? []
    existingKeys.push(key)
    keysByNormalizedName.set(normalizedName, existingKeys)
  }

  const response = await loadRecipeBatchForDuplicateCheck()
  const matchesByKey = new Map<string, RecipeDuplicateMatch | null>()

  for (const recipe of response.items) {
    const normalizedName = normalizeName(recipe.name)
    const matchingKeys = keysByNormalizedName.get(normalizedName)

    if (!matchingKeys?.length) {
      continue
    }

    const match = buildTitleOnlyMatch(recipe)
    for (const key of matchingKeys) {
      if (!matchesByKey.has(key)) {
        matchesByKey.set(key, match)
      }
    }
  }

  return Object.fromEntries(
    recipes.map((recipe) => {
      const key = recipe.sourceUrl || recipe.name
      return [key, matchesByKey.get(key) ?? null] as const
    }),
  )
}
