import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"

import { getRecipeUseCase, getRecipesUseCase, updateRecipeUseCase } from "@/infrastructure/container.ts"
import { fetchAllRecipes } from "@/shared/utils/recipe.ts"
import { analyzeInstructionIngredientLinks } from "@/shared/utils/recipeInstructionIngredientLinks.ts"
import { generateId } from "@/shared/utils/id.ts"
import { buildFormData } from "components/recipeDetail/buildFormData.tsx"
import type {
  IngredientLinkBatchCounts,
  IngredientLinkBatchDetails,
  IngredientLinkBatchStatus,
} from "components/settings/settingsPage.types.ts"
import {
  areReferenceListsEqual,
  buildIngredientLinkErrorDescription,
  createEmptyIngredientLinkBatchDetails,
  getErrorStatusCode,
  getIngredientLinkBatchDetailsCount,
} from "components/settings/settingsPage.utils.ts"

function getProgressPercent(status: IngredientLinkBatchStatus) {
  if (status.state === "idle") return 0
  return status.total > 0 ? Math.round((status.processed / status.total) * 100) : 0
}

export function useSettingsIngredientInstructionLinks() {
  const navigate = useNavigate()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [status, setStatus] = useState<IngredientLinkBatchStatus>({ state: "idle" })
  const [details, setDetails] = useState<IngredientLinkBatchDetails>(() => createEmptyIngredientLinkBatchDetails())

  const run = async () => {
    const initialCounts: IngredientLinkBatchCounts = {
      processed: 0,
      total: 0,
      updated: 0,
      alreadyUpToDate: 0,
      skippedNoInstructions: 0,
      skippedNoIngredients: 0,
      errors: 0,
    }

    setDetails(createEmptyIngredientLinkBatchDetails())
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

      const counts: IngredientLinkBatchCounts = {
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
          const formData = buildFormData(recipe)
          const nextIngredients = formData.recipeIngredient.map((ingredient) => ({
            ...ingredient,
            referenceId: ingredient.referenceId ?? generateId(),
          }))

          const eligibleIngredients = nextIngredients.filter((ingredient) => Boolean(ingredient.foodId))
          if (eligibleIngredients.length === 0) {
            counts.skippedNoIngredients += 1
            counts.processed += 1
            setDetails((previousDetails) => ({
              ...previousDetails,
              skippedNoIngredients: [
                ...previousDetails.skippedNoIngredients,
                {
                  slug: recipe.slug,
                  name: recipe.name,
                  description: "Cette recette a ete ignoree car aucun ingredient exploitable n'a ete trouve.",
                },
              ],
            }))
            pushProgress(recipe.name, "Skippee : aucun ingredient exploitable")
            continue
          }

          const eligibleInstructions = formData.recipeInstructions.filter((instruction) => instruction.text.trim())
          if (eligibleInstructions.length === 0) {
            counts.skippedNoInstructions += 1
            counts.processed += 1
            setDetails((previousDetails) => ({
              ...previousDetails,
              skippedNoInstructions: [
                ...previousDetails.skippedNoInstructions,
                {
                  slug: recipe.slug,
                  name: recipe.name,
                  description: "Cette recette a ete ignoree car aucune instruction ou etape n'a ete trouvee.",
                },
              ],
            }))
            pushProgress(recipe.name, "Skippee : aucune instruction")
            continue
          }

          const linkAnalysis = analyzeInstructionIngredientLinks(
            nextIngredients.map((ingredient, index) => ({
              referenceId: ingredient.referenceId,
              food: recipe.recipeIngredient?.[index]?.food
                ?? (ingredient.food.trim() ? { name: ingredient.food } : null),
            })),
            formData.recipeInstructions,
          )

          const ingredientReferenceIdsChanged = nextIngredients.some((ingredient, index) =>
            ingredient.referenceId !== formData.recipeIngredient[index]?.referenceId,
          )
          const instructionLinksChanged = formData.recipeInstructions.some((instruction, index) =>
            !areReferenceListsEqual(
              (instruction.ingredientReferences ?? []).map((reference) => reference.referenceId),
              (linkAnalysis.nextInstructions[index]?.ingredientReferences ?? []).map((reference) => reference.referenceId),
            ),
          )

          if (!ingredientReferenceIdsChanged && !instructionLinksChanged) {
            counts.alreadyUpToDate += 1
            counts.processed += 1
            pushProgress(recipe.name, "Skippee : deja a jour")
            continue
          }

          await updateRecipeUseCase.execute(recipe.slug, {
            ...formData,
            recipeIngredient: nextIngredients,
            recipeInstructions: linkAnalysis.nextInstructions,
          })

          counts.updated += 1
          counts.processed += 1
          pushProgress(recipe.name, `Mise a jour : ${linkAnalysis.linkedCount} lien${linkAnalysis.linkedCount > 1 ? "s" : ""}`)
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
                description: buildIngredientLinkErrorDescription(error),
                statusCode: getErrorStatusCode(error),
              },
            ],
          }))
          pushProgress(recipeSummary.name, "Erreur pendant l'analyse")
        }
      }

      setStatus({
        state: "done",
        currentRecipeName: null,
        lastMessage: "Analyse terminee.",
        ...counts,
      })
    } catch (error) {
      setStatus((previousStatus) => ({
        state: "error",
        message:
          error instanceof Error && error.message.trim()
            ? error.message
            : "Impossible de lier automatiquement les ingredients aux etapes.",
        currentRecipeName: previousStatus.state === "idle" ? null : previousStatus.currentRecipeName,
        lastMessage: previousStatus.state === "idle" ? null : previousStatus.lastMessage,
        processed: previousStatus.state === "idle" ? 0 : previousStatus.processed,
        total: previousStatus.state === "idle" ? 0 : previousStatus.total,
        updated: previousStatus.state === "idle" ? 0 : previousStatus.updated,
        alreadyUpToDate: previousStatus.state === "idle" ? 0 : previousStatus.alreadyUpToDate,
        skippedNoInstructions: previousStatus.state === "idle" ? 0 : previousStatus.skippedNoInstructions,
        skippedNoIngredients: previousStatus.state === "idle" ? 0 : previousStatus.skippedNoIngredients,
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
    detailsCount: useMemo(() => getIngredientLinkBatchDetailsCount(details), [details]),
    progress: useMemo(() => getProgressPercent(status), [status]),
    run,
    openRecipe,
  }
}
