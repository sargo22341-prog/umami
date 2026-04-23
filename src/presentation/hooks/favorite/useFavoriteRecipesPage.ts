import { useEffect, useMemo, useState } from "react"

import type { MealieRecipeOutput } from "@/shared/types/mealie/Recipes.ts"
import { normalizeText } from "@/shared/utils/text.ts"
import { useFavoriteRecipes } from "./useFavoriteRecipesProfile.ts"

export function useFavoriteRecipesPage() {
  const { getFavoriteRecipes } = useFavoriteRecipes()
  const [search, setSearch] = useState("")
  const [recipes, setRecipes] = useState<MealieRecipeOutput[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const loadFavorites = async () => {
      setLoading(true)
      setError(null)
      try {
        const favoriteRecipes = await getFavoriteRecipes({ order: "createdAt" })
        if (!cancelled) {
          setRecipes(favoriteRecipes)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Impossible de charger les favoris.")
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadFavorites()

    return () => {
      cancelled = true
    }
  }, [getFavoriteRecipes])

  const filteredRecipes = useMemo(() => {
    const query = normalizeText(search)
    if (!query) return recipes
    return recipes.filter((recipe) => normalizeText(recipe.name).includes(query))
  }, [recipes, search])

  return {
    search,
    setSearch,
    recipes,
    filteredRecipes,
    loading,
    error,
  }
}
