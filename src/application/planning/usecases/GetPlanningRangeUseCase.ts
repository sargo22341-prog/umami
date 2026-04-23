import type { IPlanningRepository } from "@/domain/planning/repositories/IPlanningRepository.ts"
import type { MealieReadPlanEntry } from "@/shared/types/mealie/MealPlan.ts"

export class GetPlanningRangeUseCase {
  private planningRepository: IPlanningRepository

  constructor(planningRepository: IPlanningRepository) {
    this.planningRepository = planningRepository
  }

  async execute(startDate: string, endDate: string): Promise<MealieReadPlanEntry[]> {
    return this.planningRepository.getWeekPlanning(startDate, endDate)
  }
}
