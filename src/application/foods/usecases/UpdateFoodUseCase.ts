import type { IFoodRepository } from "@/domain/foods/IFoodRepository.ts"
import type { MealieCreateIngredientFood } from "@/shared/types/mealie/food.ts"

export class UpdateFoodUseCase {
  private readonly foodRepository: IFoodRepository

  constructor(foodRepository: IFoodRepository) {
    this.foodRepository = foodRepository
  }

  execute(id: string, data: MealieCreateIngredientFood) {
    return this.foodRepository.update(id, data)
  }
}
