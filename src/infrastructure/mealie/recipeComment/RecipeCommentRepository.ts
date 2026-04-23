// RecipeCommentRepository.ts

import type { IRecipeCommentRepository } from "@/domain/recipeComment/IRecipeCommentRepository.ts"
import type { MealieRecipeCommentOutOutput } from "@/shared/types/mealie/RecipeComment.ts"
import { mealieApiClient } from "../api/index.ts"

export class RecipeCommentRepository implements IRecipeCommentRepository {
  async getComments(slug: string): Promise<MealieRecipeCommentOutOutput[]> {
    return mealieApiClient.get<MealieRecipeCommentOutOutput[]>(`/api/recipes/${slug}/comments`)
  }

  async createComment(recipeId: string, text: string): Promise<MealieRecipeCommentOutOutput> {
    return mealieApiClient.post<MealieRecipeCommentOutOutput>("/api/comments", {
      recipeId,
      text,
    })
  }

  async deleteComment(commentId: string): Promise<void> {
    await mealieApiClient.delete(`/api/comments/${commentId}`)
  }
}