import { useCallback, useState } from "react"
import { getRecipesUseCase } from "@/infrastructure/container.ts"
import type { MealieRecipeOutput } from "@/shared/types/mealie/Recipes.ts"
import {
  getCachedRecipesByIds,
  getMissingRecipeIds,
  setRecipeSummaryCache,
} from "presentation/cache/recipeSummaryCache.ts"
import { useGetFavorites } from "./useGetFavorites.ts"

const RECIPES_PER_PAGE = 100

let activeRecipeLookup: Promise<void> | null = null

function sortRecipesByCreatedAt(recipes: MealieRecipeOutput[]): MealieRecipeOutput[] {
  return [...recipes].sort((left, right) => {
    const leftTime = Date.parse(left.createdAt ?? left.dateAdded ?? "") || 0
    const rightTime = Date.parse(right.createdAt ?? right.dateAdded ?? "") || 0
    return rightTime - leftTime
  })
}

async function resolveRecipesByIds(recipeIds: string[]): Promise<MealieRecipeOutput[]> {
  let missingRecipeIds = getMissingRecipeIds(recipeIds)

  if (missingRecipeIds.length > 0 && activeRecipeLookup) {
    await activeRecipeLookup
    missingRecipeIds = getMissingRecipeIds(recipeIds)
  }

  if (missingRecipeIds.length > 0) {
    const lookupPromise = (async () => {
      const pendingIds = new Set(missingRecipeIds)
      let page = 1
      let totalPages = 1

      while (page <= totalPages && pendingIds.size > 0) {
        const response = await getRecipesUseCase.execute(page, RECIPES_PER_PAGE, {
          orderBy: "createdAt",
          orderDirection: "desc",
        })

        setRecipeSummaryCache(response.items)

        for (const recipe of response.items) {
          pendingIds.delete(recipe.id)
        }

        totalPages = response.totalPages
        page += 1
      }
    })()

    activeRecipeLookup = lookupPromise

    try {
      await lookupPromise
    } finally {
      if (activeRecipeLookup === lookupPromise) {
        activeRecipeLookup = null
      }
    }
  }

  return getCachedRecipesByIds(recipeIds)
}

interface FavoriteRecipesOptions {
  limit?: number
  order?: "createdAt" | "favorite"
}

export function useFavoriteRecipes() {
  const { getFavorites } = useGetFavorites()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getFavoriteRecipes = useCallback(async (
    options: FavoriteRecipesOptions = {},
  ): Promise<MealieRecipeOutput[]> => {
    const { limit, order = "favorite" } = options

    setLoading(true)
    setError(null)

    try {
      const favorites = await getFavorites()
      const orderedFavoriteIds = favorites.ratings
        .filter((entry) => entry.isFavorite)
        .map((entry) => entry.recipeId)
        .reverse()

      const targetIds = typeof limit === "number"
        ? orderedFavoriteIds.slice(0, limit)
        : orderedFavoriteIds

      if (targetIds.length === 0) {
        return []
      }

      const recipes = await resolveRecipesByIds(targetIds)

      if (order === "createdAt") {
        return sortRecipesByCreatedAt(recipes)
      }

      return recipes
    } catch (err) {
      const message = err instanceof Error
        ? err.message
        : "Impossible de récupérer les recettes favorites."

      setError(message)
      throw new Error(message)
    } finally {
      setLoading(false)
    }
  }, [getFavorites])

  return { getFavoriteRecipes, loading, error }
}
