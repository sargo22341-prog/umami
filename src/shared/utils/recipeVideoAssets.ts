import type { MealieRecipeAsset } from "@/shared/types/mealie/Recipes.ts"

export type RecipeVideoChapter = {
  key: string
  label?: string
  stepIndex: number
  start: number
  end: number | null
}

export type RecipeVideoManifest = {
  version: number
  title: string
  source?: {
    type?: string
    name?: string
    url_ori?: string
    originalVideoUrl?: string
  }
  videoAsset: string
  chapters: RecipeVideoChapter[]
}

type RawRecipeVideoChapter = {
  key?: unknown
  label?: unknown
  stepId?: unknown
  stepIndex?: unknown
  start?: unknown
  end?: unknown
}

type RawRecipeVideoManifest = {
  version?: unknown
  title?: unknown
  source?: unknown
  videoAsset?: unknown
  chapters?: unknown
}

const VIDEO_EXTENSIONS = [".mp4", ".webm", ".mov", ".m4v", ".ogg", ".ogv"] as const
const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp", ".avif"] as const
const JSON_BASE_SUFFIX_PATTERN = /(?:-chapters)?$/i
const STEP_IMAGE_PATTERN = /^step-(\d+)\.[a-z0-9]+$/i

function stripFileExtension(value: string): string {
  return value.replace(/\.[^.]+$/, "")
}

function parseChapterStepIndex(value: unknown): number | null {
  if (value === -1 || value === "-1") return -1

  const numericValue = Number(value)
  return Number.isFinite(numericValue) ? numericValue : null
}

export function normalizeAssetBaseName(value: string): string {
  return stripFileExtension(value).trim().toLowerCase().replace(JSON_BASE_SUFFIX_PATTERN, "")
}

export function getRecipeAssetMediaUrl(recipeId: string, fileName: string): string {
  return `/api/media/recipes/${recipeId}/assets/${encodeURIComponent(fileName)}`
}

export function isVideoRecipeAsset(asset: MealieRecipeAsset): boolean {
  const fileName = asset.fileName?.toLowerCase()
  return Boolean(fileName && VIDEO_EXTENSIONS.some((extension) => fileName.endsWith(extension)))
}

export function isJsonRecipeAsset(asset: MealieRecipeAsset): boolean {
  return asset.fileName?.toLowerCase().endsWith(".json") ?? false
}

export function isImageRecipeAsset(asset: MealieRecipeAsset): boolean {
  const fileName = asset.fileName?.toLowerCase()
  return Boolean(fileName && IMAGE_EXTENSIONS.some((extension) => fileName.endsWith(extension)))
}

export function parseStepImageAssetIndex(fileName?: string | null): number | null {
  const normalizedFileName = fileName?.trim().toLowerCase()
  if (!normalizedFileName) return null

  const match = normalizedFileName.match(STEP_IMAGE_PATTERN)
  if (!match) return null

  const stepIndex = Number(match[1])
  return Number.isInteger(stepIndex) && stepIndex >= 0 ? stepIndex : null
}

export function isStepImageRecipeAsset(asset: MealieRecipeAsset): boolean {
  return isImageRecipeAsset(asset) && parseStepImageAssetIndex(asset.fileName) != null
}

export function findRecipeStepImageAsset(assets: MealieRecipeAsset[] = [], stepIndex: number) {
  return assets.find((asset) => parseStepImageAssetIndex(asset.fileName) === stepIndex) ?? null
}

export function getRecipeStepImageAssets(assets: MealieRecipeAsset[] = []) {
  return assets.filter(isImageRecipeAsset).map((asset) => ({
    asset,
    stepIndex: parseStepImageAssetIndex(asset.fileName),
  }))
}

export function findRecipeVideoAsset(assets: MealieRecipeAsset[] = []) {
  return assets.find(isVideoRecipeAsset) ?? null
}

export function findRecipeVideoAssetPair(assets: MealieRecipeAsset[] = []) {
  const videoAssets = assets.filter(isVideoRecipeAsset)
  const jsonAssets = assets.filter(isJsonRecipeAsset)

  for (const videoAsset of videoAssets) {
    const videoFileName = videoAsset.fileName
    if (!videoFileName) continue

    const normalizedVideoBaseName = normalizeAssetBaseName(videoFileName)
    const matchingJsonAsset = jsonAssets.find((jsonAsset) => {
      const jsonFileName = jsonAsset.fileName
      if (!jsonFileName) return false

      return normalizeAssetBaseName(jsonFileName) === normalizedVideoBaseName
    })

    if (matchingJsonAsset?.fileName) {
      return {
        videoAsset,
        jsonAsset: matchingJsonAsset,
      }
    }
  }

  return null
}

export function buildRecipeVideoJsonFileName(videoFileName: string): string {
  return `${normalizeAssetBaseName(videoFileName)}-chapters.json`
}

export function parseRecipeVideoManifest(payload: unknown): RecipeVideoManifest | null {
  const manifest = payload as RawRecipeVideoManifest
  if (!Array.isArray(manifest.chapters) || typeof manifest.videoAsset !== "string") {
    return null
  }

  const chapters = manifest.chapters
    .map((chapter, index): RecipeVideoChapter | null => {
      const rawChapter = chapter as RawRecipeVideoChapter
      const start = Number(rawChapter.start)
      const stepIndex = parseChapterStepIndex(rawChapter.stepIndex ?? rawChapter.stepId)
      const rawEnd = rawChapter.end
      const end = rawEnd == null || rawEnd === "" ? null : Number(rawEnd)

      if (!Number.isFinite(start) || stepIndex == null) {
        return null
      }

      if (end != null && !Number.isFinite(end)) {
        return null
      }

      return {
        key: typeof rawChapter.key === "string" ? rawChapter.key : `chapter-${index}`,
        label:
          typeof rawChapter.label === "string"
            ? rawChapter.label
            : stepIndex === -1
              ? "Ingredients"
              : `Etape ${stepIndex + 1}`,
        stepIndex,
        start,
        end,
      }
    })
    .filter((chapter): chapter is RecipeVideoChapter => chapter !== null)
    .sort((left, right) => left.start - right.start)

  if (chapters.length === 0) return null

  return {
    version: Number(manifest.version) || 1,
    title: typeof manifest.title === "string" ? manifest.title : "",
    source:
      manifest.source && typeof manifest.source === "object"
        ? (manifest.source as RecipeVideoManifest["source"])
        : undefined,
    videoAsset: manifest.videoAsset,
    chapters,
  }
}

export function slugifyRecipeVideoBaseName(value: string): string {
  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

  return normalized || "recipe-video"
}
