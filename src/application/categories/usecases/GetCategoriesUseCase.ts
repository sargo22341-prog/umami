import type { ICategoryRepository } from "@/domain/categories/ICategoryRepository.ts"
import type { MealieRecipeCategory } from "@/shared/types/mealie/Category.ts"

export class GetCategoriesUseCase {
  private categoryRepository: ICategoryRepository

  constructor(categoryRepository: ICategoryRepository) {
    this.categoryRepository = categoryRepository
  }

  async execute(): Promise<MealieRecipeCategory[]> {
    return this.categoryRepository.getAll()
  }
}
