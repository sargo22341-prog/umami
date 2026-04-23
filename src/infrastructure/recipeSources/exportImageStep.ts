import { fetchMealieScrapeSourceSchema } from "../mealie/recipeImport/mealieScrapeSourceSchema.ts"
import { buildRemoteAssetProxyUrl } from "./providers/shared/remoteRecipeSourceApi.ts"
import { collectInstructionImageMappings, findRecipeObject } from "./schemaOrg/recipeSchema.ts"

export interface ExportImageStepItem {
  id: string
  stepIndex: number
  imageUrl: string
  file: File
  instructionText: string
}

export interface ExportImageStepResult {
  items: ExportImageStepItem[]
  sourceUrl: string
}

function inferFileExtension(imageUrl: string, contentType: string): string {
  const normalizedType = contentType.toLowerCase()
  if (normalizedType.includes("png")) return "png"
  if (normalizedType.includes("webp")) return "webp"
  if (normalizedType.includes("gif")) return "gif"
  if (normalizedType.includes("avif")) return "avif"
  if (normalizedType.includes("bmp")) return "bmp"
  if (normalizedType.includes("jpeg") || normalizedType.includes("jpg")) return "jpg"

  try {
    const pathname = new URL(imageUrl).pathname.toLowerCase()
    const extension = pathname.match(/\.([a-z0-9]+)$/i)?.[1]
    return extension || "jpg"
  } catch {
    return "jpg"
  }
}

function isSupportedImageContentType(contentType: string): boolean {
  return contentType.toLowerCase().startsWith("image/")
}

async function downloadStepImage(stepIndex: number, imageUrl: string, instructionText: string) {
  const response = await fetch(buildRemoteAssetProxyUrl(imageUrl))
  if (!response.ok) {
    throw new Error(`Impossible de telecharger l'image de l'etape ${stepIndex}.`)
  }

  const blob = await response.blob()
  if (!isSupportedImageContentType(blob.type || "")) {
    throw new Error(`La ressource de l'etape ${stepIndex} n'est pas une image exploitable.`)
  }

  const extension = inferFileExtension(imageUrl, blob.type || "")
  const file = new File([blob], `step-${stepIndex}-source.${extension}`, {
    type: blob.type || "image/jpeg",
    lastModified: Date.now(),
  })

  return {
    id: `step-${stepIndex}-${imageUrl}`,
    stepIndex,
    imageUrl,
    file,
    instructionText,
  }
}

export async function exportImageStep(sourceUrl: string): Promise<ExportImageStepResult> {
  const normalizedUrl = sourceUrl.trim()
  if (!normalizedUrl) {
    return {
      items: [],
      sourceUrl: normalizedUrl,
    }
  }

  let schema
  try {
    schema = await fetchMealieScrapeSourceSchema(normalizedUrl)
  } catch (error) {
    // On garde une UX souple dans la popup: une source sans schema exploitable
    // ne doit pas faire planter l'ecran ni interrompre le workflow.
    if (error instanceof Error) {
      console.warn("[exportImageStep] Schema indisponible:", error.message)
    }

    return {
      items: [],
      sourceUrl: normalizedUrl,
    }
  }

  const recipeObject = findRecipeObject(schema)
  if (!recipeObject) {
    return {
      items: [],
      sourceUrl: normalizedUrl,
    }
  }

  const mappings = collectInstructionImageMappings(recipeObject.recipeInstructions, normalizedUrl)
  if (mappings.length === 0) {
    return {
      items: [],
      sourceUrl: normalizedUrl,
    }
  }

  const downloads = await Promise.allSettled(
    mappings.map((mapping) => downloadStepImage(mapping.stepIndex, mapping.imageUrl, mapping.instructionText)),
  )

  return {
    items: downloads
      .filter((result): result is PromiseFulfilledResult<ExportImageStepItem> => result.status === "fulfilled")
      .map((result) => result.value),
    sourceUrl: normalizedUrl,
  }
}
