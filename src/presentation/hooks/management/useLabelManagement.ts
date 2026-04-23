import { useCallback, useEffect, useMemo, useState } from "react"
import {
  createLabelUseCase,
  deleteLabelUseCase,
  getLabelsUseCase,
  updateLabelUseCase,
} from "@/infrastructure/container.ts"
import type { MealieLabel } from "@/shared/types/mealie/Labels.ts"

function sortLabelsByName(labels: MealieLabel[]) {
  return [...labels].sort((a, b) => a.name.localeCompare(b.name, "fr", { sensitivity: "base" }))
}

type LabelSortKey = "name"
type SortDirection = "asc" | "desc"

export function useLabelManagement(
  search: string,
  perPage: number,
  _sortKey: LabelSortKey,
  sortDirection: SortDirection,
) {
  const [page, setPage] = useState(1)
  const [allLabels, setAllLabels] = useState<MealieLabel[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setAllLabels(await getLabelsUseCase.execute())
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de charger les labels.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    setPage(1)
  }, [perPage, search])

  const filteredLabels = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return allLabels
    return allLabels.filter((label) => label.name.toLowerCase().includes(query))
  }, [allLabels, search])

  const sortedFilteredLabels = useMemo(() => {
    return [...filteredLabels].sort((left, right) => {
      const comparison = left.name.localeCompare(right.name, "fr", { sensitivity: "base" })
      return sortDirection === "asc" ? comparison : -comparison
    })
  }, [filteredLabels, sortDirection])

  const total = sortedFilteredLabels.length
  const totalPages = total > 0 ? Math.ceil(total / perPage) : 0
  const safePage = totalPages > 0 ? Math.min(page, totalPages) : 1
  const startIndex = (safePage - 1) * perPage
  const labels = sortedFilteredLabels.slice(startIndex, startIndex + perPage)

  const createLabel = useCallback(async (name: string, color: string) => {
    setSaving(true)
    setError(null)

    try {
      const created = await createLabelUseCase.execute({ name: name.trim(), color })
      setAllLabels((prev) => sortLabelsByName([...prev, created]))
    } catch (err) {
      const message = err instanceof Error ? err.message : "Impossible d'ajouter le label."
      setError(message)
      throw err instanceof Error ? err : new Error(message)
    } finally {
      setSaving(false)
    }
  }, [])

  const updateLabel = useCallback(async (label: MealieLabel, name: string, color: string) => {
    setSaving(true)
    setError(null)

    try {
      const updated = await updateLabelUseCase.execute(label.id, {
        ...label,
        name: name.trim(),
        color,
      })

      setAllLabels((prev) =>
        sortLabelsByName(prev.map((entry) => (entry.id === label.id ? updated : entry))),
      )
    } catch (err) {
      const message = err instanceof Error ? err.message : "Impossible de modifier le label."
      setError(message)
      throw err instanceof Error ? err : new Error(message)
    } finally {
      setSaving(false)
    }
  }, [])

  const deleteLabel = useCallback(async (labelId: string) => {
    setSaving(true)
    setError(null)
    try {
      await deleteLabelUseCase.execute(labelId)
      setAllLabels((prev) => prev.filter((entry) => entry.id !== labelId))
    } catch (err) {
      const message = err instanceof Error ? err.message : "Impossible de supprimer le label."
      setError(message)
      throw err instanceof Error ? err : new Error(message)
    } finally {
      setSaving(false)
    }
  }, [])

  const deleteLabels = useCallback(async (labelIds: string[]) => {
    setSaving(true)
    setError(null)

    try {
      await Promise.all(labelIds.map((labelId) => deleteLabelUseCase.execute(labelId)))

      const ids = new Set(labelIds)
      setAllLabels((prev) => prev.filter((entry) => !ids.has(entry.id)))
    } catch (err) {
      const message = err instanceof Error ? err.message : "Impossible de supprimer les labels selectionnes."
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
    labels,
    allLabels,
    total,
    page: safePage,
    totalPages,
    loading,
    saving,
    error,
    setPage,
    createLabel,
    updateLabel,
    deleteLabel,
    deleteLabels,
  }
}
