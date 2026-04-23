import type { IUnitRepository } from "@/domain/units/IUnitRepository.ts"
import type { MealieCreateIngredientUnit } from "@/shared/types/mealie/Units.ts"

export class CreateUnitUseCase {
  private readonly unitRepository: IUnitRepository

  constructor(unitRepository: IUnitRepository) {
    this.unitRepository = unitRepository
  }

  execute(data: MealieCreateIngredientUnit) {
    return this.unitRepository.create(data)
  }
}
