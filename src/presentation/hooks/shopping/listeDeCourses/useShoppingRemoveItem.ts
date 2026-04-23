import { useState } from "react"

export function useShoppingRemoveItem(deleteItem: (itemId: string) => Promise<void>) {
  const [removingItem, setRemovingItem] = useState(false)

  const removeItem = async (itemId: string) => {
    setRemovingItem(true)
    try {
      await deleteItem(itemId)
    } finally {
      setRemovingItem(false)
    }
  }

  return {
    removingItem,
    removeItem,
  }
}
