import { useCallback, useState } from "react"

import type { UrlImportReviewDraft } from "@/infrastructure/recipeSources/urlImportReviewService.ts"
import { analyzeRecipeIngredientOutputs } from "@/infrastructure/recipeSources/urlImportReviewService.ts"
import { isIngredientFullyMatched } from "@/shared/utils/ingredientMatching.ts"
import type {
  MealieRecipeIngredientOutput,
  MealieRecipeOutput,
  RecipeFormData,
  RecipeFormIngredient,
} from "@/shared/types/mealie/Recipes.ts"
import { applyAnalyzedIngredientToFormIngredient } from "components/recipeDetail/recipeDetail.helpers.tsx"

interface UseRecipeIngredientAnalysisParams {
  formData: RecipeFormData
  recipe: MealieRecipeOutput
  patch: (partial: Partial<RecipeFormData>) => void
}

export function useRecipeIngredientAnalysis({
  formData,
  recipe,
  patch,
}: UseRecipeIngredientAnalysisParams) {
  const [analyzingIngredientIndexes, setAnalyzingIngredientIndexes] = useState<number[]>([])
  const [ingredientReviewDraft, setIngredientReviewDraft] = useState<UrlImportReviewDraft | null>(null)
  const [ingredientReviewOpen, setIngredientReviewOpen] = useState(false)
  const [ingredientReviewError, setIngredientReviewError] = useState<string | null>(null)
  const [reviewingIngredientIndexes, setReviewingIngredientIndexes] = useState<number[]>([])

  const handleAnalyzeIngredients = useCallback(async (targetIndexes?: number[]) => {
    const indexes = (targetIndexes ?? formData.recipeIngredient.map((_, index) => index))
      .filter((index) => {
        const ingredient = formData.recipeIngredient[index]
        if (!ingredient) return false
        return Boolean(ingredient.note.trim()) && !ingredient.food.trim() && !ingredient.unit.trim()
      })

    if (indexes.length === 0) return

    setAnalyzingIngredientIndexes(indexes)
    try {
      const analysis = await analyzeRecipeIngredientOutputs(
        indexes.map((index): MealieRecipeIngredientOutput => ({
          note: formData.recipeIngredient[index]?.note ?? "",
          referenceId: formData.recipeIngredient[index]?.referenceId,
        })),
      )

      const hasIncompleteMatches = analysis.analyzedIngredients.some((item) => !isIngredientFullyMatched({
        ingredient: item.parsed,
        availableFoods: analysis.availableFoods,
        availableUnits: analysis.availableUnits,
      }))

      if (!hasIncompleteMatches) {
        const analyzedByIndex = new Map(
          indexes.map((index, position) => [index, analysis.analyzedIngredients[position]?.parsed ?? null]),
        )

        patch({
          recipeIngredient: formData.recipeIngredient.map((ingredient, index) => {
            const analyzed = analyzedByIndex.get(index)
            if (!analyzed) return ingredient
            return applyAnalyzedIngredientToFormIngredient(ingredient, analyzed)
          }),
        })
        return
      }

      setIngredientReviewError(null)
      setReviewingIngredientIndexes(indexes)
      setIngredientReviewDraft({
        url: recipe.orgURL ?? "",
        scrapeOptions: {
          includeTags: true,
          includeCategories: true,
          autoLinkIngredientsToInstructions: true,
        },
        preview: {
          name: recipe.name,
          recipeIngredient: indexes.map((index) => formData.recipeIngredient[index]?.note ?? ""),
        },
        recipe,
        formData: {
          ...formData,
          recipeIngredient: analysis.analyzedIngredients.map((item) => ({ ...item.parsed })),
        },
        analyzedIngredients: analysis.analyzedIngredients,
        availableUnits: analysis.availableUnits,
        availableFoods: analysis.availableFoods,
      })
      setIngredientReviewOpen(true)
    } finally {
      setAnalyzingIngredientIndexes([])
    }
  }, [formData, patch, recipe])

  const handleIngredientReviewOpenChange = useCallback((open: boolean) => {
    setIngredientReviewOpen(open)
    if (!open) {
      setIngredientReviewDraft(null)
      setIngredientReviewError(null)
      setReviewingIngredientIndexes([])
    }
  }, [])

  const handleIngredientReviewConfirm = useCallback((ingredients: RecipeFormIngredient[]) => {
    const reviewedByIndex = new Map(
      reviewingIngredientIndexes.map((index, position) => [index, ingredients[position] ?? null]),
    )

    patch({
      recipeIngredient: formData.recipeIngredient.map((ingredient, index) => {
        const reviewed = reviewedByIndex.get(index)
        if (!reviewed) return ingredient
        return applyAnalyzedIngredientToFormIngredient(ingredient, reviewed)
      }),
    })

    setIngredientReviewOpen(false)
    setIngredientReviewDraft(null)
    setIngredientReviewError(null)
    setReviewingIngredientIndexes([])
  }, [formData.recipeIngredient, patch, reviewingIngredientIndexes])

  return {
    analyzingIngredientIndexes,
    ingredientReviewDraft,
    ingredientReviewOpen,
    ingredientReviewError,
    reviewingIngredientIndexes,
    handleAnalyzeIngredients,
    handleIngredientReviewOpenChange,
    handleIngredientReviewConfirm,
  }
}
