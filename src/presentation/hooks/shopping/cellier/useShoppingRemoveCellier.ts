import { useState } from "react"

export function useShoppingRemoveCellier(
  deleteCellierItem: (itemId: string) => Promise<void>,
  deleteAllCellier: () => Promise<void>,
) {
  const [removingCellier, setRemovingCellier] = useState(false)

  const removeCellier = async (itemId: string) => {
    setRemovingCellier(true)
    try {
      await deleteCellierItem(itemId)
    } finally {
      setRemovingCellier(false)
    }
  }

  const removeAllCellier = async () => {
    setRemovingCellier(true)
    try {
      await deleteAllCellier()
    } finally {
      setRemovingCellier(false)
    }
  }

  return {
    removingCellier,
    removeCellier,
    removeAllCellier,
  }
}
