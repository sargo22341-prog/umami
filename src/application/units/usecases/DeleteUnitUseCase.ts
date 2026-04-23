import type { IUnitRepository } from "@/domain/units/IUnitRepository.ts"

export class DeleteUnitUseCase {
  private readonly unitRepository: IUnitRepository

  constructor(unitRepository: IUnitRepository) {
    this.unitRepository = unitRepository
  }

  execute(id: string) {
    return this.unitRepository.delete(id)
  }
}
