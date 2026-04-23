import type { MealieReadPlanEntry } from "@/shared/types/mealie/MealPlan.ts"

export interface IPlanningRepository {
  getWeekPlanning(
    startDate: string,
    endDate: string,
  ): Promise<MealieReadPlanEntry[]>
  addMeal(entry: {
    date: string
    entryType: string
    recipeId?: string
    title?: string
    text?: string
  }): Promise<MealieReadPlanEntry>
  deleteMeal(id: number): Promise<void>
}
