import type { ICategoryRepository } from "@/domain/categories/ICategoryRepository.ts"
import type { MealieCategoryIn } from "@/shared/types/mealie/Category.ts"

export class CreateCategoryUseCase {
  private readonly categoryRepository: ICategoryRepository

  constructor(categoryRepository: ICategoryRepository) {
    this.categoryRepository = categoryRepository
  }

  execute(data: MealieCategoryIn) {
    return this.categoryRepository.create(data)
  }
}
