import { useState } from "react"

import {
  prepareUrlImportReview,
  saveReviewedUrlImportRecipe,
  type UrlImportReviewDraft,
} from "@/infrastructure/recipeSources/urlImportReviewService.ts"
import type { MealieRecipeScrapeOptions } from "@/shared/types/mealie/RecipeImport.ts"
import type { RecipeFormIngredient } from "@/shared/types/mealie/Recipes.ts"
import { isIngredientFullyMatched } from "@/shared/utils/ingredientMatching.ts"
import type { RecipeSourceRecipe } from "@/infrastructure/recipeSources/providers/types.ts"
import type { ExploreImportState } from "@/shared/types/exploreRecipes/exploreRecipes.ts"

function buildImportSuccessState(slug?: string): ExploreImportState {
  return {
    state: "ok",
    message: "Recette importee avec succes.",
    slug,
  }
}

export function useUrlRecipeImport() {
  const [urlImportState, setUrlImportState] = useState<ExploreImportState>({ state: "idle" })
  const [cardImportStates, setCardImportStates] = useState<Record<string, ExploreImportState>>({})
  const [urlImportReviewDraft, setUrlImportReviewDraft] = useState<UrlImportReviewDraft | null>(null)

  const finalizeImportedRecipe = async (
    draft: UrlImportReviewDraft,
    ingredients: RecipeFormIngredient[],
  ) => {
    const recipe = await saveReviewedUrlImportRecipe(draft, ingredients)
    const successState = buildImportSuccessState(recipe.slug)
    const resultKey = recipe.orgURL?.trim() || recipe.name

    setUrlImportReviewDraft(null)
    setCardImportStates((previousStates) => ({
      ...previousStates,
      [resultKey]: successState,
    }))
    setUrlImportState(successState)
  }

  const startUrlImportReview = async (
    url: string,
    options?: MealieRecipeScrapeOptions,
  ) => {
    setUrlImportState({ state: "loading" })

    try {
      const reviewDraft = await prepareUrlImportReview(url, options)
      const shouldBypassReview = reviewDraft.analyzedIngredients.every((item) => isIngredientFullyMatched({
        ingredient: item.parsed,
        availableFoods: reviewDraft.availableFoods,
        availableUnits: reviewDraft.availableUnits,
      }))

      if (shouldBypassReview) {
        const importedRecipe = await saveReviewedUrlImportRecipe(
          reviewDraft,
          reviewDraft.analyzedIngredients.map((item) => ({ ...item.parsed })),
        )
        const successState = buildImportSuccessState(importedRecipe.slug)
        const resultKey = importedRecipe.orgURL?.trim() || importedRecipe.name

        setUrlImportReviewDraft(null)
        setCardImportStates((previousStates) => ({
          ...previousStates,
          [resultKey]: successState,
        }))
        setUrlImportState(successState)

        return { ok: true as const, completed: true as const, slug: importedRecipe.slug }
      }

      setUrlImportReviewDraft(reviewDraft)
      setUrlImportState({ state: "idle" })

      return { ok: true as const, completed: false as const }
    } catch (importError) {
      const message = importError instanceof Error ? importError.message : "Erreur lors de l'import."

      setUrlImportState({
        state: "error",
        message,
      })

      return { ok: false as const, message }
    }
  }

  const importFromUrl = async (url: string, options?: MealieRecipeScrapeOptions) => {
    await startUrlImportReview(url, options)
  }

  const startUrlImportFromSearchResult = async (
    recipe: RecipeSourceRecipe,
    options?: MealieRecipeScrapeOptions,
  ) => {
    const key = recipe.sourceUrl || recipe.name
    const sourceUrl = recipe.sourceUrl.trim()

    if (!sourceUrl) {
      setCardImportStates((previousStates) => ({
        ...previousStates,
        [key]: {
          state: "error",
          message: "Aucune URL disponible pour cette recette.",
        },
      }))
      return
    }

    setCardImportStates((previousStates) => ({
      ...previousStates,
      [key]: { state: "loading" },
    }))

    const result = await startUrlImportReview(sourceUrl, options)

    setCardImportStates((previousStates) => ({
      ...previousStates,
      [key]: result.ok
        ? result.completed
          ? buildImportSuccessState(result.slug)
          : { state: "idle" }
        : {
          state: "error",
          message: result.message,
        },
    }))
  }

  const confirmUrlImportReview = async (ingredients: RecipeFormIngredient[]) => {
    if (!urlImportReviewDraft) return

    setUrlImportState({ state: "loading" })

    try {
      await finalizeImportedRecipe(urlImportReviewDraft, ingredients)
    } catch (importError) {
      setUrlImportState({
        state: "error",
        message: importError instanceof Error ? importError.message : "Erreur lors de l'import.",
      })
    }
  }

  const closeUrlImportReview = () => {
    setUrlImportReviewDraft(null)
    setUrlImportState({ state: "idle" })
  }

  const resetUrlImportState = () => {
    setUrlImportState({ state: "idle" })
  }

  return {
    urlImportState,
    urlImportReviewDraft,
    cardImportStates,
    importFromUrl,
    startUrlImportFromSearchResult,
    confirmUrlImportReview,
    closeUrlImportReview,
    resetUrlImportState,
  }
}
