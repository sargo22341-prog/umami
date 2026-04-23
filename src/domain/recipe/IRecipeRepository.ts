import type {
  MealiePaginatedRecipes,
  MealieRecipeOutput,
  RecipeFilters,
  RecipeFormData,
} from "@/shared/types/mealie/Recipes.ts"
import type { Season } from "@/shared/types/Season.ts"
import type { MealieRecipeTag } from "@/shared/types/mealie/Tags.ts"
import type { MealieRecipeCategory } from "@/shared/types/mealie/Category.ts"

export interface IRecipeRepository {
  getAll(
    page?: number,
    perPage?: number,
    filters?: RecipeFilters,
  ): Promise<MealiePaginatedRecipes>
  getBySlug(slug: string): Promise<MealieRecipeOutput>
  create(name: string): Promise<string>
  delete(slug: string): Promise<void>
  update(slug: string, data: RecipeFormData): Promise<MealieRecipeOutput>
  updateCategories(slug: string, categories: MealieRecipeCategory[]): Promise<MealieRecipeOutput>
  uploadImage(slug: string, file: File): Promise<void>
  /// tags
  updateTags(slug: string, tags: MealieRecipeTag[]): Promise<MealieRecipeOutput>
  updateSeasons(slug: string, seasons: Season[]): Promise<MealieRecipeOutput>
  updateCalorieTags(slug: string, calories: number): Promise<MealieRecipeOutput>
}
