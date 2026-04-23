import type { IFoodRepository } from "@/domain/foods/IFoodRepository.ts"
import type { MealieCreateIngredientFood } from "@/shared/types/mealie/food.ts"

export class CreateFoodDetailedUseCase {
  private readonly foodRepository: IFoodRepository

  constructor(foodRepository: IFoodRepository) {
    this.foodRepository = foodRepository
  }

  execute(data: MealieCreateIngredientFood) {
    return this.foodRepository.createOne(data)
  }
}
