import type { IFoodRepository } from "@/domain/foods/IFoodRepository.ts"
import type { MealieIngredientFoodOutput } from "@/shared/types/mealie/food.ts"

export class GetFoodsUseCase {
  private foodRepository: IFoodRepository

  constructor(foodRepository: IFoodRepository) {
    this.foodRepository = foodRepository
  }

  async execute(): Promise<MealieIngredientFoodOutput[]> {
    return this.foodRepository.getAll()
  }
}
