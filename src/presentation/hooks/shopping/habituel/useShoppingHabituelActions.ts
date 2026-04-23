import { useCallback } from "react"

import type { ShoppingItem, ShoppingLabel, ShoppingList } from "@/domain/shopping/entities/ShoppingItem.ts"
import {
  createFoodDetailedUseCase,
  getUnitsUseCase,
  shoppingRepository,
  updateFoodUseCase,
} from "@/infrastructure/container.ts"
import { extractFoodKey } from "@/shared/utils/food.ts"
import { convertQuantityToStandardUnit } from "@/shared/utils/unitStandardization.ts"
import {
  buildUpdatePayload,
  findUnitById,
  itemDisplayName,
  updateItemFoodMetadata,
} from "hooks/shopping/useShopping.shared.ts"

interface UseShoppingHabituelActionsParams {
  list: ShoppingList | null
  items: ShoppingItem[]
  labels: ShoppingLabel[]
  habituelsListId: string | null
  habituelsItems: ShoppingItem[]
  setItems: React.Dispatch<React.SetStateAction<ShoppingItem[]>>
  setHabituelsItems: React.Dispatch<React.SetStateAction<ShoppingItem[]>>
  setClearingHabituels: React.Dispatch<React.SetStateAction<boolean>>
  setError: React.Dispatch<React.SetStateAction<string | null>>
  loadItems: () => Promise<void>
  refreshDefaultList: (listId?: string) => Promise<void>
  refreshHabituelsList: (listId?: string) => Promise<void>
}

