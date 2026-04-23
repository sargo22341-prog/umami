import type { IToolRepository } from "@/domain/tools/IToolRepository.ts"
import type {
  MealiePaginatedTools,
  MealieRawPaginatedTools,
  MealieRecipeTool,
  MealieRecipeToolCreate,
} from "@/shared/types/mealie/Tools.ts"
import { mealieApiClient } from "../api/index.ts"

export class ToolRepository implements IToolRepository {
  async getAll(): Promise<MealieRecipeTool[]> {
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
  ): Promise<MealiePaginatedTools> {
    const params = new URLSearchParams({
      page: String(page),
      perPage: String(perPage),
      orderBy,
      orderDirection,
    })

    if (search?.trim()) {
      params.set("search", search.trim())
    }

    const data = await mealieApiClient.get<MealieRawPaginatedTools>(`/api/organizers/tools?${params.toString()}`)

    return {
      items: data.items,
      total: data.total,
      page: data.page,
      perPage: data.per_page,
      totalPages: data.total_pages,
    }
  }

  async create(data: MealieRecipeToolCreate): Promise<MealieRecipeTool> {
    return mealieApiClient.post<MealieRecipeTool>("/api/organizers/tools", data)
  }

  async update(id: string, data: MealieRecipeToolCreate): Promise<MealieRecipeTool> {
    return mealieApiClient.put<MealieRecipeTool>(`/api/organizers/tools/${id}`, data)
  }

  async delete(id: string): Promise<void> {
    await mealieApiClient.delete(`/api/organizers/tools/${id}`)
  }
}
