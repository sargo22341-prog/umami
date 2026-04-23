import { useCallback, useMemo, useState } from "react"

import type { PlanningCartRecipe } from "components/common/PlanningAddToCartDialog.tsx"
import type { VisiblePlanningDay } from "components/planning/planningCart.utils.ts"
import type { MealieReadPlanEntry } from "@/shared/types/mealie/MealPlan.ts"
import { formatDate } from "@/shared/utils/date.ts"

interface UsePlanningCartSelectionParams {
  days: Date[]
  mealPlans: MealieReadPlanEntry[]
  loadPlanningRecipes: (recipes: Array<{ slug: string }>) => Promise<PlanningCartRecipe[]>
}

export function usePlanningCartSelection({
  days,
  mealPlans,
  loadPlanningRecipes,
}: UsePlanningCartSelectionParams) {
  const [cartDialogOpen, setCartDialogOpen] = useState(false)
  const [cartRecipes, setCartRecipes] = useState<PlanningCartRecipe[]>([])
  const [cartSelectionMode, setCartSelectionMode] = useState(false)
  const [selectedCartMealIds, setSelectedCartMealIds] = useState<number[]>([])

  const visiblePlanningDays = useMemo<VisiblePlanningDay[]>(() => (
    days.map((date) => ({
      date: formatDate(date),
      label: date.toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
      }),
    }))
  ), [days])

  const visiblePlanningDateSet = useMemo(
    () => new Set(visiblePlanningDays.map((day) => day.date)),
    [visiblePlanningDays],
  )
  const visibleRecipeMeals = useMemo(
    () => mealPlans.filter((meal) => (
      visiblePlanningDateSet.has(meal.date)
      && Boolean(meal.recipe?.slug)
      && Boolean(meal.recipe?.name)
    )),
    [mealPlans, visiblePlanningDateSet],
  )
  const visibleRecipeMealIds = useMemo(
    () => visibleRecipeMeals.map((meal) => meal.id),
    [visibleRecipeMeals],
  )
  const visibleRecipeMealIdSet = useMemo(
    () => new Set(visibleRecipeMealIds),
    [visibleRecipeMealIds],
  )
  const selectedVisibleMealIds = useMemo(
    () => selectedCartMealIds.filter((mealId) => visibleRecipeMealIdSet.has(mealId)),
    [selectedCartMealIds, visibleRecipeMealIdSet],
  )
  const selectedVisibleMealIdSet = useMemo(
    () => new Set(selectedVisibleMealIds),
    [selectedVisibleMealIds],
  )

  const selectedVisibleCount = selectedVisibleMealIds.length
  const allVisibleRecipesSelected = visibleRecipeMealIds.length > 0
    && selectedVisibleMealIds.length === visibleRecipeMealIds.length
  const someVisibleRecipesSelected = selectedVisibleMealIds.length > 0
    && selectedVisibleMealIds.length < visibleRecipeMealIds.length

  const getRecipeMealsForDate = useCallback((date: string) => (
    visibleRecipeMeals.filter((meal) => meal.date === date)
  ), [visibleRecipeMeals])

  const getDaySelectionState = useCallback((date: string) => {
    const mealIds = getRecipeMealsForDate(date).map((meal) => meal.id)
    const selectedCount = mealIds.filter((mealId) => selectedVisibleMealIdSet.has(mealId)).length

    return {
      mealIds,
      checked: mealIds.length > 0 && selectedCount === mealIds.length,
      indeterminate: selectedCount > 0 && selectedCount < mealIds.length,
    }
  }, [getRecipeMealsForDate, selectedVisibleMealIdSet])

  const handleToggleMealSelection = useCallback((mealId: number, checked: boolean) => {
    setSelectedCartMealIds((current) => {
      const next = new Set(current)
      if (checked) next.add(mealId)
      else next.delete(mealId)
      return [...next]
    })
  }, [])

  const handleToggleDaySelection = useCallback((date: string, checked: boolean) => {
    const mealIds = getRecipeMealsForDate(date).map((meal) => meal.id)
    setSelectedCartMealIds((current) => {
      const next = new Set(current)
      mealIds.forEach((mealId) => {
        if (checked) next.add(mealId)
        else next.delete(mealId)
      })
      return [...next]
    })
  }, [getRecipeMealsForDate])

  const handleToggleAllVisibleSelection = useCallback((checked: boolean) => {
    setSelectedCartMealIds(checked ? visibleRecipeMealIds : [])
  }, [visibleRecipeMealIds])

  const handleCancelCartSelection = useCallback(() => {
    setCartSelectionMode(false)
    setSelectedCartMealIds([])
  }, [])

  const handleCartAction = useCallback(async () => {
    if (!cartSelectionMode) {
      setCartSelectionMode(true)
      setSelectedCartMealIds([])
      return
    }

    if (selectedVisibleMealIds.length === 0) return

    setCartRecipes([])

    try {
      const selectedMeals = visibleRecipeMeals
        .filter((meal) => selectedVisibleMealIdSet.has(meal.id))
        .map((meal) => ({ slug: meal.recipe!.slug! }))

      const recipes = await loadPlanningRecipes(selectedMeals)
      setCartRecipes(recipes)
      setCartDialogOpen(true)
      setCartSelectionMode(false)
      setSelectedCartMealIds([])
    } catch {
      // Errors are handled by the shopping hook state.
    }
  }, [
    cartSelectionMode,
    loadPlanningRecipes,
    selectedVisibleMealIdSet,
    selectedVisibleMealIds.length,
    visibleRecipeMeals,
  ])

  return {
    cartDialogOpen,
    setCartDialogOpen,
    cartRecipes,
    cartSelectionMode,
    selectedVisibleCount,
    selectedVisibleMealIdSet,
    visiblePlanningDays,
    visibleRecipeMealIds,
    allVisibleRecipesSelected,
    someVisibleRecipesSelected,
    handleToggleMealSelection,
    handleToggleDaySelection,
    handleToggleAllVisibleSelection,
    handleCancelCartSelection,
    handleCartAction,
    getDaySelectionState,
  }
}
