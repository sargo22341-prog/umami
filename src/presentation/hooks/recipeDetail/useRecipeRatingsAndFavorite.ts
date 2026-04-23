import { useEffect, useMemo, useState } from "react"

import type { MealieRecipeOutput, MealieUserRatingSummary } from "@/shared/types/mealie/Recipes.ts"
import { useGetFavorites } from "hooks/favorite/useGetFavorites.ts"
import { useToggleFavorite } from "hooks/favorite/useToggleFavorite.ts"
import { useUpdateRating } from "hooks/rating/useUpdateRating.ts"

interface UseRecipeRatingsAndFavoriteParams {
  recipe: MealieRecipeOutput
  setRecipe: React.Dispatch<React.SetStateAction<MealieRecipeOutput | null>>
}

export function useRecipeRatingsAndFavorite({
  recipe,
  setRecipe,
}: UseRecipeRatingsAndFavoriteParams) {
  const { getFavorites } = useGetFavorites()
  const { toggleFavorite } = useToggleFavorite()
  const { updateRating } = useUpdateRating()
  const [ratings, setRatings] = useState<MealieUserRatingSummary[]>([])
  const [favoriteOverride, setFavoriteOverride] = useState<boolean | null>(null)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      const data = await getFavorites()
      if (!mounted) return
      setRatings(data.ratings)
    }
    void load()
    return () => {
      mounted = false
    }
  }, [getFavorites])

  const isFavorite = useMemo(() => {
    if (favoriteOverride !== null) return favoriteOverride
    return ratings.some((rating) => rating.recipeId === recipe.id && rating.isFavorite)
  }, [favoriteOverride, ratings, recipe.id])

  const handleRate = async (value: number) => {
    const success = await updateRating(recipe.slug, value)
    if (success) {
      setRecipe((previousRecipe) => (
        previousRecipe ? { ...previousRecipe, rating: value } : previousRecipe
      ))
    }
  }

  const handleToggleFavorite = async () => {
    const previous = isFavorite
    const next = !previous
    setFavoriteOverride(next)
    const success = await toggleFavorite(recipe.slug, previous)
    if (!success) {
      setFavoriteOverride(previous)
    }
  }

  return {
    isFavorite,
    handleRate,
    handleToggleFavorite,
  }
}
