export interface MealieRecipeScrapeOptions {
  includeTags?: boolean
  includeCategories?: boolean
  autoLinkIngredientsToInstructions?: boolean
}

export interface MealieScrapeRecipe extends MealieRecipeScrapeOptions {
  url: string
}

export interface MealieScrapeRecipeData extends MealieRecipeScrapeOptions {
  data: string
  url?: string | null
}

export interface MealieScrapeRecipeTest {
  url: string
  useOpenAI?: boolean
}

export type { ScrapedRecipeInstruction as MealieScrapedRecipeInstruction, ScrapedRecipePreview as MealieScrapedRecipePreview } from "../recipeImport.ts"
