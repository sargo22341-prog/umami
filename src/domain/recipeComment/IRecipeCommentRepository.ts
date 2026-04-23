// IRecipeCommentRepository.ts

import type { MealieRecipeCommentOutOutput } from "@/shared/types/mealie/RecipeComment.ts"

export interface IRecipeCommentRepository {
  getComments(slug: string): Promise<MealieRecipeCommentOutOutput[]>
  createComment(recipeId: string, text: string): Promise<MealieRecipeCommentOutOutput>
  deleteComment(commentId: string): Promise<void>
}