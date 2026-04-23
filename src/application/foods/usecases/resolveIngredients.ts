import type { IFoodRepository } from "@/domain/foods/IFoodRepository.ts"
import type { IUnitRepository } from "@/domain/units/IUnitRepository.ts"
import type { RecipeFormData, RecipeFormIngredient } from "@/shared/types/mealie/Recipes.ts"
import type { MealieIngredientUnitOutput } from "@/shared/types/mealie/Units.ts"
import type { MealieIngredientFoodOutput } from "@/shared/types/mealie/food.ts"

/**
 * Pour chaque ingrédient du formulaire :
 * - Si un foodId est déjà fourni, on le conserve.
 * - Sinon si un nom d'aliment est renseigné, on cherche dans le référentiel.
 *   Si l'aliment n'existe pas, on le crée.
 * - Même logique pour l'unité (lecture seule — on ne crée pas d'unité).
 *
 * Retourne un RecipeFormData enrichi avec les foodId/unitId résolus.
 */
export async function resolveIngredients(
  data: RecipeFormData,
  foodRepository: IFoodRepository,
  unitRepository: IUnitRepository,
): Promise<RecipeFormData> {
  const activeIngredients = data.recipeIngredient.filter(
    (ing) => ing.quantity || ing.unit || ing.food || ing.note,
  )

  if (activeIngredients.length === 0) {
    return data
  }

  const needsFoodResolution = activeIngredients.some((ing) => ing.food.trim() && !ing.foodId)
  const needsUnitResolution = activeIngredients.some((ing) => ing.unit.trim() && !ing.unitId)

  const [allFoods, allUnits] = await Promise.all([
    needsFoodResolution ? foodRepository.getAll() : Promise.resolve<MealieIngredientFoodOutput[]>([]),
    needsUnitResolution ? unitRepository.getAll() : Promise.resolve<MealieIngredientUnitOutput[]>([]),
  ])

  const foodCache = new Map<string, MealieIngredientFoodOutput>()
  for (const f of allFoods) {
    foodCache.set(f.name.toLowerCase().trim(), f)
  }

  const unitCache = new Map<string, MealieIngredientUnitOutput>()
  for (const u of allUnits) {
    unitCache.set(u.name.toLowerCase().trim(), u)
    if (u.abbreviation) {
      unitCache.set(u.abbreviation.toLowerCase().trim(), u)
    }
  }

  const resolvedIngredients: RecipeFormIngredient[] = []

  for (const ing of data.recipeIngredient) {
    const isEmpty = !ing.quantity && !ing.unit && !ing.food && !ing.note
    if (isEmpty) {
      continue
    }

    let foodId = ing.foodId
    const foodName = ing.food.trim()

    if (foodName && !foodId) {
      const key = foodName.toLowerCase()
      const existing = foodCache.get(key)
      if (existing) {
        foodId = existing.id
      } else {
        // L'aliment n'existe pas — on le crée
        const created = await foodRepository.create(foodName)
        foodId = created.id
        foodCache.set(key, created)
      }
    }

    let unitId = ing.unitId
    const unitName = ing.unit.trim()

    if (unitName && !unitId) {
      const key = unitName.toLowerCase()
      const existing = unitCache.get(key)
      if (existing) {
        unitId = existing.id
      }
      // On ne crée pas d'unité inexistante — on laisse unitId undefined
    }

    resolvedIngredients.push({ ...ing, foodId, unitId })
  }

  return { ...data, recipeIngredient: resolvedIngredients }
}
