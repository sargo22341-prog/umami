import type { IRecipeCommentRepository } from "@/domain/recipeComment/IRecipeCommentRepository.ts"

export class DeleteRecipeCommentUseCase {
  private recipeCommentRepository: IRecipeCommentRepository

  constructor(recipeCommentRepository: IRecipeCommentRepository) {
    this.recipeCommentRepository = recipeCommentRepository
  }

  async execute(commentId: string): Promise<void> {
    await this.recipeCommentRepository.deleteComment(commentId)
  }
}
