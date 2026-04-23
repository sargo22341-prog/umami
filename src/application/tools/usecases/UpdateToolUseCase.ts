import type { IToolRepository } from "@/domain/tools/IToolRepository.ts"
import type { MealieRecipeToolCreate } from "@/shared/types/mealie/Tools.ts"

export class UpdateToolUseCase {
  private readonly toolRepository: IToolRepository

  constructor(toolRepository: IToolRepository) {
    this.toolRepository = toolRepository
  }

  execute(id: string, data: MealieRecipeToolCreate) {
    return this.toolRepository.update(id, data)
  }
}
