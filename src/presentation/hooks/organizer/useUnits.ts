import { useCallback, useEffect, useState } from "react"
import { getUnitsUseCase } from "@/infrastructure/container.ts"
import type { MealieIngredientUnitOutput } from "@/shared/types/mealie/Units.ts"

interface UseUnitsOptions {
  enabled?: boolean
}

let unitsCache: MealieIngredientUnitOutput[] | null = null
let unitsPromise: Promise<MealieIngredientUnitOutput[]> | null = null

async function loadUnits(): Promise<MealieIngredientUnitOutput[]> {
  if (unitsCache) return unitsCache
  if (unitsPromise) return unitsPromise

  unitsPromise = getUnitsUseCase.execute()
    .then((data) => {
      unitsCache = data
      return data
    })
    .finally(() => {
      unitsPromise = null
    })

  return unitsPromise
}

export function useUnits({ enabled = true }: UseUnitsOptions = {}) {
  const [units, setUnits] = useState<MealieIngredientUnitOutput[]>(() => unitsCache ?? [])
  const [loading, setLoading] = useState(enabled && unitsCache === null)

  const ensureLoaded = useCallback(async () => {
    if (unitsCache) {
      setUnits(unitsCache)
      setLoading(false)
      return unitsCache
    }

    setLoading(true)
    try {
      const data = await loadUnits()
      setUnits(data)
      return data
    } catch {
      setUnits([])
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!enabled) return
    void ensureLoaded()
  }, [enabled, ensureLoaded])

  return { units, loading, ensureLoaded }
}
