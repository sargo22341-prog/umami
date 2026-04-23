import type { IUnitRepository } from "@/domain/units/IUnitRepository.ts"
import type { MealieIngredientUnitOutput } from "@/shared/types/mealie/Units.ts"

export class GetUnitsUseCase {
  private unitRepository: IUnitRepository

  constructor(unitRepository: IUnitRepository) {
    this.unitRepository = unitRepository
  }

  async execute(): Promise<MealieIngredientUnitOutput[]> {
    return this.unitRepository.getAll()
  }
}
