import { useState } from "react"
import { createRecipeUseCase, updateRecipeUseCase } from "@/infrastructure/container.ts"
import type { MealieRecipeOutput, RecipeFormData } from "@/shared/types/mealie/Recipes.ts"

export function useRecipeForm() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createRecipe = async (data: RecipeFormData): Promise<MealieRecipeOutput | null> => {
    setLoading(true)
    setError(null)
    try {
      return await createRecipeUseCase.execute(data)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de créer la recette. Veuillez réessayer.",
      )
      return null
    } finally {
      setLoading(false)
    }
  }

  const updateRecipe = async (slug: string, data: RecipeFormData): Promise<MealieRecipeOutput | null> => {
    setLoading(true)
    setError(null)
    try {
      return await updateRecipeUseCase.execute(slug, data)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de modifier la recette. Veuillez réessayer.",
      )
      return null
    } finally {
      setLoading(false)
    }
  }

  return { createRecipe, updateRecipe, loading, error }
}
