import type { IToolRepository } from "@/domain/tools/IToolRepository.ts"
import type { MealieRecipeToolCreate } from "@/shared/types/mealie/Tools.ts"

export class CreateToolUseCase {
  private readonly toolRepository: IToolRepository

  constructor(toolRepository: IToolRepository) {
    this.toolRepository = toolRepository
  }

  execute(data: MealieRecipeToolCreate) {
    return this.toolRepository.create(data)
  }
}
