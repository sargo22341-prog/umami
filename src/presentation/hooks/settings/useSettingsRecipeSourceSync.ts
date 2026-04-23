import { useCallback, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"

import {
  getCategoriesUseCase,
  getRecipeUseCase,
  getRecipesUseCase,
  getTagsUseCase,
  updateRecipeUseCase,
} from "@/infrastructure/container.ts"
import { fetchAllRecipes } from "@/shared/utils/recipe.ts"
import { toggleValueInArray } from "@/shared/utils/array.ts"
import { buildFormData } from "components/recipeDetail/buildFormData.tsx"
import { buildRecipeSyncFields } from "components/recipeDetail/recipeDetail.helpers.tsx"
import type { RecipeSyncFieldPreview } from "components/recipeDetail/RecipeSyncDialog.tsx"
import type { RecipeFormData, RecipeFormIngredient } from "@/shared/types/mealie/Recipes.ts"
import type { MealieScrapedRecipePreview } from "@/shared/types/mealie/RecipeImport.ts"
import type {
  RecipeSourceSyncBatchCounts,
  RecipeSourceSyncBatchDetails,
  RecipeSourceSyncBatchStatus,
} from "components/settings/settingsPage.types.ts"
import {
  createEmptyRecipeSourceSyncBatchDetails,
  getErrorMessage,
  getErrorStatusCode,
  getRecipeSourceSyncBatchDetailsCount,
} from "components/settings/settingsPage.utils.ts"
import { analyzeRecipeSyncSource, buildSyncedRecipeFormData } from "hooks/recipeDetail/recipeSync.shared.ts"

type ReviewDecision =
  | { action: "apply"; selectedFieldIds: string[] }
  | { action: "skip" }

type PendingReview = {
  recipeSlug: string
  recipeName: string
  sourceUrl: string
  formData: RecipeFormData
  scrapedPreview: MealieScrapedRecipePreview
  analyzedIncomingIngredients: RecipeFormIngredient[]
  fields: RecipeSyncFieldPreview[]
  syncSelection: string[]
}

function getProgressPercent(status: RecipeSourceSyncBatchStatus) {
  if (status.state === "idle") return 0
  return status.total > 0 ? Math.round((status.processed / status.total) * 100) : 0
}

export function useSettingsRecipeSourceSync() {
  const navigate = useNavigate()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [status, setStatus] = useState<RecipeSourceSyncBatchStatus>({ state: "idle" })
  const [details, setDetails] = useState<RecipeSourceSyncBatchDetails>(() => createEmptyRecipeSourceSyncBatchDetails())
  const [pendingReview, setPendingReview] = useState<PendingReview | null>(null)
  const reviewResolverRef = useRef<((decision: ReviewDecision) => void) | null>(null)

  const resolveReview = useCallback((decision: ReviewDecision) => {
    reviewResolverRef.current?.(decision)
    reviewResolverRef.current = null
    setPendingReview(null)
  }, [])

  const run = async () => {
    const initialCounts: RecipeSourceSyncBatchCounts = {
      processed: 0,
      total: 0,
      updated: 0,
      skippedNoSource: 0,
      skippedNoChanges: 0,
      skippedDeclined: 0,
      errors: 0,
    }

    setConfirmOpen(false)
    setDetails(createEmptyRecipeSourceSyncBatchDetails())
    setPendingReview(null)
    setStatus({
      state: "running",
      currentRecipeName: null,
      lastMessage: null,
      ...initialCounts,
    })

    try {
      const [recipes, allTags, allCategories] = await Promise.all([
        fetchAllRecipes(
          (page, perPage, filters) => getRecipesUseCase.execute(page, perPage, filters),
          {
            orderBy: "createdAt",
            orderDirection: "desc",
          },
        ),
        getTagsUseCase.execute(),
        getCategoriesUseCase.execute(),
      ])

      const counts: RecipeSourceSyncBatchCounts = {
        ...initialCounts,
        total: recipes.length,
      }

      const pushStatus = (
        state: "running" | "waitingReview" | "done",
        currentRecipeName: string | null,
        lastMessage: string | null,
      ) => {
        setStatus({
          state,
          currentRecipeName,
          lastMessage,
          ...counts,
        })
      }

      const openReview = (review: PendingReview) => new Promise<ReviewDecision>((resolve) => {
        reviewResolverRef.current = resolve
        setPendingReview(review)
        pushStatus("waitingReview", review.recipeName, "En attente de validation des changements")
      })

      pushStatus("running", null, null)

      for (const recipeSummary of recipes) {
        pushStatus("running", recipeSummary.name, "Analyse de la recette")

        try {
          const recipe = await getRecipeUseCase.execute(recipeSummary.slug)
          const sourceUrl = recipe.orgURL?.trim() ?? ""

          if (!sourceUrl) {
            counts.skippedNoSource += 1
            counts.processed += 1
            setDetails((previousDetails) => ({
              ...previousDetails,
              skippedNoSource: [
                ...previousDetails.skippedNoSource,
                {
                  slug: recipe.slug,
                  name: recipe.name,
                  description: "Cette recette a ete ignoree car aucune URL source n'est renseignee.",
                },
              ],
            }))
            pushStatus("running", recipe.name, "Skippee : aucune URL source")
            continue
          }

          const formData = buildFormData(recipe)
          const analysis = await analyzeRecipeSyncSource(sourceUrl, formData)

          if (analysis.changedFieldIds.length === 0) {
            counts.skippedNoChanges += 1
            counts.processed += 1
            setDetails((previousDetails) => ({
              ...previousDetails,
              skippedNoChanges: [
                ...previousDetails.skippedNoChanges,
                {
                  slug: recipe.slug,
                  name: recipe.name,
                  description: "Aucune difference detectee entre la recette actuelle et sa source.",
                },
              ],
            }))
            pushStatus("running", recipe.name, "Skippee : aucune difference detectee")
            continue
          }

          const fields = buildRecipeSyncFields(
            formData,
            analysis.scrapedPreview,
            analysis.analyzedIncomingIngredients,
          )

          const decision = await openReview({
            recipeSlug: recipe.slug,
            recipeName: recipe.name,
            sourceUrl,
            formData,
            scrapedPreview: analysis.scrapedPreview,
            analyzedIncomingIngredients: analysis.analyzedIncomingIngredients,
            fields,
            syncSelection: analysis.changedFieldIds,
          })

          if (decision.action === "skip") {
            counts.skippedDeclined += 1
            counts.processed += 1
            setDetails((previousDetails) => ({
              ...previousDetails,
              skippedDeclined: [
                ...previousDetails.skippedDeclined,
                {
                  slug: recipe.slug,
                  name: recipe.name,
                  description: "Les changements proposes ont ete refuses manuellement.",
                },
              ],
            }))
            pushStatus("running", recipe.name, "Recette ignoree apres validation manuelle")
            continue
          }

          const nextFormData = buildSyncedRecipeFormData({
            formData,
            scrapedPreview: analysis.scrapedPreview,
            analyzedIncomingIngredients: analysis.analyzedIncomingIngredients,
            selectedFieldIds: decision.selectedFieldIds,
            allTags,
            allCategories,
          })

          await updateRecipeUseCase.execute(recipe.slug, nextFormData)

          counts.updated += 1
          counts.processed += 1
          setDetails((previousDetails) => ({
            ...previousDetails,
            updated: [
              ...previousDetails.updated,
              {
                slug: recipe.slug,
                name: recipe.name,
                description: `${decision.selectedFieldIds.length} champ${decision.selectedFieldIds.length > 1 ? "s" : ""} synchronise${decision.selectedFieldIds.length > 1 ? "s" : ""}.`,
              },
            ],
          }))
          pushStatus("running", recipe.name, "Synchronisation appliquee")
        } catch (error) {
          counts.errors += 1
          counts.processed += 1
          setDetails((previousDetails) => ({
            ...previousDetails,
            errors: [
              ...previousDetails.errors,
              {
                slug: recipeSummary.slug,
                name: recipeSummary.name,
                description: getErrorMessage(error, "Impossible de synchroniser cette recette."),
                statusCode: getErrorStatusCode(error),
              },
            ],
          }))
          pushStatus("running", recipeSummary.name, "Erreur pendant la synchronisation")
        }
      }

      pushStatus("done", null, "Synchronisation terminee.")
    } catch (error) {
      setStatus((previousStatus) => ({
        state: "error",
        message: getErrorMessage(error, "Impossible de synchroniser les recettes depuis leur source."),
        currentRecipeName: previousStatus.state === "idle" ? null : previousStatus.currentRecipeName,
        lastMessage: previousStatus.state === "idle" ? null : previousStatus.lastMessage,
        processed: previousStatus.state === "idle" ? 0 : previousStatus.processed,
        total: previousStatus.state === "idle" ? 0 : previousStatus.total,
        updated: previousStatus.state === "idle" ? 0 : previousStatus.updated,
        skippedNoSource: previousStatus.state === "idle" ? 0 : previousStatus.skippedNoSource,
        skippedNoChanges: previousStatus.state === "idle" ? 0 : previousStatus.skippedNoChanges,
        skippedDeclined: previousStatus.state === "idle" ? 0 : previousStatus.skippedDeclined,
        errors: previousStatus.state === "idle" ? 0 : previousStatus.errors,
      }))
    } finally {
      reviewResolverRef.current = null
    }
  }

  const toggleSyncField = useCallback((fieldId: string) => {
    setPendingReview((current) =>
      current
        ? {
          ...current,
          syncSelection: toggleValueInArray(current.syncSelection, fieldId),
        }
        : current,
    )
  }, [])

  const confirmReview = useCallback(() => {
    if (!pendingReview || pendingReview.syncSelection.length === 0) return
    resolveReview({
      action: "apply",
      selectedFieldIds: pendingReview.syncSelection,
    })
  }, [pendingReview, resolveReview])

  const skipReview = useCallback(() => {
    resolveReview({ action: "skip" })
  }, [resolveReview])

  const openRecipe = (slug: string) => {
    setDetailsDialogOpen(false)
    navigate(`/recipes/${slug}`)
  }

  return {
    confirmOpen,
    setConfirmOpen,
    detailsDialogOpen,
    setDetailsDialogOpen,
    status,
    details,
    detailsCount: useMemo(() => getRecipeSourceSyncBatchDetailsCount(details), [details]),
    progress: useMemo(() => getProgressPercent(status), [status]),
    reviewDialogOpen: Boolean(pendingReview),
    pendingReview,
    toggleSyncField,
    confirmReview,
    skipReview,
    run,
    openRecipe,
  }
}
