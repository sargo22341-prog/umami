import type { ILabelRepository } from "@/domain/labels/ILabelRepository.ts"

export class GetLabelsUseCase {
  private readonly labelRepository: ILabelRepository

  constructor(labelRepository: ILabelRepository) {
    this.labelRepository = labelRepository
  }

  execute() {
    return this.labelRepository.getAll()
  }
}
