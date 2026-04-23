import { useCallback } from "react"

import type { ShoppingItem } from "@/domain/shopping/entities/ShoppingItem.ts"
import {
  createFoodDetailedUseCase,
  getUnitsUseCase,
  shoppingRepository,
} from "@/infrastructure/container.ts"
import { extractFoodKey } from "@/shared/utils/food.ts"
import { convertQuantityToStandardUnit } from "@/shared/utils/unitStandardization.ts"
import { buildUpdatePayload, findUnitById, itemDisplayName } from "hooks/shopping/useShopping.shared.ts"

interface UseShoppingCellierActionsParams {
  cellierListId: string | null
  cellierItems: ShoppingItem[]
  setCellierItems: React.Dispatch<React.SetStateAction<ShoppingItem[]>>
  setClearingCellier: React.Dispatch<React.SetStateAction<boolean>>
  setError: React.Dispatch<React.SetStateAction<string | null>>
  loadItems: () => Promise<void>
  refreshCellierList: (listId?: string) => Promise<void>
}

export function useShoppingCellierActions({
  cellierListId,
  cellierItems,
  setCellierItems,
  setClearingCellier,
  setError,
  loadItems,
  refreshCellierList,
}: UseShoppingCellierActionsParams) {
  const loadUnitsForStandardization = useCallback(async () => {
    return getUnitsUseCase.execute()
  }, [])

  const addCellierItem = useCallback(async (params: {
    name: string
    quantity: number
    unitId?: string
    foodId?: string
  }) => {
    if (!cellierListId) return
    const availableUnits = await loadUnitsForStandardization()
    const selectedUnit = findUnitById(availableUnits, params.unitId)
    const standardized = convertQuantityToStandardUnit(selectedUnit, params.quantity, availableUnits)
    const targetQuantity = standardized.quantity ?? params.quantity
    const targetUnitId = standardized.unitId
    const targetUnit = standardized.unit ?? undefined
    let foodId = params.foodId
    let note = params.name.trim()

    if (!foodId) {
      const createdFood = await createFoodDetailedUseCase.execute({ name: note })
      foodId = createdFood.id
      note = createdFood.name
    }

    const existing = cellierItems.find((item) => (
      (
        item.food?.id === foodId ||
        extractFoodKey(itemDisplayName(item)) === extractFoodKey(note)
      ) &&
      (item.unit?.id ?? "") === (targetUnitId ?? "")
    ))

    if (existing) {
      const updated = await shoppingRepository.updateItem(
        cellierListId,
        buildUpdatePayload(cellierListId, existing, {
          quantity: (existing.quantity ?? 0) + targetQuantity,
          unitId: targetUnitId ?? existing.unit?.id,
        }),
      )
      setCellierItems((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
      return
    }

    await shoppingRepository.addItem(cellierListId, {
      shoppingListId: cellierListId,
      note,
      quantity: targetQuantity,
      foodId,
      unitId: targetUnitId,
      unit: targetUnit,
    })

    await refreshCellierList(cellierListId)
  }, [cellierItems, cellierListId, loadUnitsForStandardization, refreshCellierList, setCellierItems])

  const updateCellierQuantity = useCallback(async (item: ShoppingItem, quantity: number) => {
    if (!cellierListId) return
    setCellierItems((prev) => prev.map((entry) => (entry.id === item.id ? { ...entry, quantity } : entry)))

    try {
      await shoppingRepository.updateItem(cellierListId, buildUpdatePayload(cellierListId, item, { quantity }))
    } catch (err) {
      setCellierItems((prev) => prev.map((entry) => (entry.id === item.id ? { ...entry, quantity: item.quantity } : entry)))
      setError(err instanceof Error ? err.message : "Erreur lors de la mise a jour du cellier")
    }
  }, [cellierListId, setCellierItems, setError])

  const deleteCellierItem = useCallback(async (itemId: string) => {
    if (!cellierListId) return
    setCellierItems((prev) => prev.filter((item) => item.id !== itemId))

    try {
      await shoppingRepository.deleteItem(cellierListId, itemId)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la suppression")
      void loadItems()
    }
  }, [cellierListId, loadItems, setCellierItems, setError])

  const deleteAllCellier = useCallback(async () => {
    if (!cellierListId) return
    const snapshot = cellierItems
    setClearingCellier(true)

    try {
      await shoppingRepository.deleteAllItems(cellierListId, snapshot)
      setCellierItems([])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors du vidage du cellier")
      void loadItems()
    } finally {
      setClearingCellier(false)
    }
  }, [cellierItems, cellierListId, loadItems, setClearingCellier, setCellierItems, setError])

  return {
    addCellierItem,
    updateCellierQuantity,
    deleteCellierItem,
    deleteAllCellier,
  }
}
