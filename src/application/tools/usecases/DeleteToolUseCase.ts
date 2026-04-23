import type { IToolRepository } from "@/domain/tools/IToolRepository.ts"

export class DeleteToolUseCase {
  private readonly toolRepository: IToolRepository

  constructor(toolRepository: IToolRepository) {
    this.toolRepository = toolRepository
  }

  execute(id: string) {
    return this.toolRepository.delete(id)
  }
}
