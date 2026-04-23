import type { MealieReadPlanEntry } from "@/shared/types/mealie/MealPlan.ts"

export interface VisiblePlanningDay {
  date: string
  label: string
}

export interface PlanningMealEntry {
  slug: string
  recipeName: string
}

export interface DayRecipeSummary {
  date: string
  recipeCount: number
  hasRecipes: boolean
}

export function getPlanningMealsForDates(
  mealPlans: MealieReadPlanEntry[],
  selectedDates: string[],
): PlanningMealEntry[] {
  const selectedDateSet = new Set(selectedDates)

  return mealPlans
    .filter((meal) => (
      selectedDateSet.has(meal.date)
      && Boolean(meal.recipe?.slug)
      && Boolean(meal.recipe?.name)
    ))
    .map((meal) => ({
      slug: meal.recipe!.slug,
      recipeName: meal.recipe!.name,
    }))
}

export function getDayRecipeSummaries(
  visibleDays: VisiblePlanningDay[],
  mealPlans: MealieReadPlanEntry[],
): DayRecipeSummary[] {
  return visibleDays.map((day) => {
    const recipeCount = mealPlans.filter((meal) => (
      meal.date === day.date
      && Boolean(meal.recipe?.slug)
      && Boolean(meal.recipe?.name)
    )).length

    return {
      date: day.date,
      recipeCount,
      hasRecipes: recipeCount > 0,
    }
  })
}
