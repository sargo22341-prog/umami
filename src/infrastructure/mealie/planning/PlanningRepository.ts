import type { IPlanningRepository } from "@/domain/planning/repositories/IPlanningRepository.ts"
import type {
  MealiePlanEntryType,
  MealieReadPlanEntry,
  MealieRawPaginatedMealPlans,
} from "@/shared/types/mealie/MealPlan.ts"
import { mealieApiClient } from "../api/index.ts"

export class PlanningRepository implements IPlanningRepository {

  async getWeekPlanning(startDate: string, endDate: string): Promise<MealieReadPlanEntry[]> {

    const params = new URLSearchParams({
      page: "1",
      perPage: "-1",
      start_date: startDate,
      end_date: endDate,
    })

    const raw = await mealieApiClient.get<MealieRawPaginatedMealPlans>(
      `/api/households/mealplans?${params.toString()}`,
    )

    return raw.items
  }

  async addMeal(entry: {
    date: string
    entryType: MealiePlanEntryType
    recipeId?: string
    title?: string
    text?: string
  }): Promise<MealieReadPlanEntry> {
    return mealieApiClient.post<MealieReadPlanEntry>(
      "/api/households/mealplans",
      entry,
    )
  }

  async deleteMeal(id: number): Promise<void> {
    await mealieApiClient.delete(`/api/households/mealplans/${id}`)
  }
}
