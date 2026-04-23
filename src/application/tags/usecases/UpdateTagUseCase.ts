import type { ITagRepository } from "@/domain/tags/ITagRepository.ts"
import type { MealieTagIn } from "@/shared/types/mealie/Tags.ts"

export class UpdateTagUseCase {
  private readonly tagRepository: ITagRepository

  constructor(tagRepository: ITagRepository) {
    this.tagRepository = tagRepository
  }

  execute(id: string, data: MealieTagIn) {
    return this.tagRepository.update(id, data)
  }
}
