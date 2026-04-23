import type { IFoodRepository } from "@/domain/foods/IFoodRepository.ts"
import type { MealieMergeFood } from "@/shared/types/mealie/food.ts"

export class MergeFoodsUseCase {
  private readonly foodRepository: IFoodRepository

  constructor(foodRepository: IFoodRepository) {
    this.foodRepository = foodRepository
  }

  execute(data: MealieMergeFood) {
    return this.foodRepository.merge(data)
  }
}
