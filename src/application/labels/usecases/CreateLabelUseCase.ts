import type { ILabelRepository } from "@/domain/labels/ILabelRepository.ts"
import type { MealieLabelInput } from "@/shared/types/mealie/Labels.ts"

export class CreateLabelUseCase {
  private readonly labelRepository: ILabelRepository

  constructor(labelRepository: ILabelRepository) {
    this.labelRepository = labelRepository
  }

  execute(data: MealieLabelInput) {
    return this.labelRepository.create(data)
  }
}
