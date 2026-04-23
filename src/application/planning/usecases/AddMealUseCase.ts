import type { IPlanningRepository } from "@/domain/planning/repositories/IPlanningRepository.ts"
import type { MealieReadPlanEntry } from "@/shared/types/mealie/MealPlan.ts"

export class AddMealUseCase {
  private planningRepository: IPlanningRepository

  constructor(planningRepository: IPlanningRepository) {
    this.planningRepository = planningRepository
  }

  async execute(
    date: string,
    entryType: string,
    recipeId?: string,
    title?: string,
    text?: string,
  ): Promise<MealieReadPlanEntry> {
    return this.planningRepository.addMeal({ date, entryType, recipeId, title, text })
  }
}
