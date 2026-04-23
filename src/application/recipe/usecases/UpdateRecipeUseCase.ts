import type { IRecipeRepository } from "@/domain/recipe/IRecipeRepository.ts"
import type { IFoodRepository } from "@/domain/foods/IFoodRepository.ts"
import type { IUnitRepository } from "@/domain/units/IUnitRepository.ts"
import type { RecipeFormData, MealieRecipeOutput } from "@/shared/types/mealie/Recipes.ts"
import { resolveIngredients } from "../../foods/usecases/resolveIngredients.ts"

export class UpdateRecipeUseCase {
  private recipeRepository: IRecipeRepository
  private foodRepository: IFoodRepository
  private unitRepository: IUnitRepository

  constructor(
    recipeRepository: IRecipeRepository,
    foodRepository: IFoodRepository,
    unitRepository: IUnitRepository,
  ) {
    this.recipeRepository = recipeRepository
    this.foodRepository = foodRepository
    this.unitRepository = unitRepository
  }

  async execute(slug: string, data: RecipeFormData): Promise<MealieRecipeOutput> {
    const resolvedData = await resolveIngredients(data, this.foodRepository, this.unitRepository)
    const recipe = await this.recipeRepository.update(slug, resolvedData)
    if (data.imageFile) {
      await this.recipeRepository.uploadImage(slug, data.imageFile)
    }
    return recipe
  }
}
