import { useCallback, useEffect, useState } from "react"
import type { MealieRecipeOutput } from "@/shared/types/mealie/Recipes.ts"
import { getRecipeUseCase } from "@/infrastructure/container.ts"
import { getCachedRecipeBySlug, setRecipeSummaryCache } from "presentation/cache/recipeSummaryCache.ts"

export function useRecipe(slug: string | undefined) {
  const [recipe, setRecipe] = useState<MealieRecipeOutput | null>(null)
  const [loading, setLoading] = useState(!!slug)
  const [error, setError] = useState<string | null>(
    slug ? null : "Aucun slug fourni",
  )

  const fetchRecipe = useCallback(async (slug: string) => {
    setLoading(true)
    setError(null)
    try {
      const data = await getRecipeUseCase.execute(slug)
      setRecipeSummaryCache([data])
      setRecipe(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    setRecipe(null)

    if (!slug) {
      setLoading(false)
      setError("Aucun slug fourni")
      return
    }

    const cachedRecipe = getCachedRecipeBySlug(slug)
    if (cachedRecipe) {
      setRecipe(cachedRecipe)
      setError(null)
    }

    setLoading(true)
    setError(null)
    void fetchRecipe(slug)
  }, [slug, fetchRecipe])

  return { recipe, setRecipe, loading, error }
}
