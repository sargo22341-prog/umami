import { useCallback, useEffect, useMemo, useState } from "react"
import {
  createToolUseCase,
  deleteToolUseCase,
  getPaginatedToolsUseCase,
  getToolsUseCase,
  updateToolUseCase,
  userRepository,
} from "@/infrastructure/container.ts"
import type { MealieRecipeTool, MealieRecipeToolCreate } from "@/shared/types/mealie/Tools.ts"

function sortToolsByName(tools: MealieRecipeTool[]) {
  return [...tools].sort((a, b) => a.name.localeCompare(b.name, "fr", { sensitivity: "base" }))
}

type ToolSortKey = "name" | "available"
type SortDirection = "asc" | "desc"

export function useToolManagement(
  search: string,
  perPage: number,
  sortKey: ToolSortKey,
  sortDirection: SortDirection,
) {
  const [page, setPage] = useState(1)
  const [allTools, setAllTools] = useState<MealieRecipeTool[]>([])
  const [householdSlug, setHouseholdSlug] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const [profile, tools] = await Promise.all([
        householdSlug
          ? Promise.resolve({ householdSlug })
          : userRepository.getSelf(),
        getToolsUseCase.execute(),
      ])

      setHouseholdSlug(profile.householdSlug)
      setAllTools(tools)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de charger les ustensiles.")
    } finally {
      setLoading(false)
    }
  }, [householdSlug])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    setPage(1)
  }, [search, perPage])

  const filteredTools = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return allTools
    return allTools.filter((tool) => tool.name.toLowerCase().includes(query))
  }, [allTools, search])

  const sortedFilteredTools = useMemo(() => {
    const getToolSortValue = (tool: MealieRecipeTool) => {
      const available = householdSlug ? (tool.householdsWithTool ?? []).includes(householdSlug) : false

      switch (sortKey) {
        case "name":
          return tool.name
        case "available":
          return available ? "1" : "0"
        default:
          return ""
      }
    }

    return [...filteredTools].sort((left, right) => {
      const leftValue = getToolSortValue(left)
      const rightValue = getToolSortValue(right)
      const comparison = leftValue.localeCompare(rightValue, "fr", { sensitivity: "base" })
      return sortDirection === "asc" ? comparison : -comparison
    })
  }, [filteredTools, householdSlug, sortDirection, sortKey])

  const total = sortedFilteredTools.length
  const totalPages = total > 0 ? Math.ceil(total / perPage) : 0
  const safePage = totalPages > 0 ? Math.min(page, totalPages) : 1
  const startIndex = (safePage - 1) * perPage
  const tools = sortedFilteredTools.slice(startIndex, startIndex + perPage)

  const createTool = useCallback(async (name: string, available: boolean) => {
    if (!householdSlug) {
      throw new Error("Foyer utilisateur introuvable.")
    }

    setSaving(true)
    setError(null)
    try {
      const payload: MealieRecipeToolCreate = {
        name: name.trim(),
        householdsWithTool: available ? [householdSlug] : [],
      }
      const created = await createToolUseCase.execute(payload)
      if (created) {
        setAllTools((prev) => sortToolsByName([...prev, created]))
      } else {
        const latest = await getPaginatedToolsUseCase.execute(1, 1, undefined, "created_at", "desc")
        const latestItem = latest.items[0]
        if (latestItem) {
          setAllTools((prev) =>
            sortToolsByName([latestItem, ...prev.filter((entry) => entry.id !== latestItem.id)]),
          )
        } else {
          await load()
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Impossible d'ajouter l'ustensile."
      setError(message)
      throw err instanceof Error ? err : new Error(message)
    } finally {
      setSaving(false)
    }
  }, [householdSlug, load])

  const updateTool = useCallback(async (tool: MealieRecipeTool, name: string, available: boolean) => {
    if (!householdSlug) {
      throw new Error("Foyer utilisateur introuvable.")
    }

    setSaving(true)
    setError(null)
    try {
      const households = new Set(tool.householdsWithTool ?? [])
      if (available) {
        households.add(householdSlug)
      } else {
        households.delete(householdSlug)
      }

      const payload: MealieRecipeToolCreate = {
        name: name.trim(),
        householdsWithTool: [...households],
      }

      const updated = await updateToolUseCase.execute(tool.id, payload)
      setAllTools((prev) => sortToolsByName(prev.map((entry) => (entry.id === tool.id ? updated : entry))))
    } catch (err) {
      const message = err instanceof Error ? err.message : "Impossible de modifier l'ustensile."
      setError(message)
      throw err instanceof Error ? err : new Error(message)
    } finally {
      setSaving(false)
    }
  }, [householdSlug])

  const deleteTool = useCallback(async (toolId: string) => {
    setSaving(true)
    setError(null)
    try {
      await deleteToolUseCase.execute(toolId)
      setAllTools((prev) => prev.filter((entry) => entry.id !== toolId))
    } catch (err) {
      const message = err instanceof Error ? err.message : "Impossible de supprimer l'ustensile."
      setError(message)
      throw err instanceof Error ? err : new Error(message)
    } finally {
      setSaving(false)
    }
  }, [])

  const deleteTools = useCallback(async (toolIds: string[]) => {
    setSaving(true)
    setError(null)
    try {
      for (const toolId of toolIds) {
        await deleteToolUseCase.execute(toolId)
      }
      const ids = new Set(toolIds)
      setAllTools((prev) => prev.filter((entry) => !ids.has(entry.id)))
    } catch (err) {
      const message = err instanceof Error ? err.message : "Impossible de supprimer les ustensiles selectionnes."
      setError(message)
      throw err instanceof Error ? err : new Error(message)
    } finally {
      setSaving(false)
    }
  }, [])

  useEffect(() => {
    if (page > 1 && totalPages > 0 && page > totalPages) {
      setPage(totalPages)
    }
  }, [page, totalPages])

  return {
    tools,
    total,
    page: safePage,
    perPage,
    totalPages,
    householdSlug,
    loading,
    saving,
    error,
    setPage,
    refresh: () => load(),
    createTool,
    updateTool,
    deleteTool,
    deleteTools,
  }
}
