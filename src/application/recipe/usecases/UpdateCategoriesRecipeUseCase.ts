import type { IRecipeRepository } from "@/domain/recipe/IRecipeRepository.ts"
import type { MealieRecipeOutput} from "@/shared/types/mealie/Recipes.ts"
import type { MealieRecipeCategory } from "@/shared/types/mealie/Category.ts"

export class UpdateCategoriesUseCase {
  private recipeRepository: IRecipeRepository

  constructor(recipeRepository: IRecipeRepository) {
    this.recipeRepository = recipeRepository
  }

  async execute(slug: string, categories: MealieRecipeCategory[]): Promise<MealieRecipeOutput> {
    return this.recipeRepository.updateCategories(slug, categories)
  }
}
