import type { IRecipeRepository } from "@/domain/recipe/IRecipeRepository.ts"
import type { MealieRecipeOutput } from "@/shared/types/mealie/Recipes.ts"
import type { Season } from "@/shared/types/Season.ts"

export class UpdateSeasonsUseCase {
  private recipeRepository: IRecipeRepository

  constructor(recipeRepository: IRecipeRepository) {
    this.recipeRepository = recipeRepository
  }

  async execute(slug: string, seasons: Season[]): Promise<MealieRecipeOutput> {
    return this.recipeRepository.updateSeasons(slug, seasons)
  }
}
