// RecipeImportRepository.ts

import type { IRecipeImportRepository } from "@/domain/recipeImport/IRecipeImportRepository.ts"
import type {
  MealieRecipeScrapeOptions,
  MealieScrapedRecipePreview,
} from "@/shared/types/mealie/RecipeImport.ts"
import { mealieApiClient } from "../api/index.ts"
import {
  normalizeScrapedCategories,
  normalizeScrapedText,
  normalizeNutrition,
  normalizeRecipeYield,
  normalizeScrapedImages,
  normalizeScrapedIngredients,
  normalizeScrapedInstructions,
  normalizeScrapedTags,
} from "../recipe/recipeScrape.utils.ts"
import { fetchMealieScrapeSourceSchema } from "./mealieScrapeSourceSchema.ts"

const DEFAULT_SCRAPE_OPTIONS: Required<MealieRecipeScrapeOptions> = {
  includeTags: true,
  includeCategories: true,
  autoLinkIngredientsToInstructions: true,
}

function resolveScrapeOptions(options?: MealieRecipeScrapeOptions): Required<MealieRecipeScrapeOptions> {
  return {
    includeTags: options?.includeTags ?? DEFAULT_SCRAPE_OPTIONS.includeTags,
    includeCategories: options?.includeCategories ?? DEFAULT_SCRAPE_OPTIONS.includeCategories,
    autoLinkIngredientsToInstructions:
      options?.autoLinkIngredientsToInstructions ?? DEFAULT_SCRAPE_OPTIONS.autoLinkIngredientsToInstructions,
  }
}

export class RecipeImportRepository implements IRecipeImportRepository {
  async testScrapeUrl(url: string): Promise<void> {
    await this.getScrapedRecipePreview(url)
  }

  async getScrapedRecipePreview(url: string): Promise<MealieScrapedRecipePreview> {
    const candidate = await fetchMealieScrapeSourceSchema(url)

    const normalizedCategories = normalizeScrapedCategories(candidate.recipeCategory)
    const normalizedTags = normalizeScrapedTags(candidate.tags)

    return {
      name: normalizeScrapedText(candidate.name),
      description: normalizeScrapedText(candidate.description),
      prepTime: normalizeScrapedText(candidate.prepTime),
      cookTime: normalizeScrapedText(candidate.cookTime),
      totalTime: normalizeScrapedText(candidate.totalTime),
      recipeYield: normalizeRecipeYield(candidate.recipeYield),
      recipeIngredient: normalizeScrapedIngredients(candidate.recipeIngredient),
      recipeInstructions: normalizeScrapedInstructions(candidate.recipeInstructions),
      nutrition: normalizeNutrition(candidate.nutrition),
      image: normalizeScrapedImages(candidate.image),
      recipeCategory: normalizedCategories.length > 0 ? normalizedCategories : undefined,
      tags: normalizedTags.length > 0 ? normalizedTags : undefined,
    }
  }

  async importRecipeByUrl(url: string, options?: MealieRecipeScrapeOptions): Promise<void> {
    const resolvedOptions = resolveScrapeOptions(options)
    await mealieApiClient.post("/api/recipes/create/url", {
      url,
      includeTags: resolvedOptions.includeTags,
      includeCategories: resolvedOptions.includeCategories,
    })
  }

  async importRecipesByUrls(urls: string[], options?: MealieRecipeScrapeOptions): Promise<void> {
    const resolvedOptions = resolveScrapeOptions(options)
    await mealieApiClient.post("/api/recipes/create/url/bulk", {
      imports: urls.map((url) => ({
        url,
        includeTags: resolvedOptions.includeTags,
        includeCategories: resolvedOptions.includeCategories,
      })),
    })
  }
}
