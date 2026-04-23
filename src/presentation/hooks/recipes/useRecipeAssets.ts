import { useCallback, useMemo, useState } from "react"
import { getRecipeUseCase } from "@/infrastructure/container.ts"
import { mealieApiClient } from "@/infrastructure/mealie/api/index.ts"
import type { MealieRecipeAsset, MealieRecipeOutput } from "@/shared/types/mealie/Recipes.ts"
import { buildRecipeAssetPayload } from "@/shared/utils/recipeAsset.ts"
import type { RecipeVideoManifest } from "@/shared/utils/recipeVideoAssets.ts"

export function useRecipeAssets(
  slug: string | undefined,
  initialAssets: MealieRecipeAsset[] = [],
) {
  const [assets, setAssets] = useState<MealieRecipeAsset[]>(initialAssets)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [savingJson, setSavingJson] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sortedAssets = useMemo(
    () => [...assets].sort((left, right) => left.name.localeCompare(right.name, "fr")),
    [assets],
  )

  const loadAssets = useCallback(async (): Promise<MealieRecipeOutput | null> => {
    if (!slug) return null

    setLoading(true)
    setError(null)

    try {
      const recipe = await getRecipeUseCase.execute(slug)
      setAssets(recipe.assets ?? [])
      return recipe
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de charger les assets.")
      return null
    } finally {
      setLoading(false)
    }
  }, [slug])

  const uploadAssets = useCallback(async (
    files: {
      videoFile?: File | null
      jsonFile?: File | null
      imageFiles?: File[]
    },
  ): Promise<MealieRecipeOutput | null> => {
    if (!slug) return null

    const pendingFiles = [
      files.videoFile,
      files.jsonFile,
      ...(files.imageFiles ?? []),
    ].filter((file): file is File => Boolean(file))
    if (pendingFiles.length === 0) {
      setError("Choisissez au moins un fichier à envoyer.")
      return null
    }

    setUploading(true)
    setError(null)

    try {
      for (const file of pendingFiles) {
        await mealieApiClient.uploadRecipeAsset(slug, buildRecipeAssetPayload(file))
      }

      return await loadAssets()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible d'envoyer les assets.")
      return null
    } finally {
      setUploading(false)
    }
  }, [loadAssets, slug])

  const saveJsonAsset = useCallback(async (
    jsonFileName: string,
    manifest: RecipeVideoManifest,
  ): Promise<MealieRecipeOutput | null> => {
    if (!slug) return null

    setSavingJson(true)
    setError(null)

    try {
      const jsonFile = new File(
        [JSON.stringify(manifest, null, 2)],
        jsonFileName,
        { type: "application/json" },
      )

      await mealieApiClient.uploadRecipeAsset(slug, buildRecipeAssetPayload(jsonFile))

      return await loadAssets()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de sauvegarder le JSON des chapitres.")
      return null
    } finally {
      setSavingJson(false)
    }
  }, [loadAssets, slug])

  return {
    assets: sortedAssets,
    loading,
    uploading,
    savingJson,
    error,
    loadAssets,
    uploadAssets,
    saveJsonAsset,
  }
}
