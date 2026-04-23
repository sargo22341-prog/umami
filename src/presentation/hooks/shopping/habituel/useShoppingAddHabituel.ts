import { useState } from "react"

export function useShoppingAddHabituel(
  addHabituel: (params: { name: string; labelId?: string; foodId?: string }) => Promise<void>,
) {
  const [addingHabituel, setAddingHabituel] = useState(false)
  const [addingSelectedHabituels, setAddingSelectedHabituels] = useState(false)

  const submitAddHabituel = async (params: { name: string; labelId?: string; foodId?: string }) => {
    setAddingHabituel(true)
    try {
      await addHabituel(params)
    } finally {
      setAddingHabituel(false)
    }
  }

  const withSelectedHabituels = async (
    action: () => Promise<void>,
  ) => {
    setAddingSelectedHabituels(true)
    try {
      await action()
    } finally {
      setAddingSelectedHabituels(false)
    }
  }

  return {
    addingHabituel,
    addingSelectedHabituels,
    submitAddHabituel,
    withSelectedHabituels,
  }
}
