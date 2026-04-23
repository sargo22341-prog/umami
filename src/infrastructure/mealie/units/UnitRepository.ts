import type { IUnitRepository } from "@/domain/units/IUnitRepository.ts"
import type {
  MealieMergeUnit,
  MealiePaginatedUnits,
  MealieRawPaginatedUnits,
  MealieIngredientUnitOutput,
  MealieCreateIngredientUnit,
} from "@/shared/types/mealie/Units.ts"
import { mealieApiClient } from "../api/index.ts"

export class UnitRepository implements IUnitRepository {
  async getAll(): Promise<MealieIngredientUnitOutput[]> {
    const firstPage = await this.getPage(1, 100)
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
    orderBy = "name",
    orderDirection: "asc" | "desc" = "asc",
  ): Promise<MealiePaginatedUnits> {
    const params = new URLSearchParams({
      page: String(page),
      perPage: String(perPage),
      orderBy,
      orderDirection,
    })

    if (search?.trim()) {
      params.set("search", search.trim())
    }

    const data = await mealieApiClient.get<MealieRawPaginatedUnits>(`/api/units?${params.toString()}`)

    return {
      items: data.items,
      total: data.total,
      page: data.page,
      perPage: data.per_page,
      totalPages: data.total_pages,
    }
  }

  async create(data: MealieCreateIngredientUnit): Promise<MealieIngredientUnitOutput> {
    return mealieApiClient.post<MealieIngredientUnitOutput>("/api/units", data)
  }

  async update(id: string, data: MealieCreateIngredientUnit): Promise<MealieIngredientUnitOutput> {
    return mealieApiClient.put<MealieIngredientUnitOutput>(`/api/units/${id}`, data)
  }

  async delete(id: string): Promise<void> {
    await mealieApiClient.delete(`/api/units/${id}`)
  }

  async merge(data: MealieMergeUnit): Promise<void> {
    await mealieApiClient.put("/api/units/merge", data)
  }
}
