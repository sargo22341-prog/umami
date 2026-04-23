import type { IRecipeCommentRepository } from "@/domain/recipeComment/IRecipeCommentRepository.ts"
import type { MealieRecipeCommentOutOutput } from "@/shared/types/mealie/RecipeComment.ts"

export class CreateRecipeCommentUseCase {

  private recipeCommentRepository: IRecipeCommentRepository

  constructor(recipeCommentRepository: IRecipeCommentRepository) {
    this.recipeCommentRepository = recipeCommentRepository
  }
  async execute(recipeId: string, text: string): Promise<MealieRecipeCommentOutOutput> {
    return this.recipeCommentRepository.createComment(recipeId, text)
  }
}
