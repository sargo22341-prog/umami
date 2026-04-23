import type { MealieRecipeScrapeOptions, MealieScrapedRecipePreview } from "@/shared/types/mealie/RecipeImport.ts"
import type {
  MealieRecipeOutput,
  RecipeFormData,
  RecipeFormIngredient,
} from "@/shared/types/mealie/Recipes.ts"
import type { MealieIngredientFoodOutput } from "@/shared/types/mealie/food.ts"
import type { MealieIngredientUnitOutput } from "@/shared/types/mealie/Units.ts"

export interface IngredientMealieMatch<TItem> {
  item: TItem
  via: string
  strategy: "id" | "exact" | "singular" | "fuzzy"
}

export interface AnalyzedIngredient {
  id: string
  raw: string
  sourceFood: string
  parsed: RecipeFormIngredient
  unitMatch?: IngredientMealieMatch<MealieIngredientUnitOutput>
  foodMatch?: IngredientMealieMatch<MealieIngredientFoodOutput>
}

export interface UrlImportReviewDraft {
  url: string
  scrapeOptions: Required<MealieRecipeScrapeOptions>
  preview: MealieScrapedRecipePreview
  recipe?: MealieRecipeOutput
  formData: RecipeFormData
  analyzedIngredients: AnalyzedIngredient[]
  availableUnits: MealieIngredientUnitOutput[]
  availableFoods: MealieIngredientFoodOutput[]
}
