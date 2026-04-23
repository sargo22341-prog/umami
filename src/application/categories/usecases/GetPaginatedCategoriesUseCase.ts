import type { ICategoryRepository } from "@/domain/categories/ICategoryRepository.ts"
export class GetPaginatedCategoriesUseCase {
  private readonly categoryRepository: ICategoryRepository

  constructor(categoryRepository: ICategoryRepository) {
    this.categoryRepository = categoryRepository
  }

  execute(
    page: number,
    perPage: number,
    search?: string,
    orderBy?: string,
    orderDirection?: "asc" | "desc",
  ) {
    return this.categoryRepository.getPage(page, perPage, search, orderBy, orderDirection)
  }
}
