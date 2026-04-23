import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"

import { getRecipeUseCase, getRecipesUseCase, updateCalorieTagUseCase } from "@/infrastructure/container.ts"
import { fetchAllRecipes } from "@/shared/utils/recipe.ts"
import {
  createEmptyCalorieTagBatchDetails,
  getCalorieTagBatchDetailsCount,
  getErrorMessage,
  getErrorStatusCode,
  parseCaloriesFromNutrition,
} from "components/settings/settingsPage.utils.ts"
import type { CalorieSyncStatus, CalorieTagBatchCounts, CalorieTagBatchDetails } from "components/settings/settingsPage.types.ts"

function getProgressPercent(status: CalorieSyncStatus) {
  if (status.state === "idle") return 0
  return status.total > 0 ? Math.round((status.processed / status.total) * 100) : 0
}

export function useSettingsCalorieTags() {
  const navigate = useNavigate()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [status, setStatus] = useState<CalorieSyncStatus>({ state: "idle" })
  const [details, setDetails] = useState<CalorieTagBatchDetails>(() => createEmptyCalorieTagBatchDetails())

  const run = async () => {
    const initialCounts: CalorieTagBatchCounts = {
      processed: 0,
      total: 0,
      added: 0,
      updated: 0,
      missingCalories: 0,
      skipped: 0,
      errors: 0,
    }

    setDetails(createEmptyCalorieTagBatchDetails())
    setStatus({
      state: "running",
      currentRecipeName: null,
      lastMessage: null,
      ...initialCounts,
    })

    try {
      const recipes = await fetchAllRecipes(
        (page, perPage, filters) => getRecipesUseCase.execute(page, perPage, filters),
        {
          orderBy: "createdAt",
          orderDirection: "desc",
        },
      )

      const counts: CalorieTagBatchCounts = {
        ...initialCounts,
        total: recipes.length,
      }

      const pushProgress = (currentRecipeName: string | null, lastMessage: string | null) => {
        setStatus({
          state: "running",
          currentRecipeName,
          lastMessage,
          ...counts,
        })
      }

      pushProgress(null, null)

      for (const recipeSummary of recipes) {
        pushProgress(recipeSummary.name, null)

        try {
          const recipe = await getRecipeUseCase.execute(recipeSummary.slug)
          const calories = parseCaloriesFromNutrition(recipe.nutrition?.calories)
          const existingTag = recipe.tags?.find((tag) => tag.slug.startsWith("calorie-"))
          const existingCalories = existingTag
            ? Number(existingTag.slug.replace("calorie-", ""))
            : null

          if (calories === null) {
            counts.missingCalories += 1
            counts.processed += 1
            setDetails((previousDetails) => ({
              ...previousDetails,
              missingCalories: [
                ...previousDetails.missingCalories,
                {
                  slug: recipe.slug,
                  name: recipe.name,
                  description: "Aucune valeur de calories exploitable n'a ete trouvee dans la nutrition.",
                },
              ],
            }))
            pushProgress(recipe.name, "Calories manquantes : aucun tag applique")
            continue
          }

          if (existingCalories === calories) {
            counts.skipped += 1
            counts.processed += 1
            setDetails((previousDetails) => ({
              ...previousDetails,
              skipped: [
                ...previousDetails.skipped,
                {
                  slug: recipe.slug,
                  name: recipe.name,
                  description: `Recette passee : le tag calorie-${calories} etait deja a jour.`,
                },
              ],
            }))
            pushProgress(recipe.name, "Recette passee : tag deja a jour")
            continue
          }

          await updateCalorieTagUseCase.execute(recipe.slug, calories)

          if (existingTag) {
            counts.updated += 1
            setDetails((previousDetails) => ({
              ...previousDetails,
              updated: [
                ...previousDetails.updated,
                {
                  slug: recipe.slug,
                  name: recipe.name,
                  description: `Tag mis a jour : ${existingTag.name ?? existingTag.slug} -> calorie-${calories}.`,
                },
              ],
            }))
            counts.processed += 1
            pushProgress(recipe.name, `Tag mis a jour : calorie-${calories}`)
            continue
          }

          counts.added += 1
          counts.processed += 1
          setDetails((previousDetails) => ({
            ...previousDetails,
            added: [
              ...previousDetails.added,
              {
                slug: recipe.slug,
                name: recipe.name,
                description: `Tag ajoute : calorie-${calories}.`,
              },
            ],
          }))
          pushProgress(recipe.name, `Tag ajoute : calorie-${calories}`)
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
                description: getErrorMessage(error, "Impossible de synchroniser le tag calorie pour cette recette."),
                statusCode: getErrorStatusCode(error),
              },
            ],
          }))
          pushProgress(recipeSummary.name, "Erreur pendant la synchronisation")
        }
      }

      setStatus({
        state: "done",
        currentRecipeName: null,
        lastMessage: "Synchronisation terminee.",
        ...counts,
      })
    } catch (error) {
      setStatus((previousStatus) => ({
        state: "error",
        message: getErrorMessage(error, "Impossible de synchroniser les tags calories."),
        currentRecipeName: previousStatus.state === "idle" ? null : previousStatus.currentRecipeName,
        lastMessage: previousStatus.state === "idle" ? null : previousStatus.lastMessage,
        processed: previousStatus.state === "idle" ? 0 : previousStatus.processed,
        total: previousStatus.state === "idle" ? 0 : previousStatus.total,
        added: previousStatus.state === "idle" ? 0 : previousStatus.added,
        updated: previousStatus.state === "idle" ? 0 : previousStatus.updated,
        missingCalories: previousStatus.state === "idle" ? 0 : previousStatus.missingCalories,
        skipped: previousStatus.state === "idle" ? 0 : previousStatus.skipped,
        errors: previousStatus.state === "idle" ? 0 : previousStatus.errors,
      }))
    }
  }

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
    detailsCount: useMemo(() => getCalorieTagBatchDetailsCount(details), [details]),
    progress: useMemo(() => getProgressPercent(status), [status]),
    run,
    openRecipe,
  }
}
