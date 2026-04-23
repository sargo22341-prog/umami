import type { ILabelRepository } from "@/domain/labels/ILabelRepository.ts"
import type { MealieLabel } from "@/shared/types/mealie/Labels.ts"

export class UpdateLabelUseCase {
  private readonly labelRepository: ILabelRepository

  constructor(labelRepository: ILabelRepository) {
    this.labelRepository = labelRepository
  }

  execute(id: string, data: MealieLabel) {
    return this.labelRepository.update(id, data)
  }
}
