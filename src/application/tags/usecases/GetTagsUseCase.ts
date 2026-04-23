import type { ITagRepository } from "@/domain/tags/ITagRepository.ts"
import type { MealieRecipeTag } from "@/shared/types/mealie/Tags.ts"

export class GetTagsUseCase {
  private tagRepository: ITagRepository

  constructor(tagRepository: ITagRepository) {
    this.tagRepository = tagRepository
  }

  async execute(): Promise<MealieRecipeTag[]> {
    return this.tagRepository.getAll()
  }
}
