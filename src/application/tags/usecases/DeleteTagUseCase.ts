import type { ITagRepository } from "@/domain/tags/ITagRepository.ts"

export class DeleteTagUseCase {
  private readonly tagRepository: ITagRepository

  constructor(tagRepository: ITagRepository) {
    this.tagRepository = tagRepository
  }

  execute(id: string) {
    return this.tagRepository.delete(id)
  }
}
