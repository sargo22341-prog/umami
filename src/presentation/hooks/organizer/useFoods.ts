import { useCallback, useEffect, useState } from "react"
import { getFoodsUseCase } from "@/infrastructure/container.ts"
import type { MealieIngredientFoodOutput } from "@/shared/types/mealie/food.ts"

interface UseFoodsOptions {
  enabled?: boolean
}

let foodsCache: MealieIngredientFoodOutput[] | null = null
let foodsPromise: Promise<MealieIngredientFoodOutput[]> | null = null

async function loadFoods(): Promise<MealieIngredientFoodOutput[]> {
  if (foodsCache) return foodsCache
  if (foodsPromise) return foodsPromise

  foodsPromise = getFoodsUseCase.execute()
    .then((data) => {
      foodsCache = data
      return data
    })
    .finally(() => {
      foodsPromise = null
    })

  return foodsPromise
}

export function useFoods({ enabled = true }: UseFoodsOptions = {}) {
  const [foods, setFoods] = useState<MealieIngredientFoodOutput[]>(() => foodsCache ?? [])
  const [loading, setLoading] = useState(enabled && foodsCache === null)

  const ensureLoaded = useCallback(async () => {
    if (foodsCache) {
      setFoods(foodsCache)
      setLoading(false)
      return foodsCache
    }

    setLoading(true)
    try {
      const data = await loadFoods()
      setFoods(data)
      return data
    } catch {
      setFoods([])
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!enabled) return
    void ensureLoaded()
  }, [enabled, ensureLoaded])

  return { foods, loading, ensureLoaded }
}
