import type {
  MealieRecipeCategory,
  MealieCategoryIn,
  MealiePaginatedCategory,
} from "@/shared/types/mealie/Category.ts"

export interface ICategoryRepository {
  getAll(): Promise<MealieRecipeCategory[]>
  getPage(
    page: number,
    perPage: number,
    search?: string,
    orderBy?: string,
    orderDirection?: "asc" | "desc",
  ): Promise<MealiePaginatedCategory>
  create(data: MealieCategoryIn): Promise<MealieRecipeCategory | void>
  update(id: string, data: MealieCategoryIn): Promise<MealieRecipeCategory>
  delete(id: string): Promise<void>
}
