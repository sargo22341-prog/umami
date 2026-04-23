import { useCallback, useState } from "react"
import {
  getShoppingItemsUseCase,
  addRecipesToListUseCase,
  getRecipesByIdsUseCase,
} from "@/infrastructure/container.ts"
import type { RecipeCartSelection } from "@/application/shopping/usecases/AddRecipesToListUseCase.ts"
import type { PlanningCartRecipe } from "components/common/PlanningAddToCartDialog.tsx"

interface MealEntry {
  slug: string
}

export function useAddRecipesToCart() {
  const [loadingRecipes, setLoadingRecipes] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const loadPlanningRecipes = useCallback(async (meals: MealEntry[]): Promise<PlanningCartRecipe[]> => {
    if (meals.length === 0) return []

    setLoadingRecipes(true)
    setError(null)

    try {
      const counts = new Map<string, number>()
      for (const meal of meals) {
        counts.set(meal.slug, (counts.get(meal.slug) ?? 0) + 1)
      }

      const uniqueSlugs = [...counts.keys()]
      const recipes = await getRecipesByIdsUseCase.execute(uniqueSlugs)
      const recipesBySlug = new Map(recipes.map((recipe) => [recipe.slug, recipe]))

      return uniqueSlugs
        .map((slug) => {
          const recipe = recipesBySlug.get(slug)
          if (!recipe) return null

          return {
            recipe,
            occurrences: counts.get(slug) ?? 1,
          }
        })
        .filter((entry): entry is PlanningCartRecipe => Boolean(entry))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors du chargement des recettes")
      return []
    } finally {
      setLoadingRecipes(false)
    }
  }, [])

  const addRecipes = useCallback(async (selections: RecipeCartSelection[]) => {
    if (selections.length === 0) return false

    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const { list } = await getShoppingItemsUseCase.execute()
      await addRecipesToListUseCase.execute(list.id, selections)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'ajout au panier")
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  return { loadPlanningRecipes, addRecipes, loadingRecipes, loading, error, success }
}
