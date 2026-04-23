import type { IUnitRepository } from "@/domain/units/IUnitRepository.ts"
import type { MealieMergeUnit } from "@/shared/types/mealie/Units.ts"

export class MergeUnitsUseCase {
  private readonly unitRepository: IUnitRepository

  constructor(unitRepository: IUnitRepository) {
    this.unitRepository = unitRepository
  }

  execute(data: MealieMergeUnit) {
    return this.unitRepository.merge(data)
  }
}
