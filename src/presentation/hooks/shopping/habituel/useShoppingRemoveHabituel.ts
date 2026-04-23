import { useState } from "react"

export function useShoppingRemoveHabituel(
  deleteHabituel: (itemId: string) => Promise<void>,
  deleteAllHabituels: () => Promise<void>,
) {
  const [removingHabituel, setRemovingHabituel] = useState(false)

  const removeHabituel = async (itemId: string) => {
    setRemovingHabituel(true)
    try {
      await deleteHabituel(itemId)
    } finally {
      setRemovingHabituel(false)
    }
  }

  const removeAllHabituels = async () => {
    setRemovingHabituel(true)
    try {
      await deleteAllHabituels()
    } finally {
      setRemovingHabituel(false)
    }
  }

  return {
    removingHabituel,
    removeHabituel,
    removeAllHabituels,
  }
}
