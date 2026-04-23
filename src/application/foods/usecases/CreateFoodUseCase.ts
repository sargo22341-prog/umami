import type { IFoodRepository } from "@/domain/foods/IFoodRepository.ts"
import type { MealieIngredientFoodOutput } from "@/shared/types/mealie/food.ts"

export class CreateFoodUseCase {
  private foodRepository: IFoodRepository

  constructor(foodRepository: IFoodRepository) {
    this.foodRepository = foodRepository
  }

  async execute(name: string): Promise<MealieIngredientFoodOutput> {
    return this.foodRepository.create(name)
  }
}
