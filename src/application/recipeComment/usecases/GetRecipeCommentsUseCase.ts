import type { IRecipeCommentRepository } from "@/domain/recipeComment/IRecipeCommentRepository.ts"
import type { MealieRecipeCommentOutOutput } from "@/shared/types/mealie/RecipeComment.ts"

export class GetRecipeCommentsUseCase {
  private recipeCommentRepository: IRecipeCommentRepository

  constructor(recipeCommentRepository: IRecipeCommentRepository) {
    this.recipeCommentRepository = recipeCommentRepository
  }

  async execute(slug: string): Promise<MealieRecipeCommentOutOutput[]> {
    return this.recipeCommentRepository.getComments(slug)
  }
}
