import { useCallback, useEffect, useState } from "react"
import type { MealieRecipeCategory } from "@/shared/types/mealie/Category.ts"
import { getCategoriesUseCase } from "@/infrastructure/container.ts"

export function useCategories() {
  const [categories, setCategories] = useState<MealieRecipeCategory[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchCategories = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getCategoriesUseCase.execute()
      setCategories(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur chargement catégories")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchCategories()
  }, [fetchCategories])

  return { categories, loading, error }
}
