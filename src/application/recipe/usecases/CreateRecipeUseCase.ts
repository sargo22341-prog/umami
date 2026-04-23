import type { IRecipeRepository } from "@/domain/recipe/IRecipeRepository.ts"
import type { IFoodRepository } from "@/domain/foods/IFoodRepository.ts"
import type { IUnitRepository } from "@/domain/units/IUnitRepository.ts"
import type { RecipeFormData, MealieRecipeOutput } from "@/shared/types/mealie/Recipes.ts"
import { resolveIngredients } from "../../foods/usecases/resolveIngredients.ts"

export class CreateRecipeUseCase {
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

  async execute(data: RecipeFormData): Promise<MealieRecipeOutput> {
    const slug = await this.recipeRepository.create(data.name)

    try {
      const resolvedData = await resolveIngredients(data, this.foodRepository, this.unitRepository)
      const recipe = await this.recipeRepository.update(slug, resolvedData)
      if (data.imageFile) {
        await this.recipeRepository.uploadImage(slug, data.imageFile)
      }
      return recipe
    } catch (error) {
      try {
        await this.recipeRepository.delete(slug)
      } catch {
        // Best effort rollback: keep the original error as the actionable one.
      }
      throw error
    }
  }
}
