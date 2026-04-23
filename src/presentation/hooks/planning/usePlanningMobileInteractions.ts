import { useCallback, useEffect, useRef, useState } from "react"

import type { MealieReadPlanEntry } from "@/shared/types/mealie/MealPlan.ts"
import { DRAG_THRESHOLD } from "../../pages/planning/planningPage.constants.ts"

interface UsePlanningMobileInteractionsParams {
  onDrop: (draggedMeal: MealieReadPlanEntry, targetDate: string, targetType: string) => Promise<void>
}

export function usePlanningMobileInteractions({ onDrop }: UsePlanningMobileInteractionsParams) {
  const [mobileMenuMeal, setMobileMenuMeal] = useState<{ meal: MealieReadPlanEntry; y: number } | null>(null)
  const [ghostState, setGhostState] = useState<{ meal: MealieReadPlanEntry; x: number; y: number } | null>(null)
  const [mobileDragOver, setMobileDragOver] = useState<{ date: string; type: string } | null>(null)

  const mobileMenuMealRef = useRef<((data: { meal: MealieReadPlanEntry; y: number } | null) => void) | null>(null)
  const touchDragRef = useRef<{
    meal: MealieReadPlanEntry
    startX: number
    startY: number
    active: boolean
    longPressReady: boolean
  } | null>(null)
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const handleDropRef = useRef(onDrop)

  useEffect(() => {
    mobileMenuMealRef.current = setMobileMenuMeal
  }, [])

  useEffect(() => {
    handleDropRef.current = onDrop
  }, [onDrop])

  const handleMealTouchStart = useCallback((meal: MealieReadPlanEntry, event: React.TouchEvent) => {
    const touch = event.touches[0]
    touchDragRef.current = {
      meal,
      startX: touch.clientX,
      startY: touch.clientY,
      active: false,
      longPressReady: false,
    }

    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current)

    longPressTimerRef.current = setTimeout(() => {
      if (touchDragRef.current) {
        touchDragRef.current.longPressReady = true
      }
    }, 400)
  }, [])

  useEffect(() => {
    const onTouchMove = (event: TouchEvent) => {
      if (!touchDragRef.current) return
      if (!touchDragRef.current.longPressReady) return

      const touch = event.touches[0]
      const dx = touch.clientX - touchDragRef.current.startX
      const dy = touch.clientY - touchDragRef.current.startY

      if (!touchDragRef.current.active && Math.sqrt(dx * dx + dy * dy) > DRAG_THRESHOLD) {
        touchDragRef.current.active = true
      }

      if (touchDragRef.current.active) {
        event.preventDefault()
        setGhostState({ meal: touchDragRef.current.meal, x: touch.clientX, y: touch.clientY })

        const element = document.elementFromPoint(touch.clientX, touch.clientY)
        const slot = element?.closest<HTMLElement>("[data-date][data-type]")
        setMobileDragOver(slot ? { date: slot.dataset.date!, type: slot.dataset.type! } : null)
      }
    }

    const onTouchEnd = (event: TouchEvent) => {
      if (!touchDragRef.current) return

      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current)
        longPressTimerRef.current = null
      }

      if (touchDragRef.current.active) {
        const touch = event.changedTouches[0]
        const element = document.elementFromPoint(touch.clientX, touch.clientY)
        const slot = element?.closest<HTMLElement>("[data-date][data-type]")
        if (slot) {
          void handleDropRef.current(touchDragRef.current.meal, slot.dataset.date!, slot.dataset.type!)
        }
      } else if (!touchDragRef.current.longPressReady) {
        const touch = event.changedTouches[0]
        mobileMenuMealRef.current?.({ meal: touchDragRef.current.meal, y: touch.clientY })
      }

      touchDragRef.current = null
      setGhostState(null)
      setMobileDragOver(null)
    }

    document.addEventListener("touchmove", onTouchMove, { passive: false })
    document.addEventListener("touchend", onTouchEnd)

    return () => {
      document.removeEventListener("touchmove", onTouchMove)
      document.removeEventListener("touchend", onTouchEnd)
    }
  }, [])

  return {
    mobileMenuMeal,
    setMobileMenuMeal,
    ghostState,
    mobileDragOver,
    handleMealTouchStart,
  }
}
