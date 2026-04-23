import { useCallback, useEffect, useRef, useState } from "react"
import type { MealieReadPlanEntry } from "@/shared/types/mealie/MealPlan.ts"
import {
  getWeekPlanningUseCase,
  addMealUseCase,
  deleteMealUseCase,
} from "@/infrastructure/container.ts"
import { addDays, formatDate, startOfDay } from "@/shared/utils/date.ts"

const PREFETCH_MARGIN = 14

export function usePlanning() {
  const [centerDate, setCenterDate] = useState<Date>(() => startOfDay(new Date()))
  const [nbDays, setNbDays] = useState<3 | 5 | 7 | 14>(7)
  const [mealPlans, setMealPlans] = useState<MealieReadPlanEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingMealIds, setDeletingMealIds] = useState<number[]>([])

  const fetchedRange = useRef<{ start: string; end: string } | null>(null)
  const prefetching = useRef(false)

  const fetchRange = useCallback(async (start: string, end: string, silent = false) => {
    if (!silent) {
      setLoading(true)
      setError(null)
    }
    try {
      const data = await getWeekPlanningUseCase.execute(start, end)
      setMealPlans((prev) => {
        const outside = prev.filter((m) => m.date < start || m.date > end)
        return [...outside, ...data]
      })
      fetchedRange.current = {
        start: fetchedRange.current
          ? fetchedRange.current.start < start ? fetchedRange.current.start : start
          : start,
        end: fetchedRange.current
          ? fetchedRange.current.end > end ? fetchedRange.current.end : end
          : end,
      }
    } catch (err) {
      if (!silent) setError(err instanceof Error ? err.message : "Une erreur est survenue")
    } finally {
      if (!silent) setLoading(false)
      prefetching.current = false
    }
  }, [])

  useEffect(() => {
    const visibleStart = formatDate(addDays(centerDate, -1))
    const visibleEnd = formatDate(addDays(centerDate, nbDays))

    const cached = fetchedRange.current
    const isCovered =
      cached !== null && visibleStart >= cached.start && visibleEnd <= cached.end

    if (!isCovered) {
      const fetchStart = formatDate(addDays(centerDate, -PREFETCH_MARGIN))
      const fetchEnd = formatDate(addDays(centerDate, PREFETCH_MARGIN))
      void fetchRange(fetchStart, fetchEnd, false)
      return
    }

    if (!prefetching.current && cached) {
      const nearStart = visibleStart <= formatDate(addDays(new Date(cached.start), 3))
      const nearEnd = visibleEnd >= formatDate(addDays(new Date(cached.end), -3))

      if (nearStart || nearEnd) {
        prefetching.current = true
        const fetchStart = formatDate(addDays(centerDate, -PREFETCH_MARGIN))
        const fetchEnd = formatDate(addDays(centerDate, PREFETCH_MARGIN))
        void fetchRange(fetchStart, fetchEnd, true)
      }
    }
  }, [centerDate, nbDays, fetchRange])

  const goToPrevDay = () => setCenterDate((prev) => addDays(prev, -1))
  const goToNextDay = () => setCenterDate((prev) => addDays(prev, 1))
  const goToPrevPeriod = () => setCenterDate((prev) => addDays(prev, -nbDays))
  const goToNextPeriod = () => setCenterDate((prev) => addDays(prev, nbDays))
  const goToToday = () => setCenterDate(startOfDay(new Date()))
  const goToTodayMobile = () => setCenterDate(startOfDay(new Date()))

  const addMeal = useCallback(async (date: string, entryType: string, recipeId?: string, title?: string, text?: string) => {
    const newMeal = await addMealUseCase.execute(date, entryType, recipeId, title, text)
    setMealPlans((prev) => [...prev, newMeal])
  }, [])

  const deleteMeal = useCallback(async (id: number) => {
    setDeletingMealIds((prev) => (prev.includes(id) ? prev : [...prev, id]))
    setError(null)
    try {
      await deleteMealUseCase.execute(id)
      setMealPlans((prev) => prev.filter((m) => m.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue")
    } finally {
      setDeletingMealIds((prev) => prev.filter((mealId) => mealId !== id))
    }
  }, [])

  return {
    mealPlans,
    loading,
    error,
    deletingMealIds,
    centerDate,
    nbDays,
    setNbDays,
    goToPrevDay,
    goToNextDay,
    goToPrevPeriod,
    goToNextPeriod,
    goToToday,
    goToTodayMobile,
    addMeal,
    deleteMeal,
  }
}
