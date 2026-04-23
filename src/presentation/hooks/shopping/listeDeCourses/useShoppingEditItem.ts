import { useState } from "react"

import type { ShoppingItem } from "@/domain/shopping/entities/ShoppingItem.ts"

export function useShoppingEditItem(
  updateItemQuantity: (item: ShoppingItem, quantity: number) => Promise<void>,
  updateItemNote: (item: ShoppingItem, note: string) => Promise<void>,
) {
  const [editingItem, setEditingItem] = useState(false)

  const editItemQuantity = async (item: ShoppingItem, quantity: number) => {
    setEditingItem(true)
    try {
      await updateItemQuantity(item, quantity)
    } finally {
      setEditingItem(false)
    }
  }

  const editItemNote = async (item: ShoppingItem, note: string) => {
    setEditingItem(true)
    try {
      await updateItemNote(item, note)
    } finally {
      setEditingItem(false)
    }
  }

  return {
    editingItem,
    editItemQuantity,
    editItemNote,
  }
}
