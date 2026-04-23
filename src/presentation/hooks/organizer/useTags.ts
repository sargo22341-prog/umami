import { useCallback, useEffect, useState } from "react"
import type { MealieRecipeTag } from "@/shared/types/mealie/Tags.ts"
import { getTagsUseCase } from "@/infrastructure/container.ts"

export function useTags() {
  const [tags, setTags] = useState<MealieRecipeTag[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTags = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getTagsUseCase.execute()
      setTags(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur chargement tags")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchTags()
  }, [fetchTags])

  return { tags, loading, error }
}
