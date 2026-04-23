import { useCallback, useEffect, useRef, useState } from "react"

import type { ShoppingItem, ShoppingLabel, ShoppingList } from "@/domain/shopping/entities/ShoppingItem.ts"
import {
  getShoppingItemsUseCase,
  shoppingRepository,
} from "@/infrastructure/container.ts"
import { useShoppingCellierActions } from "./cellier/useShoppingCellierActions.ts"
import { useShoppingHabituelActions } from "./habituel/useShoppingHabituelActions.ts"
import { useShoppingListActions } from "./useShoppingListActions.ts"

export function useShopping() {
  const [list, setList] = useState<ShoppingList | null>(null)
  const [items, setItems] = useState<ShoppingItem[]>([])
  const [labels, setLabels] = useState<ShoppingLabel[]>([])
  const [habituelsListId, setHabituelsListId] = useState<string | null>(null)
  const [habituelsItems, setHabituelsItems] = useState<ShoppingItem[]>([])
  const [cellierListId, setCellierListId] = useState<string | null>(null)
  const [cellierItems, setCellierItems] = useState<ShoppingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [clearingList, setClearingList] = useState(false)
  const [clearingHabituels, setClearingHabituels] = useState(false)
  const [clearingCellier, setClearingCellier] = useState(false)
  const [addingRecipes, setAddingRecipes] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const initialized = useRef(false)

  const refreshDefaultList = useCallback(async (listId = list?.id) => {
    if (!listId) return
    const result = await shoppingRepository.getItems(listId)
    setItems(result.items)
    setLabels(result.labels)
  }, [list?.id])

  const refreshHabituelsList = useCallback(async (listId = habituelsListId) => {
    if (!listId) return
    const result = await shoppingRepository.getItems(listId)
    setHabituelsItems(result.items)
  }, [habituelsListId])

  const refreshCellierList = useCallback(async (listId = cellierListId) => {
    if (!listId) return
    const result = await shoppingRepository.getItems(listId)
    setCellierItems(result.items)
  }, [cellierListId])

  const loadItems = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await getShoppingItemsUseCase.execute()
      setList(result.list)
      setItems(result.items)
      setLabels(result.labels)
      setHabituelsListId(result.habituelsListId)
      setHabituelsItems(result.habituelsItems)
      setCellierListId(result.cellierListId)
      setCellierItems(result.cellierItems)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors du chargement")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    void loadItems()
  }, [loadItems])

  const listActions = useShoppingListActions({
    list,
    items,
    labels,
    setItems,
    setAddingRecipes,
    setClearingList,
    setError,
    loadItems,
    refreshDefaultList,
  })

  const habituelActions = useShoppingHabituelActions({
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
  })

  const cellierActions = useShoppingCellierActions({
    cellierListId,
    cellierItems,
    setCellierItems,
    setClearingCellier,
    setError,
    loadItems,
    refreshCellierList,
  })

  return {
    list,
    items,
    labels,
    habituelsListId,
    habituelsItems,
    cellierListId,
    cellierItems,
    loading,
    clearingList,
    clearingHabituels,
    clearingCellier,
    addingRecipes,
    error,
    ...listActions,
    ...habituelActions,
    ...cellierActions,
    reload: loadItems,
  }
}
