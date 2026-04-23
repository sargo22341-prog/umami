import { useCallback, useEffect, useMemo, useState } from "react"

import { getRecipeUseCase } from "@/infrastructure/container.ts"
import type { MealieRecipeCategory } from "@/shared/types/mealie/Category.ts"
import type { MealieScrapedRecipePreview } from "@/shared/types/mealie/RecipeImport.ts"
import type {
  MealieRecipeOutput,
  RecipeFormData,
  RecipeFormIngredient,
} from "@/shared/types/mealie/Recipes.ts"
import type { MealieRecipeTag } from "@/shared/types/mealie/Tags.ts"
import { toggleValueInArray } from "@/shared/utils/array.ts"
import {
  buildRecipeSyncFields,
} from "components/recipeDetail/recipeDetail.helpers.tsx"
import { analyzeRecipeSyncSource, buildSyncedRecipeFormData } from "./recipeSync.shared.ts"

interface UseRecipeDetailSyncParams {
  recipe: MealieRecipeOutput
  formData: RecipeFormData
  allTags: MealieRecipeTag[]
  allCategories: MealieRecipeCategory[]
  saveError: string | null
  persistRecipeForm: (nextFormData: RecipeFormData) => Promise<MealieRecipeOutput | null>
  resetFormFromRecipe: (recipe: MealieRecipeOutput) => void
}

export function useRecipeDetailSync({
  recipe,
  formData,
  allTags,
  allCategories,
  saveError,
  persistRecipeForm,
  resetFormFromRecipe,
}: UseRecipeDetailSyncParams) {
  const [syncDialogOpen, setSyncDialogOpen] = useState(false)
  const [scrapedPreview, setScrapedPreview] = useState<MealieScrapedRecipePreview | null>(null)
  const [analyzedSyncIngredients, setAnalyzedSyncIngredients] = useState<RecipeFormIngredient[]>([])
  const [syncSelection, setSyncSelection] = useState<string[]>([])
  const [syncLoading, setSyncLoading] = useState(false)
  const [syncApplying, setSyncApplying] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)

  const syncFields = useMemo(
    () => buildRecipeSyncFields(formData, scrapedPreview, analyzedSyncIngredients),
    [analyzedSyncIngredients, formData, scrapedPreview],
  )

  const resetSyncState = useCallback(() => {
    setScrapedPreview(null)
    setAnalyzedSyncIngredients([])
    setSyncSelection([])
    setSyncError(null)
  }, [])

  const loadScrapedPreview = useCallback(async () => {
    if (!recipe.orgURL) return

    setSyncLoading(true)
    setSyncError(null)
    try {
      const analysis = await analyzeRecipeSyncSource(recipe.orgURL, formData)
      setScrapedPreview(analysis.scrapedPreview)
      setAnalyzedSyncIngredients(analysis.analyzedIncomingIngredients)
      setSyncSelection(analysis.changedFieldIds)
    } catch (error) {
      resetSyncState()
      setSyncError(
        error instanceof Error && error.message.trim()
          ? error.message
          : "Impossible d'analyser la source de cette recette.",
      )
    } finally {
      setSyncLoading(false)
    }
  }, [formData, recipe.orgURL, resetSyncState])

  useEffect(() => {
    if (!syncDialogOpen || !recipe.orgURL) return
    void loadScrapedPreview()
  }, [loadScrapedPreview, recipe.orgURL, syncDialogOpen])

  const toggleSyncField = useCallback((fieldId: string) => {
    setSyncSelection((current) => toggleValueInArray(current, fieldId))
  }, [])

  const handleApplySync = useCallback(async () => {
    if (!scrapedPreview || syncSelection.length === 0) return

    const nextFormData = buildSyncedRecipeFormData({
      formData,
      scrapedPreview,
      analyzedIncomingIngredients: analyzedSyncIngredients,
      selectedFieldIds: syncSelection,
      allTags,
      allCategories,
    })

    setSyncApplying(true)
    setSyncError(null)
    try {
      const updated = await persistRecipeForm(nextFormData)
      if (updated) {
        await new Promise((resolve) => setTimeout(resolve, 900))
        const refreshedRecipe = await getRecipeUseCase.execute(recipe.slug)
        resetFormFromRecipe(refreshedRecipe)
        setSyncDialogOpen(false)
        setScrapedPreview(null)
        setSyncSelection([])
      } else {
        setSyncError(saveError ?? "Impossible d'appliquer la synchronisation.")
      }
    } catch (error) {
      setSyncError(
        error instanceof Error ? error.message : "Impossible d'appliquer la synchronisation.",
      )
    } finally {
      setSyncApplying(false)
    }
  }, [
    allCategories,
    allTags,
    analyzedSyncIngredients,
    formData,
    persistRecipeForm,
    recipe.slug,
    resetFormFromRecipe,
    saveError,
    scrapedPreview,
    syncSelection,
  ])

  const handleSyncDialogOpenChange = useCallback((open: boolean) => {
    setSyncDialogOpen(open)
    if (!open) {
      resetSyncState()
    }
  }, [resetSyncState])

  return {
    syncDialogOpen,
    syncFields,
    syncSelection,
    syncLoading,
    syncApplying,
    syncError,
    setSyncDialogOpen: handleSyncDialogOpenChange,
    loadScrapedPreview,
    toggleSyncField,
    handleApplySync,
  }
}
