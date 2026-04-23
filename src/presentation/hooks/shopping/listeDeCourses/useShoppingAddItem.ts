import { useState } from "react"

export function useShoppingAddItem(addItem: (note: string, quantity?: number, labelId?: string) => Promise<void>) {
  const [addingItem, setAddingItem] = useState(false)

  const submitAddItem = async (note: string, quantity: number, labelId?: string) => {
    setAddingItem(true)
    try {
      await addItem(note, quantity, labelId)
      return true
    } finally {
      setAddingItem(false)
    }
  }

  return {
    addingItem,
    submitAddItem,
  }
}
