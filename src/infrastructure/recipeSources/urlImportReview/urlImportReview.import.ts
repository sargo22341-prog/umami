import {
  getCategoriesUseCase,
  getRecipeScrapePreviewUseCase,
  getTagsUseCase,
} from "../../container.ts"
import type { MealieRecipeScrapeOptions, MealieScrapedRecipePreview } from "@/shared/types/mealie/RecipeImport.ts"
import type { RecipeFormData } from "@/shared/types/mealie/Recipes.ts"
import { parseDuration } from "@/shared/utils/duration.ts"
import {
  normalizeNutritionValues,
  parseScrapedServings,
  resolveScrapedCategorySelections,
  resolveScrapedTagSelections,
} from "@/presentation/components/recipeDetail/recipeDetail.helpers.tsx"
import {
  analyzeRecipeIngredientOutputs,
  buildEmptyIngredient,
} from "./urlImportReview.ingredients.ts"

export function resolveScrapeOptions(options?: MealieRecipeScrapeOptions): Required<MealieRecipeScrapeOptions> {
  return {
    includeTags: options?.includeTags ?? true,
    includeCategories: options?.includeCategories ?? true,
    autoLinkIngredientsToInstructions: options?.autoLinkIngredientsToInstructions ?? true,
  }
}

function buildFormDataFromPreview(
  preview: MealieScrapedRecipePreview,
  url: string,
  scrapeOptions: Required<MealieRecipeScrapeOptions>,
  allTags: Awaited<ReturnType<typeof getTagsUseCase.execute>>,
  allCategories: Awaited<ReturnType<typeof getCategoriesUseCase.execute>>,
  analyzedIncomingIngredients: RecipeFormData["recipeIngredient"],
): RecipeFormData {
  const previewIngredientLines = preview.recipeIngredient ?? []
  const recipeIngredient =
    analyzedIncomingIngredients.length > 0
      ? analyzedIncomingIngredients.map((ingredient) => ({ ...ingredient }))
      : previewIngredientLines.length > 0
        ? previewIngredientLines.map((line) => ({
          quantity: "",
          unit: "",
          food: "",
          note: line,
        }))
        : [buildEmptyIngredient()]

  return {
    name: preview.name?.trim() || "",
    description: preview.description?.trim() ?? "",
    orgURL: url,
    prepTime: String(parseDuration(preview.prepTime) || ""),
    performTime: String(parseDuration(preview.cookTime) || ""),
    totalTime: String(parseDuration(preview.totalTime) || ""),
    recipeServings: parseScrapedServings(preview.recipeYield),
    nutrition: normalizeNutritionValues(preview.nutrition),
    recipeIngredient,
    recipeInstructions: (preview.recipeInstructions ?? []).length > 0
      ? (preview.recipeInstructions ?? []).map((step) => ({ text: step.text }))
      : [{ text: "" }],
    seasons: [],
    categories: scrapeOptions.includeCategories
      ? resolveScrapedCategorySelections(preview.recipeCategory ?? [], allCategories)
      : [],
    tags: scrapeOptions.includeTags
      ? resolveScrapedTagSelections(preview.tags ?? [], allTags)
      : [],
    tools: [],
  }
}

export async function importRecipeForReview(
  url: string,
  options?: MealieRecipeScrapeOptions,
): Promise<{
  preview: MealieScrapedRecipePreview
  formData: RecipeFormData
  analyzedIngredients: Awaited<ReturnType<typeof analyzeRecipeIngredientOutputs>>["analyzedIngredients"]
  availableUnits: Awaited<ReturnType<typeof analyzeRecipeIngredientOutputs>>["availableUnits"]
  availableFoods: Awaited<ReturnType<typeof analyzeRecipeIngredientOutputs>>["availableFoods"]
  scrapeOptions: Required<MealieRecipeScrapeOptions>
}> {
  const normalizedUrl = url.trim()
  if (!normalizedUrl) {
    throw new Error("URL invalide.")
  }

  const scrapeOptions = resolveScrapeOptions(options)
  const [preview, allTags, allCategories] = await Promise.all([
    getRecipeScrapePreviewUseCase.execute(normalizedUrl),
    getTagsUseCase.execute(),
    getCategoriesUseCase.execute(),
  ])

  const ingredientAnalysis = await analyzeRecipeIngredientOutputs(
    (preview.recipeIngredient ?? []).map((line) => ({ note: line })),
  )
  const analyzedIncomingIngredients = ingredientAnalysis.analyzedIngredients.map((item) => ({ ...item.parsed }))
  const formData = buildFormDataFromPreview(
    preview,
    normalizedUrl,
    scrapeOptions,
    allTags,
    allCategories,
    analyzedIncomingIngredients,
  )

  return {
    preview,
    formData,
    analyzedIngredients: ingredientAnalysis.analyzedIngredients,
    availableUnits: ingredientAnalysis.availableUnits,
    availableFoods: ingredientAnalysis.availableFoods,
    scrapeOptions,
  }
}
