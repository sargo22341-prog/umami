import type { IFoodRepository } from "@/domain/foods/IFoodRepository.ts"

export class DeleteFoodUseCase {
  private readonly foodRepository: IFoodRepository

  constructor(foodRepository: IFoodRepository) {
    this.foodRepository = foodRepository
  }

  execute(id: string) {
    return this.foodRepository.delete(id)
  }
}
