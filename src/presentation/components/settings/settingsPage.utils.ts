import type {
  CalorieTagBatchDetails,
  IngredientLinkBatchDetails,
  RecipeSourceSyncBatchDetails,
} from "./settingsPage.types.ts"
export { buildRecipeAssetPayload } from "@/shared/utils/recipeAsset.ts"

export function normalizeReferenceIds(referenceIds: Array<string | null | undefined>) {
  const seen = new Set<string>()

  return referenceIds
    .filter((referenceId): referenceId is string => Boolean(referenceId))
    .filter((referenceId) => {
      if (seen.has(referenceId)) return false
      seen.add(referenceId)
      return true
    })
}

export function areReferenceListsEqual(left: Array<string | null | undefined>, right: Array<string | null | undefined>) {
  const normalizedLeft = normalizeReferenceIds(left)
  const normalizedRight = normalizeReferenceIds(right)

  if (normalizedLeft.length !== normalizedRight.length) return false

  return normalizedLeft.every((referenceId, index) => referenceId === normalizedRight[index])
}

export function parseCaloriesFromNutrition(value: unknown): number | null {
  if (typeof value !== "string") return null
  const match = value.match(/[\d.]+/)
  if (!match) return null
  const calories = Number(match[0])
  return Number.isFinite(calories) ? calories : null
}

export function createEmptyIngredientLinkBatchDetails(): IngredientLinkBatchDetails {
  return {
    errors: [],
    skippedNoIngredients: [],
    skippedNoInstructions: [],
  }
}

export function createEmptyCalorieTagBatchDetails(): CalorieTagBatchDetails {
  return {
    added: [],
    updated: [],
    missingCalories: [],
    skipped: [],
    errors: [],
  }
}

export function createEmptyRecipeSourceSyncBatchDetails(): RecipeSourceSyncBatchDetails {
  return {
    updated: [],
    skippedNoSource: [],
    skippedNoChanges: [],
    skippedDeclined: [],
    errors: [],
  }
}

export function getErrorStatusCode(error: unknown): number | null {
  if (
    typeof error === "object"
    && error !== null
    && "statusCode" in error
    && typeof error.statusCode === "number"
  ) {
    return error.statusCode
  }

  return null
}

export function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message.trim()
    ? error.message
    : fallback
}

export function buildIngredientLinkErrorDescription(error: unknown): string {
  const statusCode = getErrorStatusCode(error)
  if (statusCode === 400) {
    return "Cette recette semble invalide. Vous pouvez essayer de la supprimer puis de la reimporter."
  }

  return getErrorMessage(error, "Une erreur est survenue pendant l'analyse de cette recette.")
}

export function getIngredientLinkBatchDetailsCount(details: IngredientLinkBatchDetails): number {
  return details.errors.length + details.skippedNoInstructions.length + details.skippedNoIngredients.length
}

export function getCalorieTagBatchDetailsCount(details: CalorieTagBatchDetails): number {
  return details.added.length
    + details.updated.length
    + details.missingCalories.length
    + details.skipped.length
    + details.errors.length
}

export function getRecipeSourceSyncBatchDetailsCount(details: RecipeSourceSyncBatchDetails): number {
  return details.updated.length
    + details.skippedNoSource.length
    + details.skippedNoChanges.length
    + details.skippedDeclined.length
    + details.errors.length
}
