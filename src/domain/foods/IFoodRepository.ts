import type {
  MealieIngredientFoodOutput,
  MealieCreateIngredientFood,
  MealieMergeFood,
  MealiePaginatedFoods,
} from "@/shared/types/mealie/food.ts"

export interface IFoodRepository {
  getAll(): Promise<MealieIngredientFoodOutput[]>
  create(name: string): Promise<MealieIngredientFoodOutput>
  getPage(
    page: number,
    perPage: number,
    search?: string,
    orderBy?: string,
    orderDirection?: "asc" | "desc",
  ): Promise<MealiePaginatedFoods>
  createOne(data: MealieCreateIngredientFood): Promise<MealieIngredientFoodOutput>
  update(id: string, data: MealieCreateIngredientFood): Promise<MealieIngredientFoodOutput>
  delete(id: string): Promise<void>
  merge(data: MealieMergeFood): Promise<void>
}
