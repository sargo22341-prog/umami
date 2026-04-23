import { useCallback, useEffect, useMemo, useState } from "react"
import {
  createFoodDetailedUseCase,
  deleteFoodUseCase,
  getFoodsUseCase,
  getLabelsUseCase,
  getPaginatedFoodsUseCase,
  mergeFoodsUseCase,
  updateFoodUseCase,
  userRepository,
} from "@/infrastructure/container.ts"
import type { MealieLabel } from "@/shared/types/mealie/Labels.ts"
import type { MealieIngredientFoodAlias, MealieIngredientFoodOutput } from "@/shared/types/mealie/food.ts"
import { buildFoodAliasesWithAddition } from "@/shared/utils/ingredientMatching.ts"

function sortFoodsByName(foods: MealieIngredientFoodOutput[]) {
  return [...foods].sort((a, b) => a.name.localeCompare(b.name, "fr", { sensitivity: "base" }))
}

type FoodSortKey = "name" | "pluralName" | "description" | "label" | "available"
type SortDirection = "asc" | "desc"

export function useFoodManagement(
  search: string,
  perPage: number,
  sortKey: FoodSortKey,
  sortDirection: SortDirection,
) {
  const [page, setPage] = useState(1)
  const [allFoods, setAllFoods] = useState<MealieIngredientFoodOutput[]>([])
  const [labels, setLabels] = useState<MealieLabel[]>([])
  const [householdSlug, setHouseholdSlug] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const [profile, foods, allLabels] = await Promise.all([
        userRepository.getSelf(),
        getFoodsUseCase.execute(),
        getLabelsUseCase.execute(),
      ])

      setHouseholdSlug(profile.householdSlug)
      setAllFoods(sortFoodsByName(foods))
      setLabels(allLabels)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de charger les aliments.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    setPage(1)
  }, [perPage, search])

  const filteredFoods = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return allFoods
    return allFoods.filter((food) =>
      [food.name, food.pluralName, food.description, food.label?.name]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    )
  }, [allFoods, search])

  const sortedFilteredFoods = useMemo(() => {
    const getFoodSortValue = (food: MealieIngredientFoodOutput) => {
      const available = householdSlug ? (food.householdsWithIngredientFood ?? []).includes(householdSlug) : false

      switch (sortKey) {
        case "name":
          return food.name
        case "pluralName":
          return food.pluralName ?? ""
        case "description":
          return food.description ?? ""
        case "label":
          return food.label?.name ?? ""
        case "available":
          return available ? "1" : "0"
        default:
          return ""
      }
    }

    return [...filteredFoods].sort((left, right) => {
      const leftValue = getFoodSortValue(left)
      const rightValue = getFoodSortValue(right)
      const comparison = leftValue.localeCompare(rightValue, "fr", { sensitivity: "base" })
      return sortDirection === "asc" ? comparison : -comparison
    })
  }, [filteredFoods, householdSlug, sortDirection, sortKey])

  const total = sortedFilteredFoods.length
  const totalPages = total > 0 ? Math.ceil(total / perPage) : 0
  const safePage = totalPages > 0 ? Math.min(page, totalPages) : 1
  const startIndex = (safePage - 1) * perPage
  const foods = sortedFilteredFoods.slice(startIndex, startIndex + perPage)

  const createFood = useCallback(async (payload: {
    name: string
    pluralName?: string | null
    description?: string | null
    labelId?: string | null
    aliases?: MealieIngredientFoodAlias[]
    available: boolean
  }) => {
    if (!householdSlug) {
      throw new Error("Foyer utilisateur introuvable.")
    }

    setSaving(true)
    setError(null)
    try {
      const created = await createFoodDetailedUseCase.execute({
        name: payload.name.trim(),
        pluralName: payload.pluralName ?? null,
        description: payload.description ?? "",
        labelId: payload.labelId ?? null,
        aliases: payload.aliases ?? [],
        householdsWithIngredientFood: payload.available ? [householdSlug] : [],
      })
      if (created) {
        setAllFoods((prev) => sortFoodsByName([...prev, created]))
      } else {
        const latest = await getPaginatedFoodsUseCase.execute(1, 1, undefined, "created_at", "desc")
        const latestItem = latest.items[0]
        if (latestItem) {
          setAllFoods((prev) => sortFoodsByName([latestItem, ...prev.filter((entry) => entry.id !== latestItem.id)]))
        } else {
          await load()
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Impossible d'ajouter l'aliment."
      setError(message)
      throw err instanceof Error ? err : new Error(message)
    } finally {
      setSaving(false)
    }
  }, [householdSlug, load])

  const updateFood = useCallback(async (food: MealieIngredientFoodOutput, payload: {
    name: string
    pluralName?: string | null
    description?: string | null
    labelId?: string | null
    aliases?: MealieIngredientFoodAlias[]
    available: boolean
  }) => {
    if (!householdSlug) {
      throw new Error("Foyer utilisateur introuvable.")
    }

    setSaving(true)
    setError(null)
    try {
      const households = new Set(food.householdsWithIngredientFood ?? [])
      if (payload.available) {
        households.add(householdSlug)
      } else {
        households.delete(householdSlug)
      }
      const updated = await updateFoodUseCase.execute(food.id, {
        name: payload.name.trim(),
        pluralName: payload.pluralName ?? null,
        description: payload.description ?? "",
        labelId: payload.labelId ?? null,
        aliases: payload.aliases ?? [],
        householdsWithIngredientFood: [...households],
      })
      setAllFoods((prev) => sortFoodsByName(prev.map((entry) => (entry.id === food.id ? updated : entry))))
    } catch (err) {
      const message = err instanceof Error ? err.message : "Impossible de modifier l'aliment."
      setError(message)
      throw err instanceof Error ? err : new Error(message)
    } finally {
      setSaving(false)
    }
  }, [householdSlug])

  const deleteFood = useCallback(async (foodId: string) => {
    setSaving(true)
    setError(null)
    try {
      await deleteFoodUseCase.execute(foodId)
      setAllFoods((prev) => prev.filter((entry) => entry.id !== foodId))
    } catch (err) {
      const message = err instanceof Error ? err.message : "Impossible de supprimer l'aliment."
      setError(message)
      throw err instanceof Error ? err : new Error(message)
    } finally {
      setSaving(false)
    }
  }, [])

  const deleteFoods = useCallback(async (foodIds: string[]) => {
    setSaving(true)
    setError(null)
    try {
      for (const foodId of foodIds) {
        await deleteFoodUseCase.execute(foodId)
      }
      const ids = new Set(foodIds)
      setAllFoods((prev) => prev.filter((entry) => !ids.has(entry.id)))
    } catch (err) {
      const message = err instanceof Error ? err.message : "Impossible de supprimer les aliments selectionnes."
      setError(message)
      throw err instanceof Error ? err : new Error(message)
    } finally {
      setSaving(false)
    }
  }, [])

  const mergeSelectedFoods = useCallback(async (selectedFoods: MealieIngredientFoodOutput[], winnerId: string) => {
    setSaving(true)
    setError(null)
    try {
      const winner = selectedFoods.find((food) => food.id === winnerId)
      if (!winner) {
        throw new Error("Aliment cible introuvable pour la fusion.")
      }

      let nextAliases = winner.aliases?.map((alias) => ({ name: alias.name })) ?? []
      let winnerWithAliases: MealieIngredientFoodOutput = {
        ...winner,
        aliases: nextAliases,
      }

      for (const food of selectedFoods) {
        if (food.id === winnerId) continue
        nextAliases = buildFoodAliasesWithAddition(winnerWithAliases, food.name)
        winnerWithAliases = {
          ...winnerWithAliases,
          aliases: nextAliases,
        }
      }

      const updatedWinner = await updateFoodUseCase.execute(winner.id, {
        name: winner.name,
        pluralName: winner.pluralName ?? null,
        description: winner.description ?? "",
        labelId: winner.labelId ?? null,
        aliases: nextAliases,
        householdsWithIngredientFood: winner.householdsWithIngredientFood ?? [],
        extras: winner.extras ?? null,
      })

      for (const food of selectedFoods) {
        if (food.id === winnerId) continue
        await mergeFoodsUseCase.execute({ fromFood: food.id, toFood: winnerId })
      }

      const losingIds = new Set(selectedFoods.filter((food) => food.id !== winnerId).map((food) => food.id))
      setAllFoods((prev) => sortFoodsByName(
        prev
          .filter((food) => !losingIds.has(food.id))
          .map((food) => (food.id === updatedWinner.id ? updatedWinner : food)),
      ))
    } catch (err) {
      const message = err instanceof Error ? err.message : "Impossible de fusionner les aliments selectionnes."
      setError(message)
      throw err instanceof Error ? err : new Error(message)
    } finally {
      setSaving(false)
    }
  }, [])

  useEffect(() => {
    if (page > 1 && totalPages > 0 && page > totalPages) {
      setPage(totalPages)
    }
  }, [page, totalPages])

  return {
    foods,
    allFoods,
    labels,
    householdSlug,
    total,
    page: safePage,
    totalPages,
    loading,
    saving,
    error,
    setPage,
    createFood,
    updateFood,
    deleteFood,
    deleteFoods,
    mergeSelectedFoods,
    assignLabelToFoods: async (foodIds: string[], labelId: string | null) => {
      if (!householdSlug) {
        throw new Error("Foyer utilisateur introuvable.")
      }

      setSaving(true)
      setError(null)
      try {
        for (const foodId of foodIds) {
          const food = allFoods.find((entry) => entry.id === foodId)
          if (!food) continue
          await updateFoodUseCase.execute(food.id, {
            name: food.name,
            pluralName: food.pluralName ?? null,
            description: food.description ?? "",
            labelId,
            householdsWithIngredientFood: food.householdsWithIngredientFood ?? [],
          })
        }

        await load()
      } catch (err) {
        const message = err instanceof Error ? err.message : "Impossible d'assigner le label selectionne."
        setError(message)
        throw err instanceof Error ? err : new Error(message)
      } finally {
        setSaving(false)
      }
    },
  }
}
