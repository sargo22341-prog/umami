import type { IToolRepository } from "@/domain/tools/IToolRepository.ts"
import type { MealieRecipeTool } from "@/shared/types/mealie/Tools.ts"

export class GetToolsUseCase {
  private toolRepository: IToolRepository

  constructor(toolRepository: IToolRepository) {
    this.toolRepository = toolRepository
  }

  async execute(): Promise<MealieRecipeTool[]> {
    return this.toolRepository.getAll()
  }
}
