import type { IRecipeImportRepository } from "@/domain/recipeImport/IRecipeImportRepository.ts"

export class TestRecipeScrapeUrlUseCase {
  private recipeImportRepository: IRecipeImportRepository

  constructor(recipeRepository: IRecipeImportRepository) {
    this.recipeImportRepository = recipeRepository
  }

  async execute(url: string): Promise<void> {
    await this.recipeImportRepository.testScrapeUrl(url)
  }
}
