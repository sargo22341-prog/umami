import type { IRecipeImportRepository } from "@/domain/recipeImport/IRecipeImportRepository.ts"
import type { MealieScrapedRecipePreview } from "@/shared/types/mealie/RecipeImport.ts"

export class GetRecipeScrapePreviewUseCase {
  private recipeImportRepository: IRecipeImportRepository

  constructor(recipeRepository: IRecipeImportRepository) {
    this.recipeImportRepository = recipeRepository
  }

  async execute(url: string): Promise<MealieScrapedRecipePreview> {
    return this.recipeImportRepository.getScrapedRecipePreview(url)
  }
}
