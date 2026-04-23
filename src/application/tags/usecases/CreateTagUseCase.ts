import type { ITagRepository } from "@/domain/tags/ITagRepository.ts"
import type { MealieTagIn } from "@/shared/types/mealie/Tags.ts"

export class CreateTagUseCase {
  private readonly tagRepository: ITagRepository

  constructor(tagRepository: ITagRepository) {
    this.tagRepository = tagRepository
  }

  execute(data: MealieTagIn) {
    return this.tagRepository.create(data)
  }
}
