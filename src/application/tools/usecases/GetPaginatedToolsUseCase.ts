import type { IToolRepository } from "@/domain/tools/IToolRepository.ts"

export class GetPaginatedToolsUseCase {
  private readonly toolRepository: IToolRepository

  constructor(toolRepository: IToolRepository) {
    this.toolRepository = toolRepository
  }

  execute(
    page: number,
    perPage: number,
    search?: string,
    orderBy?: string,
    orderDirection?: "asc" | "desc",
  ) {
    return this.toolRepository.getPage(page, perPage, search, orderBy, orderDirection)
  }
}
