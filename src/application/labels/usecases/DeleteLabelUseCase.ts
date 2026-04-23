import type { ILabelRepository } from "@/domain/labels/ILabelRepository.ts"

export class DeleteLabelUseCase {
  private readonly labelRepository: ILabelRepository

  constructor(labelRepository: ILabelRepository) {
    this.labelRepository = labelRepository
  }

  execute(id: string) {
    return this.labelRepository.delete(id)
  }
}
