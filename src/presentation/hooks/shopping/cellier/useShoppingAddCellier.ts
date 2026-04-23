import { useState } from "react"

export function useShoppingAddCellier(
  addCellierItem: (params: { name: string; quantity: number; unitId?: string; foodId?: string }) => Promise<void>,
) {
  const [addingCellier, setAddingCellier] = useState(false)

  const submitAddCellier = async (params: { name: string; quantity: number; unitId?: string; foodId?: string }) => {
    setAddingCellier(true)
    try {
      await addCellierItem(params)
    } finally {
      setAddingCellier(false)
    }
  }

  return {
    addingCellier,
    submitAddCellier,
  }
}
