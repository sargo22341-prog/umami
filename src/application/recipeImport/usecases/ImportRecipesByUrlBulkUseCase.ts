import type { IRecipeImportRepository } from "@/domain/recipeImport/IRecipeImportRepository.ts"
import type { MealieRecipeScrapeOptions } from "@/shared/types/mealie/RecipeImport.ts"

export class ImportRecipesByUrlBulkUseCase {
  private recipeImportRepository: IRecipeImportRepository

  constructor(recipeRepository: IRecipeImportRepository) {
    this.recipeImportRepository = recipeRepository
  }

  async execute(urls: string[], options?: MealieRecipeScrapeOptions): Promise<void> {
    await this.recipeImportRepository.importRecipesByUrls(urls, options)
  }
}
