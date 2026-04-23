import { useState } from "react"

import type { ShoppingItem } from "@/domain/shopping/entities/ShoppingItem.ts"

export function useShoppingEditCellier(
  updateCellierQuantity: (item: ShoppingItem, quantity: number) => Promise<void>,
) {
  const [editingCellier, setEditingCellier] = useState(false)

  const editCellierQuantity = async (item: ShoppingItem, quantity: number) => {
    setEditingCellier(true)
    try {
      await updateCellierQuantity(item, quantity)
    } finally {
      setEditingCellier(false)
    }
  }

  return {
    editingCellier,
    editCellierQuantity,
  }
}
