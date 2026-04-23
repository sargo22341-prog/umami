import type { ICategoryRepository } from "@/domain/categories/ICategoryRepository.ts"
import type {
  MealieRecipeCategory,
  MealieCategoryIn,
  MealiePaginatedCategory,
  MealieRawPaginatedCategory,
} from "@/shared/types/mealie/Category.ts"
import { mealieApiClient } from "../api/index.ts"

type CategoryOrderDirection = "asc" | "desc"
type CategoryOrderBy = "name"

export class CategoryRepository implements ICategoryRepository {
  async getAll(): Promise<MealieRecipeCategory[]> {
    const firstPage = await this.getPage(1, 100)

    if (firstPage.totalPages <= 1) {
      return firstPage.items
    }

    const items = [...firstPage.items]

    for (let page = 2; page <= firstPage.totalPages; page += 1) {
      const pageData = await this.getPage(page, 100)
      items.push(...pageData.items)
    }

    return items
  }

  async getPage(
    page: number,
    perPage: number,
    search?: string,
    orderBy: CategoryOrderBy = "name",
    orderDirection: CategoryOrderDirection = "asc",
  ): Promise<MealiePaginatedCategory> {
    if (page < 1) {
      // ERROR_CODE: INVALID_PAGE | USER_MESSAGE: "Numéro de page invalide"
      throw new Error("page must be >= 1")
    }

    if (perPage < 1) {
      // ERROR_CODE: INVALID_PER_PAGE | USER_MESSAGE: "Nombre d'éléments par page invalide"
      throw new Error("perPage must be >= 1")
    }

    const params = new URLSearchParams({
      page: String(page),
      perPage: String(perPage),
      orderBy,
      orderDirection,
    })

    const trimmedSearch = search?.trim()
    if (trimmedSearch) {
      params.set("search", trimmedSearch)
    }

    const response = await mealieApiClient.get<MealieRawPaginatedCategory>(
      `/api/organizers/categories?${params.toString()}`,
    )

    return {
      items: response.items,
      total: response.total,
      page: response.page,
      perPage: response.per_page,
      totalPages: response.total_pages,
    }
  }

  async create(input: MealieCategoryIn): Promise<MealieRecipeCategory> {
    return mealieApiClient.post<MealieRecipeCategory>("/api/organizers/categories", input)
  }

  async update(id: string, input: MealieCategoryIn): Promise<MealieRecipeCategory> {
    return mealieApiClient.put<MealieRecipeCategory>(`/api/organizers/categories/${id}`, input)
  }

  async delete(id: string): Promise<void> {
    await mealieApiClient.delete(`/api/organizers/categories/${id}`)
  }
}