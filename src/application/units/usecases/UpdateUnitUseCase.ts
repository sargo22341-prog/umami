import type { IUnitRepository } from "@/domain/units/IUnitRepository.ts"
import type { MealieCreateIngredientUnit } from "@/shared/types/mealie/Units.ts"

export class UpdateUnitUseCase {
  private readonly unitRepository: IUnitRepository

  constructor(unitRepository: IUnitRepository) {
    this.unitRepository = unitRepository
  }

  execute(id: string, data: MealieCreateIngredientUnit) {
    return this.unitRepository.update(id, data)
  }
}
