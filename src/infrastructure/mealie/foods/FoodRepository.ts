import type { IFoodRepository } from "@/domain/foods/IFoodRepository.ts"
import type {
  MealieIngredientFoodOutput,
  MealieCreateIngredientFood,
  MealieMergeFood,
  MealiePaginatedFoods,
  MealieRawPaginatedFoods,
} from "@/shared/types/mealie/food.ts"
import { MealieApiError } from "@/shared/types/errors.ts"
import { mealieApiClient } from "../api/index.ts"

type FoodOrderDirection = "asc" | "desc"
type FoodOrderBy = "name"

function normalizeFoodName(name: string): string {
  return name.trim().toLocaleLowerCase("fr")
}

function isDuplicateFoodError(error: unknown): boolean {
  if (!(error instanceof MealieApiError)) return false

  const message = error.message.toLocaleLowerCase("en")
  return (
    error.statusCode === 409 ||
    message.includes("unique constraint failed") ||
    message.includes("ingredient_foods.name") ||
    message.includes("already exists")
  )
}

function mergeFoodInput(
  existing: MealieIngredientFoodOutput,
  input: MealieCreateIngredientFood,
): MealieCreateIngredientFood {
  const households = new Set(existing.householdsWithIngredientFood ?? [])
  input.householdsWithIngredientFood?.forEach((household) => households.add(household))

  return {
    name: input.name?.trim() || existing.name,
    pluralName: input.pluralName !== undefined ? input.pluralName : (existing.pluralName ?? null),
    description: input.description !== undefined ? input.description : (existing.description ?? ""),
    extras: input.extras !== undefined ? input.extras : (existing.extras ?? null),
    labelId: input.labelId !== undefined ? input.labelId : (existing.labelId ?? null),
    aliases: input.aliases !== undefined ? input.aliases : (existing.aliases ?? []),
    householdsWithIngredientFood: [...households],
  }
}

function shouldUpdateExistingFood(
  existing: MealieIngredientFoodOutput,
  input: MealieCreateIngredientFood,
): boolean {
  return (
    input.pluralName !== undefined ||
    input.description !== undefined ||
    input.extras !== undefined ||
    input.labelId !== undefined ||
    input.aliases !== undefined ||
    input.householdsWithIngredientFood !== undefined ||
    existing.name !== input.name.trim()
  )
}

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
    try {
      return await mealieApiClient.post<MealieIngredientFoodOutput>("/api/foods", input)
    } catch (error) {
      if (!isDuplicateFoodError(error)) {
        throw error
      }

      const existing = await this.findByExactName(input.name)
      if (!existing) {
        throw error
      }

      if (!shouldUpdateExistingFood(existing, input)) {
        return existing
      }

      return this.update(existing.id, mergeFoodInput(existing, input))
    }
  }

  private async findByExactName(name: string): Promise<MealieIngredientFoodOutput | null> {
    const normalizedName = normalizeFoodName(name)
    const searchResults = await this.getPage(1, 50, name)
    return searchResults.items.find((food) => normalizeFoodName(food.name) === normalizedName) ?? null
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
