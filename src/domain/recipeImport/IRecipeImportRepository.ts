import type {
  MealieRecipeScrapeOptions,
  MealieScrapedRecipePreview,
} from "@/shared/types/mealie/RecipeImport.ts"

export interface IRecipeImportRepository {
  testScrapeUrl(url: string): Promise<void>
  getScrapedRecipePreview(url: string): Promise<MealieScrapedRecipePreview>
  importRecipeByUrl(url: string, options?: MealieRecipeScrapeOptions): Promise<void>
  importRecipesByUrls(urls: string[], options?: MealieRecipeScrapeOptions): Promise<void>
}
