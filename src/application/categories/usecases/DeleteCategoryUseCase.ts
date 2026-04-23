import type { ICategoryRepository } from "@/domain/categories/ICategoryRepository.ts"

export class DeleteCategoryUseCase {
  private readonly categoryRepository: ICategoryRepository

  constructor(categoryRepository: ICategoryRepository) {
    this.categoryRepository = categoryRepository
  }

  execute(id: string) {
    return this.categoryRepository.delete(id)
  }
}
