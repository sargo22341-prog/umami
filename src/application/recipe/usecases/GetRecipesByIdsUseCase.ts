import type { IRecipeRepository } from "@/domain/recipe/IRecipeRepository.ts"
import type { MealieRecipeOutput } from "@/shared/types/mealie/Recipes.ts"

export class GetRecipesByIdsUseCase {
  private recipeRepository: IRecipeRepository

  constructor(recipeRepository: IRecipeRepository) {
    this.recipeRepository = recipeRepository
  }

  /**
   * Fetches the details of multiple recipes by their slug, in parallel.
   * Individual errors are silently ignored (recipe not found, deleted, etc.).
   */
  async execute(slugs: string[]): Promise<MealieRecipeOutput[]> {
    const results = await Promise.allSettled(
      slugs.map((slug) => this.recipeRepository.getBySlug(slug)),
    )
    return results
      .filter((r): r is PromiseFulfilledResult<MealieRecipeOutput> => r.status === "fulfilled")
      .map((r) => r.value)
  }
}
