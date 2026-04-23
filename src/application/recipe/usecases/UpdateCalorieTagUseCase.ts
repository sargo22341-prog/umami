import type { IRecipeRepository } from "@/domain/recipe/IRecipeRepository.ts"
import type { MealieRecipeOutput } from "@/shared/types/mealie/Recipes.ts"

export class UpdateCalorieTagUseCase {
  private recipeRepository: IRecipeRepository

  constructor(recipeRepository: IRecipeRepository) {
    this.recipeRepository = recipeRepository
  }

  async execute(slug: string, calories: number): Promise<MealieRecipeOutput> {
    return this.recipeRepository.updateCalorieTags(slug, calories)
  }
}