import type {
  MealieMergeUnit,
  MealiePaginatedUnits,
  MealieIngredientUnitOutput,
  MealieCreateIngredientUnit,
} from "@/shared/types/mealie/Units.ts"

export interface IUnitRepository {
  getAll(): Promise<MealieIngredientUnitOutput[]>
  getPage(
    page: number,
    perPage: number,
    search?: string,
    orderBy?: string,
    orderDirection?: "asc" | "desc",
  ): Promise<MealiePaginatedUnits>
  create(data: MealieCreateIngredientUnit): Promise<MealieIngredientUnitOutput>
  update(id: string, data: MealieCreateIngredientUnit): Promise<MealieIngredientUnitOutput>
  delete(id: string): Promise<void>
  merge(data: MealieMergeUnit): Promise<void>
}
