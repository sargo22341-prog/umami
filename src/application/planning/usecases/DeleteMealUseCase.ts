import type { IPlanningRepository } from "@/domain/planning/repositories/IPlanningRepository.ts"

export class DeleteMealUseCase {
  private planningRepository: IPlanningRepository

  constructor(planningRepository: IPlanningRepository) {
    this.planningRepository = planningRepository
  }

  async execute(id: number): Promise<void> {
    return this.planningRepository.deleteMeal(id)
  }
}
