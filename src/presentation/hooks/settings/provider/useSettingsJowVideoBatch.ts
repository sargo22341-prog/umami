import { useMemo, useState } from "react"

import { getRecipeUseCase, getRecipesUseCase } from "@/infrastructure/container.ts"
import { mealieApiClient } from "@/infrastructure/mealie/api/index.ts"
import { buildJowVideoImportPayload } from "@/infrastructure/recipeSources/providers/jow/jow.videoImportWorkflow.ts"
import { isJowRecipeUrl } from "@/infrastructure/recipeSources/providers/jow/jow.videoImport.ts"
import { fetchAllRecipes } from "@/shared/utils/recipe.ts"
import { findRecipeVideoAssetPair } from "@/shared/utils/recipeVideoAssets.ts"
import { buildRecipeAssetPayload } from "components/settings/settingsPage.utils.ts"
import type { JowVideoBatchCounts, JowVideoBatchStatus } from "components/settings/settingsPage.types.ts"

function getProgressPercent(status: JowVideoBatchStatus) {
  if (status.state === "idle") return 0
  return status.total > 0 ? Math.round((status.processed / status.total) * 100) : 0
}

export function useSettingsJowVideoBatch() {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [status, setStatus] = useState<JowVideoBatchStatus>({ state: "idle" })

  const run = async () => {
    const initialCounts: JowVideoBatchCounts = {
      processed: 0,
      total: 0,
      jowDetected: 0,
      imported: 0,
      skippedExisting: 0,
      skippedNonJow: 0,
      skippedNoVideo: 0,
      errors: 0,
    }

    setStatus({
      state: "running",
      currentRecipeName: null,
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

      const counts: JowVideoBatchCounts = {
        ...initialCounts,
        total: recipes.length,
      }

      const pushProgress = (currentRecipeName: string | null) => {
        setStatus({
          state: "running",
          currentRecipeName,
          ...counts,
        })
      }

      const completeCurrentRecipe = (currentRecipeName: string) => {
        counts.processed += 1
        pushProgress(currentRecipeName)
      }

      pushProgress(null)

      for (const recipeSummary of recipes) {
        pushProgress(recipeSummary.name)
        let recipeCompleted = false

        const markRecipeCompleted = (currentRecipeName: string) => {
          if (recipeCompleted) return
          recipeCompleted = true
          completeCurrentRecipe(currentRecipeName)
        }

        if (!isJowRecipeUrl(recipeSummary.orgURL?.trim() ?? "")) {
          counts.skippedNonJow += 1
          markRecipeCompleted(recipeSummary.name)
          continue
        }

        counts.jowDetected += 1

        try {
          const recipe = await getRecipeUseCase.execute(recipeSummary.slug)

          if (findRecipeVideoAssetPair(recipe.assets ?? [])) {
            counts.skippedExisting += 1
            markRecipeCompleted(recipe.name)
            continue
          }

          const importPayload = await buildJowVideoImportPayload(recipe)
          if (importPayload.status !== "success") {
            counts.skippedNoVideo += 1
            markRecipeCompleted(recipe.name)
            continue
          }

          await mealieApiClient.uploadRecipeAsset(recipe.slug, buildRecipeAssetPayload(importPayload.videoFile))
          await mealieApiClient.uploadRecipeAsset(recipe.slug, buildRecipeAssetPayload(importPayload.jsonFile))

          counts.imported += 1
        } catch {
          counts.errors += 1
        } finally {
          markRecipeCompleted(recipeSummary.name)
        }
      }

      setStatus({
        state: "done",
        currentRecipeName: null,
        ...counts,
      })
    } catch (error) {
      setStatus((previousStatus) => ({
        state: "error",
        message:
          error instanceof Error && error.message.trim()
            ? error.message
            : "Impossible de lancer l'import automatique des videos Jow.",
        currentRecipeName: previousStatus.state === "idle" ? null : previousStatus.currentRecipeName,
        processed: previousStatus.state === "idle" ? 0 : previousStatus.processed,
        total: previousStatus.state === "idle" ? 0 : previousStatus.total,
        jowDetected: previousStatus.state === "idle" ? 0 : previousStatus.jowDetected,
        imported: previousStatus.state === "idle" ? 0 : previousStatus.imported,
        skippedExisting: previousStatus.state === "idle" ? 0 : previousStatus.skippedExisting,
        skippedNonJow: previousStatus.state === "idle" ? 0 : previousStatus.skippedNonJow,
        skippedNoVideo: previousStatus.state === "idle" ? 0 : previousStatus.skippedNoVideo,
        errors: previousStatus.state === "idle" ? 0 : previousStatus.errors,
      }))
    }
  }

  return {
    confirmOpen,
    setConfirmOpen,
    status,
    progress: useMemo(() => getProgressPercent(status), [status]),
    run,
  }
}
