import { useState } from "react"

import type { ShoppingItem } from "@/domain/shopping/entities/ShoppingItem.ts"

export function useShoppingEditHabituel(
  updateHabituelNote: (item: ShoppingItem, note: string) => Promise<void>,
) {
  const [editingHabituel, setEditingHabituel] = useState(false)

  const editHabituelNote = async (item: ShoppingItem, note: string) => {
    setEditingHabituel(true)
    try {
      await updateHabituelNote(item, note)
    } finally {
      setEditingHabituel(false)
    }
  }

  return {
    editingHabituel,
    editHabituelNote,
  }
}
