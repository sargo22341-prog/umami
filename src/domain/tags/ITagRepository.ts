import type {
  MealiePaginatedTags,
  MealieRecipeTag,
  MealieRecipeTagResponse,
  MealieTagIn
} from "@/shared/types/mealie/Tags.ts"

export interface ITagRepository {
  getAll(): Promise<MealieRecipeTag[]>
  getById(id: string): Promise<MealieRecipeTagResponse>
  getPage(
    page: number,
    perPage: number,
    search?: string,
    orderBy?: string,
    orderDirection?: "asc" | "desc",
  ): Promise<MealiePaginatedTags>
  create(data: MealieTagIn): Promise<MealieRecipeTag | void>
  update(id: string, data: MealieTagIn): Promise<MealieRecipeTag>
  delete(id: string): Promise<void>
}
