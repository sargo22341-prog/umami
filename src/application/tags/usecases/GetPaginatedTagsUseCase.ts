import type { ITagRepository } from "@/domain/tags/ITagRepository.ts"

export class GetPaginatedTagsUseCase {
  private readonly tagRepository: ITagRepository

  constructor(tagRepository: ITagRepository) {
    this.tagRepository = tagRepository
  }

  execute(
    page: number,
    perPage: number,
    search?: string,
    orderBy?: string,
    orderDirection?: "asc" | "desc",
  ) {
    return this.tagRepository.getPage(page, perPage, search, orderBy, orderDirection)
  }
}
