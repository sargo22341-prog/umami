
import type { MealieUserRatingsUserRatingOut } from "@/shared/types/mealie/User.ts"

export interface IUserRecipeRepository {
  getFavorites(): Promise<MealieUserRatingsUserRatingOut>
  toggleFavorite(slug: string, isFavorite: boolean): Promise<void>
  updateRating(slug: string, rating: number): Promise<void>
}