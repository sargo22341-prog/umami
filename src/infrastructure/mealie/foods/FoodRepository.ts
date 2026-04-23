import type { IFoodRepository } from "@/domain/foods/IFoodRepository.ts"
import type {
  MealieIngredientFoodOutput,
  MealieCreateIngredientFood,
  MealieMergeFood,
  MealiePaginatedFoods,
  MealieRawPaginatedFoods,
} from "@/shared/types/mealie/food.ts"
import { mealieApiClient } from "../api/index.ts"

type FoodOrderDirection = "asc" | "desc"
type FoodOrderBy = "name"

export class FoodRepository implements IFoodRepository {
  
  async getAll(): Promise<MealieIngredientFoodOutput[]> {
    const firstPage = await this.getPage(1, 9999)

    if (firstPage.totalPages <= 1) {
      return firstPage.items
    }

    const items = [...firstPage.items]

    for (let page = 2; page <= firstPage.totalPages; page += 1) {
      const pageData = await this.getPage(page, 9999)
      items.push(...pageData.items)
    }

    return items
  }

  async getPage(
    page: number,
    perPage: number,
    search?: string,
    orderBy: FoodOrderBy = "name",
    orderDirection: FoodOrderDirection = "asc",
  ): Promise<MealiePaginatedFoods> {
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

    const response = await mealieApiClient.get<MealieRawPaginatedFoods>(
      `/api/foods?${params.toString()}`,
    )

    return {
      items: response.items,
      total: response.total,
      page: response.page,
      perPage: response.per_page,
      totalPages: response.total_pages,
    }
  }

  async create(name: string): Promise<MealieIngredientFoodOutput> {
    return this.createOne({ name })
  }

  async createOne(input: MealieCreateIngredientFood): Promise<MealieIngredientFoodOutput> {
    return mealieApiClient.post<MealieIngredientFoodOutput>("/api/foods", input)
  }

  async update(id: string, input: MealieCreateIngredientFood): Promise<MealieIngredientFoodOutput> {
    const payload: MealieCreateIngredientFood = {
      ...input,
      id,
    }

    return mealieApiClient.put<MealieIngredientFoodOutput>(`/api/foods/${id}`, payload)
  }

  async delete(id: string): Promise<void> {
    await mealieApiClient.delete(`/api/foods/${id}`)
  }

  async merge(input: MealieMergeFood): Promise<void> {
    await mealieApiClient.put("/api/foods/merge", input)
  }
}
