import type { ICategoryRepository } from "@/domain/categories/ICategoryRepository.ts"
import type { MealieCategoryIn } from "@/shared/types/mealie/Category.ts"

export class UpdateCategoryUseCase {
  private readonly categoryRepository: ICategoryRepository

  constructor(categoryRepository: ICategoryRepository) {
    this.categoryRepository = categoryRepository
  }

  execute(id: string, data: MealieCategoryIn) {
    return this.categoryRepository.update(id, data)
  }
}
