import type {
  MealiePaginatedTools,
  MealieRecipeTool,
  MealieRecipeToolCreate,
} from "@/shared/types/mealie/Tools.ts"

export interface IToolRepository {
  getAll(): Promise<MealieRecipeTool[]>
  getPage(
    page: number,
    perPage: number,
    search?: string,
    orderBy?: string,
    orderDirection?: "asc" | "desc",
  ): Promise<MealiePaginatedTools>
  create(data: MealieRecipeToolCreate): Promise<MealieRecipeTool>
  update(id: string, data: MealieRecipeToolCreate): Promise<MealieRecipeTool>
  delete(id: string): Promise<void>
}
