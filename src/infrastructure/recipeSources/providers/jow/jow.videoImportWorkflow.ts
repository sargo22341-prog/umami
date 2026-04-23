import type { MealieRecipeOutput } from "@/shared/types/mealie/Recipes.ts"
import { fetchMealieScrapeSourceSchema } from "@/infrastructure/mealie/recipeImport/mealieScrapeSourceSchema.ts"
import { buildRemoteAssetProxyUrl } from "../shared/remoteRecipeSourceApi.ts"
import { isJowRecipeUrl, parseJowRecipeVideoImport } from "./jow.videoImport.ts"

export async function fetchJowVideoImportDraft(recipe: Pick<MealieRecipeOutput, "orgURL">) {
  const sourceUrl = recipe.orgURL?.trim() ?? ""
  if (!isJowRecipeUrl(sourceUrl)) {
    throw new Error("L'import video automatique est disponible uniquement pour les recettes Jow.")
  }

  const schema = await fetchMealieScrapeSourceSchema(sourceUrl)
  return parseJowRecipeVideoImport(schema, sourceUrl)
}

export async function buildJowVideoImportPayload(recipe: Pick<MealieRecipeOutput, "orgURL">) {
  const parsedImport = await fetchJowVideoImportDraft(recipe)
  if (parsedImport.status !== "success") {
    return parsedImport
  }

  const videoResponse = await fetch(buildRemoteAssetProxyUrl(parsedImport.data.videoUrl))
  if (!videoResponse.ok) {
    throw new Error("Impossible de telecharger la video distante.")
  }

  const videoBlob = await videoResponse.blob()
  const videoType = videoBlob.type || "video/mp4"
  const videoFile = new File([videoBlob], parsedImport.data.videoFileName, {
    type: videoType,
  })
  const jsonFile = new File(
    [JSON.stringify(parsedImport.data.manifest, null, 2)],
    parsedImport.data.chaptersFileName,
    { type: "application/json" },
  )

  return {
    status: "success" as const,
    manifest: parsedImport.data.manifest,
    chaptersFileName: parsedImport.data.chaptersFileName,
    videoFile,
    jsonFile,
  }
}
