import { useCallback } from "react"

import type { ClearMode } from "@/application/shopping/usecases/ClearListUseCase.ts"
import type { ShoppingItem, ShoppingLabel, ShoppingList } from "@/domain/shopping/entities/ShoppingItem.ts"
import {
  addItemUseCase,
  clearListUseCase,
  deleteItemUseCase,
  getRecipesByIdsUseCase,
  shoppingRepository,
  toggleItemUseCase,
} from "@/infrastructure/container.ts"
import { foodLabelStore } from "@/infrastructure/shopping/FoodLabelStore.ts"
import { extractFoodKey } from "@/shared/utils/food.ts"
import { buildUpdatePayload, itemDisplayName } from "./useShopping.shared.ts"

interface UseShoppingListActionsParams {
  list: ShoppingList | null
  items: ShoppingItem[]
  labels: ShoppingLabel[]
  setItems: React.Dispatch<React.SetStateAction<ShoppingItem[]>>
  setAddingRecipes: React.Dispatch<React.SetStateAction<boolean>>
  setClearingList: React.Dispatch<React.SetStateAction<boolean>>
  setError: React.Dispatch<React.SetStateAction<string | null>>
  loadItems: () => Promise<void>
  refreshDefaultList: (listId?: string) => Promise<void>
}

export function useShoppingListActions({
  list,
  items,
  labels,
  setItems,
  setAddingRecipes,
  setClearingList,
  setError,
  loadItems,
  refreshDefaultList,
}: UseShoppingListActionsParams) {
  const findExisting = useCallback((currentItems: ShoppingItem[], key: string) => {
    return currentItems.find((item) => {
      const itemKey = extractFoodKey(itemDisplayName(item))
      return itemKey && itemKey === key
    })
  }, [])

  const addItem = useCallback(async (note: string, quantity?: number, labelId?: string) => {
    if (!list) return
    const key = extractFoodKey(note)
    const savedLabelId = key ? foodLabelStore.lookup(key) : undefined
    const effectiveLabelId = labelId ?? savedLabelId
    const existing = key ? findExisting(items, key) : undefined

    if (existing) {
      await shoppingRepository.updateItem(
        list.id,
        buildUpdatePayload(list.id, existing, { quantity: (existing.quantity ?? 1) + 1 }),
      )
    } else {
      await addItemUseCase.execute(list.id, note, quantity, effectiveLabelId)
    }

    await refreshDefaultList(list.id)
  }, [findExisting, items, list, refreshDefaultList])

  const updateItemQuantity = useCallback(async (item: ShoppingItem, quantity: number) => {
    if (!list) return
    setItems((prev) => prev.map((entry) => (entry.id === item.id ? { ...entry, quantity } : entry)))

    try {
      await shoppingRepository.updateItem(list.id, buildUpdatePayload(list.id, item, { quantity }))
    } catch (err) {
      setItems((prev) => prev.map((entry) => (entry.id === item.id ? { ...entry, quantity: item.quantity } : entry)))
      setError(err instanceof Error ? err.message : "Erreur lors de la mise a jour")
    }
  }, [list, setError, setItems])

  const updateItemNote = useCallback(async (item: ShoppingItem, note: string) => {
    if (!list) return
    setItems((prev) => prev.map((entry) => (entry.id === item.id ? { ...entry, note } : entry)))

    try {
      await shoppingRepository.updateItem(list.id, buildUpdatePayload(list.id, item, { note }))
    } catch (err) {
      setItems((prev) => prev.map((entry) => (entry.id === item.id ? { ...entry, note: item.note } : entry)))
      setError(err instanceof Error ? err.message : "Erreur lors de la mise a jour")
    }
  }, [list, setError, setItems])

  const updateItemLabel = useCallback(async (item: ShoppingItem, labelId: string | undefined) => {
    if (!list) return
    const nextLabel = labelId ? labels.find((label) => label.id === labelId) : undefined
    setItems((prev) => prev.map((entry) => (entry.id === item.id ? { ...entry, label: nextLabel } : entry)))

    const rawName = item.food?.name ?? item.note ?? ""
    const foodKey = extractFoodKey(rawName)
    if (foodKey) {
      if (labelId) foodLabelStore.set(foodKey, labelId)
      else foodLabelStore.remove(foodKey)
    }

    try {
      await shoppingRepository.updateItem(list.id, buildUpdatePayload(list.id, item, { labelId: labelId || undefined }))
    } catch (err) {
      setItems((prev) => prev.map((entry) => (entry.id === item.id ? { ...entry, label: item.label } : entry)))
      setError(err instanceof Error ? err.message : "Erreur lors de la mise a jour")
    }
  }, [labels, list, setError, setItems])

  const addRecipes = useCallback(async (recipeIds: string[]) => {
    if (!list) return
    setAddingRecipes(true)
    setError(null)

    try {
      const recipes = await getRecipesByIdsUseCase.execute(recipeIds)
      let currentItems = [...items]

      for (const recipe of recipes) {
        for (const ingredient of recipe.recipeIngredient ?? []) {
          const cleanNote = ingredient.food?.name?.trim()
            ?? (ingredient.note ? extractFoodKey(ingredient.note) || ingredient.note.trim() : "")
          if (!cleanNote) continue

          const key = extractFoodKey(cleanNote) || cleanNote.toLowerCase()
          const existing = findExisting(currentItems, key)

          if (existing) {
            const updated = await shoppingRepository.updateItem(
              list.id,
              buildUpdatePayload(list.id, existing, { quantity: (existing.quantity ?? 1) + 1 }),
            )
            currentItems = currentItems.map((entry) => (entry.id === existing.id ? updated : entry))
            continue
          }

          await shoppingRepository.addItem(list.id, {
            shoppingListId: list.id,
            note: cleanNote,
            quantity: 1,
          })
          currentItems = (await shoppingRepository.getItems(list.id)).items
        }
      }

      await refreshDefaultList(list.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'ajout des recettes")
    } finally {
      setAddingRecipes(false)
    }
  }, [findExisting, items, list, refreshDefaultList, setAddingRecipes, setError])

  const toggleItem = useCallback(async (item: ShoppingItem) => {
    if (!list) return
    setItems((prev) => prev.map((entry) => (entry.id === item.id ? { ...entry, checked: !entry.checked } : entry)))

    try {
      await toggleItemUseCase.execute(list.id, item)
    } catch (err) {
      setItems((prev) => prev.map((entry) => (entry.id === item.id ? { ...entry, checked: item.checked } : entry)))
      setError(err instanceof Error ? err.message : "Erreur lors de la mise a jour")
    }
  }, [list, setError, setItems])

  const deleteItem = useCallback(async (itemId: string) => {
    if (!list) return
    setItems((prev) => prev.filter((entry) => entry.id !== itemId))

    try {
      await deleteItemUseCase.execute(list.id, itemId)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la suppression")
      void loadItems()
    }
  }, [list, loadItems, setError, setItems])

  const clearList = useCallback(async (mode: ClearMode) => {
    if (!list) return
    const snapshot = items
    setClearingList(true)

    try {
      await clearListUseCase.execute(list.id, snapshot, mode)
      if (mode === "checked") {
        setItems((prev) => prev.filter((entry) => !entry.checked))
      } else {
        setItems([])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors du vidage")
      void loadItems()
    } finally {
      setClearingList(false)
    }
  }, [items, list, loadItems, setClearingList, setError, setItems])

  return {
    addItem,
    updateItemQuantity,
    updateItemNote,
    updateItemLabel,
    addRecipes,
    toggleItem,
    deleteItem,
    clearList,
  }
}
