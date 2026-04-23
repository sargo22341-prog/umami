import { useCallback, useEffect, useState } from "react"
import { getPlanningRangeUseCase, getRecipesByIdsUseCase, getRecipesUseCase } from "@/infrastructure/container.ts"

// use case
import { getPeriodDates } from "@/application/planning/usecases/GetStatsUseCase.ts"
import type { StatsPeriod } from "@/application/planning/usecases/GetStatsUseCase.ts"

// domain
import { computeLeftoverPercentage, computeStreak, computeCategoryStats } from "@/domain/planning/services/PlanningStatsService.ts"
import type { CategoryStat } from "@/domain/planning/services/PlanningStatsService.ts"

// utils
import { formatDate, getWeeksBetween } from "@/shared/utils/date.ts"

// type 
import type { MealieRecipeOutput } from "@/shared/types/mealie/Recipes.ts"
export type { StatsPeriod }
export type { CategoryStat }

export interface TopRecipe {
  recipe: MealieRecipeOutput
  count: number
}

export interface TopIngredient {
  name: string
  count: number
}

export interface StatsData {
  topRecipes: TopRecipe[]
  topIngredients: TopIngredient[]
  /** % de repas "restes" (même plat sur deux créneaux consécutifs) */
  leftoverPercentage: number
  /** Nombre de recettes différentes planifiées sur la période */
  uniqueRecipesCount: number
  /** % du catalogue cuisiné sur la période */
  catalogueCoverage: number
  /** Moy. de repas planifiés par semaine */
  avgMealsPerWeek: number
  /** Recettes du catalogue jamais planifiées (période + 14 jours à venir) */
  neverPlannedRecipes: MealieRecipeOutput[]
  categoryStats: CategoryStat[]
  streak: number
  totalMeals: number
  totalCatalogueRecipes: number
}

const MAX_INGREDIENT_RECIPES = 20

export function useStats() {
  const [period, setPeriod] = useState<StatsPeriod>("30d")
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const computeStats = useCallback(async (selectedPeriod: StatsPeriod) => {
    setLoading(true)
    setError(null)
    try {
      const { startDate, endDate } = getPeriodDates(selectedPeriod)

      // 1. Fetch meal plans for the period
      const mealPlans = await getPlanningRangeUseCase.execute(startDate, endDate)

      // 2. Count planned recipe occurrences
      const recipeCounts = new Map<string, number>()
      for (const meal of mealPlans) {
        if (meal.recipe?.slug) {
          recipeCounts.set(meal.recipe.slug, (recipeCounts.get(meal.recipe.slug) ?? 0) + 1)
        }
      }

      // 3. Top recipes
      const sortedSlugs = Array.from(recipeCounts.entries()).sort((a, b) => b[1] - a[1])
      const recipeMap = new Map<string, MealieRecipeOutput>()
      for (const meal of mealPlans) {
        if (meal.recipe?.slug && !recipeMap.has(meal.recipe.slug)) {
          recipeMap.set(meal.recipe.slug, meal.recipe)
        }
      }
      const topRecipes: TopRecipe[] = sortedSlugs
        .slice(0, 10)
        .filter(([slug]) => recipeMap.has(slug))
        .map(([slug, count]) => ({ recipe: recipeMap.get(slug)!, count }))

      // 4. Fetch details for ingredient aggregation
      const top20Slugs = sortedSlugs.slice(0, MAX_INGREDIENT_RECIPES).map(([slug]) => slug)
      const detailedRecipes = await getRecipesByIdsUseCase.execute(top20Slugs)

      // 5. Aggregate ingredients (weighted by frequency)
      const ingredientCounts = new Map<string, number>()
      for (const recipe of detailedRecipes) {
        const count = recipeCounts.get(recipe.slug) ?? 1
        for (const ing of recipe.recipeIngredient ?? []) {
          const name = ing.food?.name?.trim()
          if (name) ingredientCounts.set(name, (ingredientCounts.get(name) ?? 0) + count)
        }
      }
      const topIngredients: TopIngredient[] = Array.from(ingredientCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15)
        .map(([name, count]) => ({ name, count }))

      // 6. Leftover percentage (fixed sort order)
      const leftoverPercentage = computeLeftoverPercentage(mealPlans)

      // 7. Average meals per week
      const weeks = getWeeksBetween(startDate, endDate)
      const avgMealsPerWeek = Math.round((mealPlans.length / weeks) * 10) / 10

      // 8. Full catalogue + "never planned"
      // Extend window by 14 days into the future to capture this week's planned meals
      const futureEnd = new Date()
      futureEnd.setDate(futureEnd.getDate() + 14)
      const [allRecipesResult, futureMealPlans] = await Promise.all([
        getRecipesUseCase.execute(1, 500),
        getPlanningRangeUseCase.execute(endDate, formatDate(futureEnd)),
      ])
      const allRecipes = allRecipesResult.items

      const allPlannedSlugs = new Set(recipeCounts.keys())
      for (const meal of futureMealPlans) {
        if (meal.recipe?.slug) allPlannedSlugs.add(meal.recipe.slug)
      }
      const neverPlannedRecipes = allRecipes
        .filter((r) => !allPlannedSlugs.has(r.slug))
        .slice(0, 50)

      // 9. Unique recipes count + catalogue coverage
      const uniqueRecipesCount = recipeMap.size
      const catalogueCoverage = allRecipes.length > 0
        ? Math.round((uniqueRecipesCount / allRecipes.length) * 100)
        : 0

      // 10. Category distribution
      const uniquePlannedRecipes = Array.from(recipeMap.values())
      const categoryStats = computeCategoryStats(uniquePlannedRecipes)

      // 11. Streak
      const streak = computeStreak(mealPlans, startDate, endDate)

      setStats({
        topRecipes,
        topIngredients,
        leftoverPercentage,
        uniqueRecipesCount,
        catalogueCoverage,
        avgMealsPerWeek,
        neverPlannedRecipes,
        categoryStats,
        streak,
        totalMeals: mealPlans.length,
        totalCatalogueRecipes: allRecipes.length,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void computeStats(period)
  }, [period, computeStats])

  return {
    period,
    setPeriod: useCallback((p: StatsPeriod) => setPeriod(p), []),
    stats,
    loading,
    error,
  }
}
