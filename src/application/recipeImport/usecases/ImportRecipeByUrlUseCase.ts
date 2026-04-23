import type { IRecipeImportRepository } from "@/domain/recipeImport/IRecipeImportRepository.ts"
import type { MealieRecipeScrapeOptions } from "@/shared/types/mealie/RecipeImport.ts"

export class ImportRecipeByUrlUseCase {
  private recipeImportRepository: IRecipeImportRepository

  constructor(recipeRepository: IRecipeImportRepository) {
    this.recipeImportRepository = recipeRepository
  }

  async execute(url: string, options?: MealieRecipeScrapeOptions): Promise<void> {
    await this.recipeImportRepository.importRecipeByUrl(url, options)
  }
}
