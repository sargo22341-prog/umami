import { createRecipeUseCase, updateFoodUseCase } from "../container.ts"
import type { MealieRecipeScrapeOptions } from "@/shared/types/mealie/RecipeImport.ts"
import type { MealieRecipeOutput, RecipeFormIngredient } from "@/shared/types/mealie/Recipes.ts"
import type { MealieIngredientFoodOutput } from "@/shared/types/mealie/food.ts"
import {
  buildFoodAliasesWithAddition,
} from "@/shared/utils/ingredientMatching.ts"
import { buildAutoLinkedRecipeFormData } from "@/shared/utils/recipeInstructionIngredientLinks.ts"
import { buildRemoteAssetProxyUrl } from "./providers/shared/remoteRecipeSourceApi.ts"
import {
  analyzeRecipeIngredientOutputs,
  buildEmptyIngredient,
} from "./urlImportReview/urlImportReview.ingredients.ts"
import { findExistingRecipeForSource } from "./recipeDuplicateDetectionService.ts"
import { importRecipeForReview } from "./urlImportReview/urlImportReview.import.ts"
import type { UrlImportReviewDraft } from "./urlImportReview/urlImportReview.types.ts"
import { updateCachedFood } from "./urlImportReview/urlImportReview.cache.ts"

export type { AnalyzedIngredient, IngredientMealieMatch, UrlImportReviewDraft } from "./urlImportReview/urlImportReview.types.ts"
export { analyzeRecipeIngredientOutputs }

function resolveImageExtension(imageUrl: string, contentType: string): string {
  const extensionFromContentType = contentType.split("/")[1]?.split(";")[0]?.trim().toLowerCase()
  if (extensionFromContentType) {
    return extensionFromContentType === "jpeg" ? "jpg" : extensionFromContentType
  }

  try {
    const pathname = new URL(imageUrl).pathname
    const extensionFromUrl = pathname.match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase()
    return extensionFromUrl ?? "jpg"
  } catch {
    return "jpg"
  }
}

async function buildPreviewImageFile(draft: UrlImportReviewDraft): Promise<File | undefined> {
  const imageUrl = draft.preview.image?.find((candidate) => candidate.trim())?.trim()
  if (!imageUrl) return undefined

  const response = await fetch(buildRemoteAssetProxyUrl(imageUrl))
  if (!response.ok) return undefined

  const blob = await response.blob()
  const extension = resolveImageExtension(imageUrl, blob.type)
  return new File([blob], `source-image.${extension}`, {
    type: blob.type || `image/${extension}`,
  })
}

export async function prepareUrlImportReview(
  url: string,
  options?: MealieRecipeScrapeOptions,
): Promise<UrlImportReviewDraft> {
  const normalizedUrl = url.trim()
  const {
    preview,
    formData,
    analyzedIngredients,
    availableUnits,
    availableFoods,
    scrapeOptions,
  } = await importRecipeForReview(normalizedUrl, options)

  return {
    url: normalizedUrl,
    scrapeOptions,
    preview,
    formData,
    analyzedIngredients,
    availableUnits,
    availableFoods,
  }
}

export async function saveReviewedUrlImportRecipe(
  draft: UrlImportReviewDraft,
  ingredients: RecipeFormIngredient[],
): Promise<MealieRecipeOutput> {
  const duplicateCheck = await findExistingRecipeForSource({
    sourceUrl: draft.url,
    name: draft.formData.name,
  })
  if (duplicateCheck.match?.reason === "source_url") {
    throw new Error(duplicateCheck.match.message)
  }

  const nextIngredients = ingredients.length > 0 ? ingredients : [buildEmptyIngredient()]
  const nextFormData = {
    ...draft.formData,
    recipeIngredient: nextIngredients,
  }
  const foodsById = new Map(draft.availableFoods.map((food) => [food.id, food]))
  const finalFormData = draft.scrapeOptions.autoLinkIngredientsToInstructions
    ? buildAutoLinkedRecipeFormData(nextFormData, foodsById).formData
    : nextFormData
  const imageFile = await buildPreviewImageFile(draft).catch(() => undefined)

  return createRecipeUseCase.execute({
    ...finalFormData,
    imageFile,
  })
}

export async function addFoodAliasToMealieFood(
  food: MealieIngredientFoodOutput,
  aliasName: string,
): Promise<MealieIngredientFoodOutput> {
  const updatedFood = await updateFoodUseCase.execute(food.id, {
    name: food.name,
    pluralName: food.pluralName ?? null,
    description: food.description ?? "",
    labelId: food.labelId ?? null,
    aliases: buildFoodAliasesWithAddition(food, aliasName),
    householdsWithIngredientFood: food.householdsWithIngredientFood ?? [],
    extras: food.extras ?? null,
  })

  updateCachedFood(updatedFood)

  return updatedFood
}

export async function enrichFoodWithPluralForm(
  food: MealieIngredientFoodOutput,
  pluralForm: string,
): Promise<{ updatedFood: MealieIngredientFoodOutput; mode: "pluralName" | "alias" }> {
  const normalizedPluralForm = pluralForm.trim().replace(/\s+/g, " ")
  const hasPluralName = Boolean(food.pluralName?.trim())

  const updatedFood = await updateFoodUseCase.execute(food.id, {
    name: food.name,
    pluralName: hasPluralName ? food.pluralName ?? null : normalizedPluralForm,
    description: food.description ?? "",
    labelId: food.labelId ?? null,
    aliases: hasPluralName ? buildFoodAliasesWithAddition(food, normalizedPluralForm) : (food.aliases ?? []),
    householdsWithIngredientFood: food.householdsWithIngredientFood ?? [],
    extras: food.extras ?? null,
  })

  updateCachedFood(updatedFood)

  return {
    updatedFood,
    mode: hasPluralName ? "alias" : "pluralName",
  }
}
