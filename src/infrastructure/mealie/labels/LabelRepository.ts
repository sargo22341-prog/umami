import type { ILabelRepository } from "@/domain/labels/ILabelRepository.ts"
import type {
  MealieLabel,
  MealieLabelInput,
  MealiePaginatedLabels,
  MealieRawPaginatedLabels,
} from "@/shared/types/mealie/Labels.ts"
import { mealieApiClient } from "../api/index.ts"

type LabelOrderDirection = "asc" | "desc"
type LabelOrderBy = "name"

export class LabelRepository implements ILabelRepository {

  async getAll(): Promise<MealieLabel[]> {
    const firstPage = await this.getPage(1, 100)

    if (firstPage.totalPages <= 1) {
      return firstPage.items
    }

    const remainingPages = await Promise.all(
      Array.from({ length: firstPage.totalPages - 1 }, (_, i) =>
        this.getPage(i + 2, 100),
      ),
    )

    return [firstPage, ...remainingPages].flatMap((p) => p.items)
  }

  async getPage(
    page: number,
    perPage: number,
    search?: string,
    orderBy: LabelOrderBy = "name",
    orderDirection: LabelOrderDirection = "asc",
  ): Promise<MealiePaginatedLabels> {
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

    const data = await mealieApiClient.get<MealieRawPaginatedLabels>(
      `/api/groups/labels?${params.toString()}`,
    )

    return {
      items: data.items,
      total: data.total,
      page: data.page,
      perPage: data.per_page,
      totalPages: data.total_pages,
    }
  }

  async create(input: MealieLabelInput): Promise<MealieLabel> {
    return mealieApiClient.post<MealieLabel>("/api/groups/labels", input)
  }

  async update(id: string, input: MealieLabel): Promise<MealieLabel> {
    return mealieApiClient.put<MealieLabel>(`/api/groups/labels/${id}`, input)
  }

  async delete(id: string): Promise<void> {
    await mealieApiClient.delete(`/api/groups/labels/${id}`)
  }
}