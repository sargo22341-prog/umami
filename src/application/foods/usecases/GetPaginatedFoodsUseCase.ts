import type { IFoodRepository } from "@/domain/foods/IFoodRepository.ts"

export class GetPaginatedFoodsUseCase {
  private readonly foodRepository: IFoodRepository

  constructor(foodRepository: IFoodRepository) {
    this.foodRepository = foodRepository
  }

  execute(
    page: number,
    perPage: number,
    search?: string,
    orderBy?: string,
    orderDirection?: "asc" | "desc",
  ) {
    return this.foodRepository.getPage(page, perPage, search, orderBy, orderDirection)
  }
}
