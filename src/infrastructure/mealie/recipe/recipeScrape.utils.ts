// recipeScrape.utils.ts

import type { MealieScrapedRecipePreview } from "@/shared/types/mealie/RecipeImport.ts"
import type {
  ScrapedRecipeCategoryPreview,
  ScrapedRecipeTagPreview,
} from "@/shared/types/recipeImport.ts"

export interface ScrapedRecipeCandidate {
  "@type"?: string
  name?: string
  description?: string
  prepTime?: string
  cookTime?: string
  totalTime?: string
  recipeYield?: unknown
  recipeIngredient?: unknown[]
  recipeInstructions?: unknown[]
  nutrition?: Record<string, unknown>
  image?: unknown
  recipeCategory?: unknown
  tags?: unknown
}

function decodeHtmlEntities(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ""

  if (typeof document !== "undefined") {
    const textarea = document.createElement("textarea")
    let current = trimmed

    for (let index = 0; index < 3; index += 1) {
      textarea.innerHTML = current
      const decoded = textarea.value.replace(/\u00A0/g, " ").trim()
      if (decoded === current) return decoded
      current = decoded
    }

    return current
  }

  return trimmed
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .trim()
}

export function normalizeScrapedText(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined

  const normalized = decodeHtmlEntities(value)
  return normalized ? normalized : undefined
}

export function isScrapedRecipeCandidate(value: unknown): value is ScrapedRecipeCandidate {
  if (!value || typeof value !== "object") return false

  const candidate = value as ScrapedRecipeCandidate
  const hasRecipeType = candidate["@type"] === "Recipe"
  const hasName = typeof candidate.name === "string" && candidate.name.trim().length > 0
  const hasIngredients = Array.isArray(candidate.recipeIngredient) && candidate.recipeIngredient.length > 0
  const hasInstructions =
    Array.isArray(candidate.recipeInstructions) && candidate.recipeInstructions.length > 0

  return hasRecipeType || hasName || hasIngredients || hasInstructions
}

export function normalizeScrapedInstructions(value: unknown): { text: string }[] {
  if (!Array.isArray(value)) return []

  return value
    .map((entry) => {
      if (typeof entry === "string") {
        return { text: decodeHtmlEntities(entry) }
      }

      if (entry && typeof entry === "object" && typeof (entry as { text?: unknown }).text === "string") {
        return { text: decodeHtmlEntities((entry as { text: string }).text) }
      }

      return null
    })
    .filter((entry): entry is { text: string } => Boolean(entry?.text))
}

export function normalizeScrapedIngredients(value: unknown): string[] {
  if (!Array.isArray(value)) return []

  return value
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => decodeHtmlEntities(entry))
    .filter(Boolean)
}

export function normalizeRecipeYield(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .filter((entry): entry is string => typeof entry === "string")
      .map((entry) => decodeHtmlEntities(entry))
      .filter(Boolean)
  }

  if (typeof value === "string" && value.trim()) {
    return [decodeHtmlEntities(value)]
  }

  return []
}

export function normalizeNutrition(
  value: unknown,
): MealieScrapedRecipePreview["nutrition"] | undefined {
  if (!value || typeof value !== "object") return undefined

  const source = value as Record<string, unknown>

  const nutrition = {
    calories: normalizeScrapedText(source.calories),
    carbohydrateContent: normalizeScrapedText(source.carbohydrateContent),
    cholesterolContent: normalizeScrapedText(source.cholesterolContent),
    fatContent: normalizeScrapedText(source.fatContent),
    fiberContent: normalizeScrapedText(source.fiberContent),
    proteinContent: normalizeScrapedText(source.proteinContent),
    saturatedFatContent: normalizeScrapedText(source.saturatedFatContent),
    sodiumContent: normalizeScrapedText(source.sodiumContent),
    sugarContent: normalizeScrapedText(source.sugarContent),
    transFatContent: normalizeScrapedText(source.transFatContent),
    unsaturatedFatContent: normalizeScrapedText(source.unsaturatedFatContent),
  }

  return Object.values(nutrition).some(Boolean) ? nutrition : undefined
}

export function normalizeScrapedImages(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .filter((entry): entry is string => typeof entry === "string")
      .map((entry) => entry.trim())
      .filter(Boolean)
  }

  if (typeof value === "string" && value.trim()) {
    return [value.trim()]
  }

  return []
}

function slugifyPreviewName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function normalizePreviewTaxonomyEntry(
  value: unknown,
): ScrapedRecipeCategoryPreview | ScrapedRecipeTagPreview | null {
  if (typeof value === "string") {
    const name = decodeHtmlEntities(value)
    if (!name) return null

    return {
      name,
      slug: slugifyPreviewName(name),
    }
  }

  if (!value || typeof value !== "object") return null

  const entry = value as Record<string, unknown>
  const rawName = normalizeScrapedText(entry.name) ?? ""
  if (!rawName) return null

  const rawSlug = typeof entry.slug === "string" ? entry.slug.trim() : ""
  const rawId = typeof entry.id === "string" ? entry.id.trim() : ""
  const rawGroupId = typeof entry.groupId === "string" ? entry.groupId.trim() : ""

  return {
    id: rawId || undefined,
    groupId: rawGroupId || undefined,
    name: rawName,
    slug: rawSlug || slugifyPreviewName(rawName),
  }
}

export function normalizeScrapedCategories(value: unknown): ScrapedRecipeCategoryPreview[] {
  if (!Array.isArray(value)) return []

  const seen = new Set<string>()

  return value
    .map(normalizePreviewTaxonomyEntry)
    .filter((entry): entry is ScrapedRecipeCategoryPreview => Boolean(entry?.name))
    .filter((entry) => {
      const key = `${entry.slug ?? ""}::${entry.name.toLowerCase()}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
}

export function normalizeScrapedTags(value: unknown): ScrapedRecipeTagPreview[] {
  if (!Array.isArray(value)) return []

  const seen = new Set<string>()

  return value
    .map(normalizePreviewTaxonomyEntry)
    .filter((entry): entry is ScrapedRecipeTagPreview => Boolean(entry?.name))
    .filter((entry) => {
      const key = `${entry.slug ?? ""}::${entry.name.toLowerCase()}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
}
