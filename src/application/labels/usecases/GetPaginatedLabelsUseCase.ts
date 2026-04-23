import type { ILabelRepository } from "@/domain/labels/ILabelRepository.ts"

export class GetPaginatedLabelsUseCase {
  private readonly labelRepository: ILabelRepository

  constructor(labelRepository: ILabelRepository) {
    this.labelRepository = labelRepository
  }

  execute(
    page: number,
    perPage: number,
    search?: string,
    orderBy?: string,
    orderDirection?: "asc" | "desc",
  ) {
    return this.labelRepository.getPage(page, perPage, search, orderBy, orderDirection)
  }
}
