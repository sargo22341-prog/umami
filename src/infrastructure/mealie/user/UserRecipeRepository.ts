// UserRecipeRepository.ts

import type { IUserRecipeRepository } from "@/domain/user/IUserRecipeRepository.ts"
import type { IRecipeRepository } from "@/domain/recipe/IRecipeRepository.ts"
import type { MealieUserRatingsUserRatingOut } from "@/shared/types/mealie/User.ts"
import { mealieApiClient } from "../api/index.ts"
import { AuthService } from "../auth/AuthService.ts"

export class UserRecipeRepository implements IUserRecipeRepository {
  private authService: AuthService
  private recipeRepository: IRecipeRepository

  constructor(authService: AuthService, recipeRepository: IRecipeRepository) {
    this.authService = authService
    this.recipeRepository = recipeRepository
  }

  async updateRating(slug: string, rating: number): Promise<void> {
    const [userId, recipe, favorites] = await Promise.all([
      this.authService.getUserId(),
      this.recipeRepository.getBySlug(slug),
      this.getFavorites(),
    ])

    const currentFavorite = favorites.ratings.some(
      (favorite) => favorite.recipeId === recipe.id && favorite.isFavorite,
    )

    await mealieApiClient.post(`/api/users/${userId}/ratings/${slug}`, {
      rating,
      isFavorite: currentFavorite,
    })
  }

  async getFavorites(): Promise<MealieUserRatingsUserRatingOut> {
    const userId = await this.authService.getUserId()
    return mealieApiClient.get<MealieUserRatingsUserRatingOut>(
      `/api/users/${userId}/favorites`,
    )
  }

  async toggleFavorite(slug: string, isFavorite: boolean): Promise<void> {
    const userId = await this.authService.getUserId()

    if (isFavorite) {
      await mealieApiClient.delete(`/api/users/${userId}/favorites/${slug}`)
      return
    }

    await mealieApiClient.post(`/api/users/${userId}/favorites/${slug}`, {})
  }
}