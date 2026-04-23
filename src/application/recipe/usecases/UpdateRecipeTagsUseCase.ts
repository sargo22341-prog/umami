import type { IRecipeRepository } from "@/domain/recipe/IRecipeRepository.ts"
import type { MealieRecipeOutput } from "@/shared/types/mealie/Recipes.ts"
import type { MealieRecipeTag } from "@/shared/types/mealie/Tags.ts"

export class UpdateRecipeTagsUseCase {
  private recipeRepository: IRecipeRepository

  constructor(recipeRepository: IRecipeRepository) {
    this.recipeRepository = recipeRepository
  }

  execute(slug: string, tags: MealieRecipeTag[]): Promise<MealieRecipeOutput> {
    return this.recipeRepository.updateTags(slug, tags)
  }
}
