import { getRecipeScrapePreviewUseCase } from "@/infrastructure/container.ts"
import { analyzeRecipeIngredientOutputs } from "@/infrastructure/recipeSources/urlImportReviewService.ts"
import type { MealieRecipeCategory } from "@/shared/types/mealie/Category.ts"
import type { MealieScrapedRecipePreview } from "@/shared/types/mealie/RecipeImport.ts"
import type {
  MealieRecipeIngredientOutput,
  RecipeFormData,
  RecipeFormIngredient,
} from "@/shared/types/mealie/Recipes.ts"
import type { MealieRecipeTag } from "@/shared/types/mealie/Tags.ts"
import { parseDuration } from "@/shared/utils/duration.ts"
import {
  buildRecipeSyncFields,
  normalizeNutritionValues,
  parseScrapedServings,
  resolveScrapedCategorySelections,
  resolveScrapedTagSelections,
} from "components/recipeDetail/recipeDetail.helpers.tsx"

export type RecipeSyncAnalysisResult = {
  scrapedPreview: MealieScrapedRecipePreview
  analyzedIncomingIngredients: RecipeFormIngredient[]
  changedFieldIds: string[]
}

export async function analyzeRecipeSyncSource(
  sourceUrl: string,
  formData: RecipeFormData,
): Promise<RecipeSyncAnalysisResult> {
  const scrapedPreview = await getRecipeScrapePreviewUseCase.execute(sourceUrl)
  const previewIngredients = scrapedPreview.recipeIngredient ?? []
  const analyzedIngredients = previewIngredients.length > 0
    ? await analyzeRecipeIngredientOutputs(
      previewIngredients.map((line): MealieRecipeIngredientOutput => ({ note: line })),
    )
    : null

  const analyzedIncomingIngredients =
    analyzedIngredients?.analyzedIngredients.map((item) => ({ ...item.parsed })) ?? []

  const changedFieldIds = buildRecipeSyncFields(formData, scrapedPreview, analyzedIncomingIngredients)
    .filter((field) => field.changed)
    .map((field) => field.id)

  return {
    scrapedPreview,
    analyzedIncomingIngredients,
    changedFieldIds,
  }
}

interface BuildSyncedRecipeFormDataParams {
  formData: RecipeFormData
  scrapedPreview: MealieScrapedRecipePreview
  analyzedIncomingIngredients: RecipeFormIngredient[]
  selectedFieldIds: string[]
  allTags: MealieRecipeTag[]
  allCategories: MealieRecipeCategory[]
}

export function buildSyncedRecipeFormData({
  formData,
  scrapedPreview,
  analyzedIncomingIngredients,
  selectedFieldIds,
  allTags,
  allCategories,
}: BuildSyncedRecipeFormDataParams): RecipeFormData {
  const nextFormData: RecipeFormData = {
    ...formData,
    nutrition: { ...formData.nutrition },
    recipeIngredient: [...formData.recipeIngredient],
    recipeInstructions: [...formData.recipeInstructions],
  }

  if (selectedFieldIds.includes("name") && scrapedPreview.name?.trim()) {
    nextFormData.name = scrapedPreview.name.trim()
  }
  if (selectedFieldIds.includes("description")) {
    nextFormData.description = scrapedPreview.description?.trim() ?? ""
  }
  if (selectedFieldIds.includes("prepTime")) {
    nextFormData.prepTime = String(parseDuration(scrapedPreview.prepTime) || "")
  }
  if (selectedFieldIds.includes("performTime")) {
    nextFormData.performTime = String(parseDuration(scrapedPreview.cookTime) || "")
  }
  if (selectedFieldIds.includes("totalTime")) {
    nextFormData.totalTime = String(parseDuration(scrapedPreview.totalTime) || "")
  }
  if (selectedFieldIds.includes("recipeServings")) {
    nextFormData.recipeServings = parseScrapedServings(scrapedPreview.recipeYield)
  }
  if (selectedFieldIds.includes("ingredients")) {
    const scrapedIngredients = scrapedPreview.recipeIngredient ?? []
    nextFormData.recipeIngredient =
      analyzedIncomingIngredients.length > 0
        ? analyzedIncomingIngredients.map((ingredient) => ({ ...ingredient }))
        : scrapedIngredients.length > 0
          ? scrapedIngredients.map((line) => ({
            quantity: "",
            unit: "",
            food: "",
            note: line,
          }))
          : [{ quantity: "1", unit: "", food: "", note: "" }]
  }
  if (selectedFieldIds.includes("instructions")) {
    const scrapedInstructions = scrapedPreview.recipeInstructions ?? []
    nextFormData.recipeInstructions =
      scrapedInstructions.length > 0
        ? scrapedInstructions.map((step) => ({ text: step.text }))
        : [{ text: "" }]
  }
  if (selectedFieldIds.includes("nutrition")) {
    nextFormData.nutrition = normalizeNutritionValues(scrapedPreview.nutrition)
  }
  if (selectedFieldIds.includes("tags")) {
    nextFormData.tags = resolveScrapedTagSelections(scrapedPreview.tags ?? [], allTags)
  }
  if (selectedFieldIds.includes("categories")) {
    nextFormData.categories = resolveScrapedCategorySelections(
      scrapedPreview.recipeCategory ?? [],
      allCategories,
    )
  }

  return nextFormData
}
