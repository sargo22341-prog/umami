import type { IRecipeRepository } from "@/domain/recipe/IRecipeRepository.ts"
import type { MealieRecipeOutput } from "@/shared/types/mealie/Recipes.ts"

export class GetRecipeUseCase {
  private recipeRepository: IRecipeRepository

  constructor(recipeRepository: IRecipeRepository) {
    this.recipeRepository = recipeRepository
  }

  async execute(slug: string): Promise<MealieRecipeOutput> {
    return this.recipeRepository.getBySlug(slug)
  }
}
