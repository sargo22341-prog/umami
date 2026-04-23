import type { IUnitRepository } from "@/domain/units/IUnitRepository.ts"

export class GetPaginatedUnitsUseCase {
  private readonly unitRepository: IUnitRepository

  constructor(unitRepository: IUnitRepository) {
    this.unitRepository = unitRepository
  }

  execute(
    page: number,
    perPage: number,
    search?: string,
    orderBy?: string,
    orderDirection?: "asc" | "desc",
  ) {
    return this.unitRepository.getPage(page, perPage, search, orderBy, orderDirection)
  }
}
