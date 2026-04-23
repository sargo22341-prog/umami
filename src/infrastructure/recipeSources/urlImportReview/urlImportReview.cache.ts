import { getFoodsUseCase, getUnitsUseCase } from "../../container.ts"
import type { MealieIngredientFoodOutput } from "@/shared/types/mealie/food.ts"
import type { MealieIngredientUnitOutput } from "@/shared/types/mealie/Units.ts"

let cachedUnits: MealieIngredientUnitOutput[] | null = null
let cachedUnitsPromise: Promise<MealieIngredientUnitOutput[]> | null = null
let cachedFoods: MealieIngredientFoodOutput[] | null = null
let cachedFoodsPromise: Promise<MealieIngredientFoodOutput[]> | null = null

export async function getCachedUnits() {
  if (cachedUnits) return cachedUnits

  if (!cachedUnitsPromise) {
    cachedUnitsPromise = getUnitsUseCase.execute()
      .then((items) => {
        cachedUnits = items
        cachedUnitsPromise = null
        return items
      })
      .catch((error) => {
        cachedUnitsPromise = null
        throw error
      })
  }

  return cachedUnitsPromise
}

export async function getCachedFoods() {
  if (cachedFoods) return cachedFoods

  if (!cachedFoodsPromise) {
    cachedFoodsPromise = getFoodsUseCase.execute()
      .then((items) => {
        cachedFoods = items
        cachedFoodsPromise = null
        return items
      })
      .catch((error) => {
        cachedFoodsPromise = null
        throw error
      })
  }

  return cachedFoodsPromise
}

export function updateCachedFood(updatedFood: MealieIngredientFoodOutput) {
  if (!cachedFoods) return

  cachedFoods = cachedFoods.map((item) => (item.id === updatedFood.id ? updatedFood : item))
}