export function useShoppingHabituelActions({
  list,
  items,
  labels,
  habituelsListId,
  habituelsItems,
  setItems,
  setHabituelsItems,
  setClearingHabituels,
  setError,
  loadItems,
  refreshDefaultList,
  refreshHabituelsList,
}: UseShoppingHabituelActionsParams) {
  const loadUnitsForStandardization = useCallback(async () => {
    return getUnitsUseCase.execute()
  }, [])

  const applyFoodUpdateLocally = useCallback((foodId: string, nextName: string, nextLabelId: string | null) => {
    const nextLabel = nextLabelId ? labels.find((label) => label.id === nextLabelId) : undefined

    setHabituelsItems((prev) =>
      prev.map((entry) => (
        entry.food?.id === foodId
          ? {
            ...updateItemFoodMetadata(entry, nextName, nextLabelId, nextLabel),
            note: nextName,
          }
          : entry
      )),
    )

    setItems((prev) =>
      prev.map((entry) => (
        entry.food?.id === foodId
          ? updateItemFoodMetadata(entry, nextName, nextLabelId, nextLabel)
          : entry
      )),
    )
  }, [labels, setHabituelsItems, setItems])

  const addHabituel = useCallback(async (params: { name: string; labelId?: string; foodId?: string }) => {
    if (!habituelsListId) return
    let foodId = params.foodId
    let note = params.name.trim()

    if (!foodId) {
      const createdFood = await createFoodDetailedUseCase.execute({
        name: note,
        labelId: params.labelId || null,
      })
      foodId = createdFood.id
      note = createdFood.name
    }

    await shoppingRepository.addItem(habituelsListId, {
      shoppingListId: habituelsListId,
      note,
      labelId: params.labelId,
      foodId,
    })

    await refreshHabituelsList(habituelsListId)
  }, [habituelsListId, refreshHabituelsList])

  const deleteHabituel = useCallback(async (itemId: string) => {
    if (!habituelsListId) return
    setHabituelsItems((prev) => prev.filter((entry) => entry.id !== itemId))

    try {
      await shoppingRepository.deleteItem(habituelsListId, itemId)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la suppression")
      void loadItems()
    }
  }, [habituelsListId, loadItems, setError, setHabituelsItems])

  const updateHabituelLabel = useCallback(async (item: ShoppingItem, labelId: string | undefined) => {
    const nextLabel = labelId ? labels.find((label) => label.id === labelId) : undefined
    setHabituelsItems((prev) => prev.map((entry) => (entry.id === item.id ? { ...entry, label: nextLabel } : entry)))

    try {
      if (item.food?.id) {
        const updatedFood = await updateFoodUseCase.execute(item.food.id, {
          name: item.food.name,
          labelId: labelId || null,
        })
        applyFoodUpdateLocally(updatedFood.id, updatedFood.name, updatedFood.labelId ?? null)
        return
      }

      if (!habituelsListId) return
      await shoppingRepository.updateItem(
        habituelsListId,
        buildUpdatePayload(habituelsListId, item, { labelId: labelId || undefined }),
      )
    } catch (err) {
      setHabituelsItems((prev) => prev.map((entry) => (entry.id === item.id ? { ...entry, label: item.label } : entry)))
      setError(err instanceof Error ? err.message : "Erreur lors de la mise a jour")
    }
  }, [applyFoodUpdateLocally, habituelsListId, labels, setError, setHabituelsItems])

  const updateHabituelNote = useCallback(async (item: ShoppingItem, note: string) => {
    setHabituelsItems((prev) => prev.map((entry) => (
      entry.id === item.id
        ? {
          ...entry,
          note,
          food: entry.food ? { ...entry.food, name: note } : entry.food,
        }
        : entry
    )))

    try {
      if (item.food?.id) {
        const updatedFood = await updateFoodUseCase.execute(item.food.id, {
          name: note,
          labelId: item.label?.id,
        })
        applyFoodUpdateLocally(updatedFood.id, updatedFood.name, updatedFood.labelId ?? null)
        return
      }

      if (!habituelsListId) return
      await shoppingRepository.updateItem(habituelsListId, buildUpdatePayload(habituelsListId, item, { note }))
    } catch (err) {
      setHabituelsItems((prev) => prev.map((entry) => (
        entry.id === item.id
          ? {
            ...entry,
            note: item.note,
            food: item.food,
          }
          : entry
      )))
      setError(err instanceof Error ? err.message : "Erreur lors de la mise a jour")
    }
  }, [applyFoodUpdateLocally, habituelsListId, setError, setHabituelsItems])

  const addHabituelToCart = useCallback(async (item: ShoppingItem) => {
    if (!list) return
    const key = extractFoodKey(itemDisplayName(item))
    const availableUnits = await loadUnitsForStandardization()
    const standardized = convertQuantityToStandardUnit(item.unit, 1, availableUnits)
    const targetUnitId = standardized.unitId
    const targetUnit = standardized.unit ?? undefined
    const existing = key
      ? items.find((entry) => {
        const itemKey = extractFoodKey(itemDisplayName(entry))
        const sameUnit = (entry.unit?.id ?? "") === (targetUnitId ?? "")
        return itemKey && itemKey === key && sameUnit
      })
      : undefined

    if (existing) {
      await shoppingRepository.updateItem(
        list.id,
        buildUpdatePayload(list.id, existing, { quantity: (existing.quantity ?? 1) + 1 }),
      )
    } else {
      const cleanNote = key || item.food?.name || item.note
      await shoppingRepository.addItem(list.id, {
        shoppingListId: list.id,
        note: cleanNote,
        quantity: standardized.quantity,
        foodId: item.food?.id,
        unitId: targetUnitId,
        unit: targetUnit,
        labelId: item.label?.id,
      })
    }

    await refreshDefaultList(list.id)
  }, [items, list, loadUnitsForStandardization, refreshDefaultList])

  const addHabituelSelectionToCart = useCallback(async (
    selections: Array<{ item: ShoppingItem; quantity: number; unitId?: string; note?: string }>,
  ) => {
    if (!list || selections.length === 0) return

    const currentItems = [...items]
    const availableUnits = await loadUnitsForStandardization()

    for (const selection of selections) {
      const quantity = Math.max(1, selection.quantity || 1)
      const selectedUnit = findUnitById(availableUnits, selection.unitId)
      const standardized = convertQuantityToStandardUnit(selectedUnit, quantity, availableUnits)
      const targetQuantity = standardized.quantity ?? quantity
      const targetUnitId = standardized.unitId
      const targetUnit = standardized.unit ?? undefined
      const baseName = itemDisplayName(selection.item)
      const customNote = selection.note?.trim() || undefined
      const payloadNote = customNote || (!selection.item.food?.id ? baseName : undefined)
      const normalizedKey = extractFoodKey(baseName)

      const matchingItem = currentItems.find((entry) => {
        const sameFoodId =
          selection.item.food?.id &&
          entry.food?.id &&
          selection.item.food.id === entry.food.id
        const sameKey =
          normalizedKey &&
          extractFoodKey(itemDisplayName(entry)) === normalizedKey
        const sameUnit = (targetUnitId ?? "") === (entry.unit?.id ?? "")
        return (sameFoodId || sameKey) && sameUnit
      })

      if (matchingItem) {
        const updated = await shoppingRepository.updateItem(
          list.id,
          buildUpdatePayload(list.id, matchingItem, {
            note: customNote ?? matchingItem.note,
            quantity: (matchingItem.quantity ?? 0) + targetQuantity,
            unitId: targetUnitId ?? matchingItem.unit?.id,
          }),
        )
        const index = currentItems.findIndex((entry) => entry.id === matchingItem.id)
        if (index >= 0) currentItems[index] = updated
        continue
      }

      await shoppingRepository.addItem(list.id, {
        shoppingListId: list.id,
        note: payloadNote,
        quantity: targetQuantity,
        foodId: selection.item.food?.id,
        unitId: targetUnitId,
        unit: targetUnit,
        labelId: selection.item.label?.id,
      })
    }

    await refreshDefaultList(list.id)
  }, [items, list, loadUnitsForStandardization, refreshDefaultList])

  const deleteAllHabituels = useCallback(async () => {
    if (!habituelsListId) return
    const snapshot = habituelsItems
    setClearingHabituels(true)

    try {
      await shoppingRepository.deleteAllItems(habituelsListId, snapshot)
      setHabituelsItems([])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors du vidage")
      void loadItems()
    } finally {
      setClearingHabituels(false)
    }
  }, [habituelsItems, habituelsListId, loadItems, setClearingHabituels, setError, setHabituelsItems])

  return {
    addHabituel,
    deleteHabituel,
    updateHabituelLabel,
    updateHabituelNote,
    addHabituelToCart,
    addHabituelSelectionToCart,
    deleteAllHabituels,
  }
}
