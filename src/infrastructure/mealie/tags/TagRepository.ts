import type { ITagRepository } from "@/domain/tags/ITagRepository.ts"
import type {
  MealiePaginatedTags,
  MealieRawPaginatedTags,
  MealieRecipeTag,
  MealieRecipeTagResponse,
  MealieTagIn,
} from "@/shared/types/mealie/Tags.ts"
import { mealieApiClient } from "../api/index.ts"

export class TagRepository implements ITagRepository {
  async getAll(): Promise<MealieRecipeTag[]> {
    const firstPage = await this.getPage(1, 100)
    const items = [...firstPage.items]

    for (let page = 2; page <= firstPage.totalPages; page += 1) {
      const pageData = await this.getPage(page, 100)
      items.push(...pageData.items)
    }

    return items
  }

  async getById(id: string): Promise<MealieRecipeTagResponse> {
     return mealieApiClient.get<MealieRecipeTagResponse>(`/api/organizers/tags/${id}`)
  }

  async getPage(
    page: number,
    perPage: number,
    search?: string,
    orderBy = "name",
    orderDirection: "asc" | "desc" = "asc",
  ): Promise<MealiePaginatedTags> {
    const params = new URLSearchParams({
      page: String(page),
      perPage: String(perPage),
      orderBy,
      orderDirection,
    })

    if (search?.trim()) {
      params.set("search", search.trim())
    }

    const data = await mealieApiClient.get<MealieRawPaginatedTags>(`/api/organizers/tags?${params.toString()}`)

    return {
      items: data.items,
      total: data.total,
      page: data.page,
      perPage: data.per_page,
      totalPages: data.total_pages,
    }
  }

  async create(data: MealieTagIn): Promise<MealieRecipeTag | void> {
    return mealieApiClient.post<MealieRecipeTag | void>("/api/organizers/tags", data)
  }

  async update(id: string, data: MealieTagIn): Promise<MealieRecipeTag> {
    return mealieApiClient.put<MealieRecipeTag>(`/api/organizers/tags/${id}`, data)
  }

  async delete(id: string): Promise<void> {
    await mealieApiClient.delete(`/api/organizers/tags/${id}`)
  }
}
