import {
  slugifyRecipeVideoBaseName,
  type RecipeVideoManifest,
} from "@/shared/utils/recipeVideoAssets.ts"
import {
  collectInstructionImageMappings,
  extractSchemaAssetUrl,
  findRecipeObject,
} from "../../schemaOrg/recipeSchema.ts"

type JsonLdValue = Record<string, unknown> | Array<Record<string, unknown>> | null | undefined

interface JowVideoImportResult {
  title: string
  videoUrl: string
  videoFileName: string
  chaptersFileName: string
  manifest: RecipeVideoManifest
}

type JowVideoImportFailureReason = "invalid_schema" | "no_video" | "no_chapters"

export type JowVideoImportParseResult =
  | {
    status: "success"
    data: JowVideoImportResult
  }
  | {
    status: "unsupported"
    reason: JowVideoImportFailureReason
    message: string
  }

function asArray<T>(value: T | T[] | null | undefined): T[] {
  if (Array.isArray(value)) return value
  return value == null ? [] : [value]
}

function extractTimeFromMediaUrl(value?: string | null): number | null {
  if (!value) return null

  const hashMatch = value.match(/#t=([\d.]+)/i)
  if (hashMatch) {
    const parsed = Number(hashMatch[1])
    return Number.isFinite(parsed) ? parsed : null
  }

  const queryMatch = value.match(/[?&]t=([\d.]+)/i)
  if (queryMatch) {
    const parsed = Number(queryMatch[1])
    return Number.isFinite(parsed) ? parsed : null
  }

  return null
}

function stripMediaFragment(url: string): string {
  return url.replace(/([#?])t=[\d.]+$/i, "")
}

function roundTenth(value: number): number {
  return Math.round(value * 10) / 10
}

function getVideoExtension(videoUrl: string): string {
  try {
    const pathname = new URL(videoUrl).pathname
    const extension = pathname.match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase()
    return extension ?? "mp4"
  } catch {
    return "mp4"
  }
}

function getFirstVideoContentUrl(videoValue: JsonLdValue, sourceUrl: string): string | null {
  for (const videoEntry of asArray(videoValue)) {
    const contentUrl = extractSchemaAssetUrl(videoEntry, sourceUrl)
    if (contentUrl) {
      return stripMediaFragment(contentUrl)
    }
  }

  return null
}

function buildStepChapters(recipeInstructions: JsonLdValue, sourceUrl: string) {
  const starts = collectInstructionImageMappings(recipeInstructions, sourceUrl)
    .map((step) => {
      const start = extractTimeFromMediaUrl(step.imageUrl)
      if (start == null) return null

      return {
        key: `step-${step.stepIndex}`,
        stepIndex: step.stepIndex - 1,
        start: roundTenth(start),
      }
    })
    .filter((chapter): chapter is { key: string; stepIndex: number; start: number } => chapter !== null)
    .sort((left, right) => left.start - right.start)

  if (starts.length === 0) {
    return []
  }

  const ingredientEnd = roundTenth(Math.max(0, starts[0].start - 0.3))
  const chapters: RecipeVideoManifest["chapters"] = [
    {
      key: "ingredients",
      stepIndex: -1,
      start: 0,
      end: ingredientEnd,
    },
  ]

  for (let index = 0; index < starts.length; index += 1) {
    const current = starts[index]
    const next = starts[index + 1]
    chapters.push({
      key: current.key,
      stepIndex: current.stepIndex,
      start: current.start,
      end: next ? roundTenth(Math.max(current.start, next.start - 0.3)) : null,
    })
  }

  return chapters
}

export function isJowRecipeUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return /(^|\.)jow\.fr$/i.test(parsed.hostname) && parsed.pathname.startsWith("/recipes/")
  } catch {
    return false
  }
}

export function parseJowRecipeVideoImport(schema: unknown, sourceUrl: string): JowVideoImportParseResult {
  const recipeObject = findRecipeObject(schema)
  if (!recipeObject) {
    return {
      status: "unsupported",
      reason: "invalid_schema",
      message: "Le schema source est invalide.",
    }
  }

  const recipe = recipeObject as {
    name?: unknown
    video?: JsonLdValue
    recipeInstructions?: JsonLdValue
  }

  const title = typeof recipe.name === "string" ? recipe.name.trim() : ""
  const videoUrl = getFirstVideoContentUrl(recipe.video, sourceUrl)
  if (!title) {
    return {
      status: "unsupported",
      reason: "invalid_schema",
      message: "Le schema source est invalide.",
    }
  }

  if (!videoUrl) {
    return {
      status: "unsupported",
      reason: "no_video",
      message: "Cette recette source ne contient pas de vidéo.",
    }
  }

  const chapters = buildStepChapters(recipe.recipeInstructions, sourceUrl)
  if (chapters.length === 0) {
    return {
      status: "unsupported",
      reason: "no_chapters",
      message: "La vidéo source ne contient pas de chapitres exploitables.",
    }
  }

  const assetBaseName = slugifyRecipeVideoBaseName(title)
  const videoFileName = `${assetBaseName}.${getVideoExtension(videoUrl)}`
  const chaptersFileName = `${assetBaseName}-chapters.json`

  return {
    status: "success",
    data: {
      title,
      videoUrl,
      videoFileName,
      chaptersFileName,
      manifest: {
        version: 1,
        title,
        source: {
          type: "schema.org/Recipe",
          name: title,
          url_ori: sourceUrl,
          originalVideoUrl: videoUrl,
        },
        videoAsset: videoFileName,
        chapters,
      },
    },
  }
}
