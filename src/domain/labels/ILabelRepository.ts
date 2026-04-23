import type {
  MealieLabel,
  MealieLabelInput,
  MealiePaginatedLabels,
} from "@/shared/types/mealie/Labels.ts"

export interface ILabelRepository {
  getAll(): Promise<MealieLabel[]>
  getPage(
    page: number,
    perPage: number,
    search?: string,
    orderBy?: string,
    orderDirection?: "asc" | "desc",
  ): Promise<MealiePaginatedLabels>
  create(data: MealieLabelInput): Promise<MealieLabel>
  update(id: string, data: MealieLabel): Promise<MealieLabel>
  delete(id: string): Promise<void>
}
