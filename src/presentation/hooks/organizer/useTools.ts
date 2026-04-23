import { useCallback, useEffect, useState } from "react"
import type { MealieRecipeTool } from "@/shared/types/mealie/Tools.ts"
import { getToolsUseCase } from "@/infrastructure/container.ts"

export function useTools() {
  const [tools, setTools] = useState<MealieRecipeTool[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTools = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getToolsUseCase.execute()
      setTools(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur chargement ustensiles")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchTools()
  }, [fetchTools])

  return { tools, loading, error }
}
