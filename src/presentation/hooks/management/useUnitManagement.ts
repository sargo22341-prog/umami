import { useCallback, useEffect, useMemo, useState } from "react"
import {
  createUnitUseCase,
  deleteUnitUseCase,
  getPaginatedUnitsUseCase,
  getUnitsUseCase,
  mergeUnitsUseCase,
  updateUnitUseCase,
} from "@/infrastructure/container.ts"
import type { MealieIngredientUnitAlias, MealieIngredientUnitOutput } from "@/shared/types/mealie/Units.ts"

function sortUnitsByName(units: MealieIngredientUnitOutput[]) {
  return [...units].sort((a, b) => a.name.localeCompare(b.name, "fr", { sensitivity: "base" }))
}

type UnitSortKey =
  | "name"
  | "pluralName"
  | "aliases"
  | "abbreviation"
  | "pluralAbbreviation"
  | "description"
  | "useAbbreviation"
  | "fraction"
  | "standardQuantity"
  | "standardUnit"
type SortDirection = "asc" | "desc"

export function useUnitManagement(
  search: string,
  perPage: number,
  sortKey: UnitSortKey,
  sortDirection: SortDirection,
) {
  const [page, setPage] = useState(1)
  const [allUnits, setAllUnits] = useState<MealieIngredientUnitOutput[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setAllUnits(await getUnitsUseCase.execute())
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de charger les unites.")
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

  const filteredUnits = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return allUnits
    return allUnits.filter((unit) =>
      [
        unit.name,
        unit.pluralName,
        unit.abbreviation,
        unit.pluralAbbreviation,
        ...(unit.aliases ?? []).map((alias) => alias.name),
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    )
  }, [allUnits, search])

  const sortedFilteredUnits = useMemo(() => {
    const getUnitSortValue = (unit: MealieIngredientUnitOutput) => {
      switch (sortKey) {
        case "name":
          return unit.name
        case "pluralName":
          return unit.pluralName ?? ""
        case "aliases":
          return (unit.aliases ?? []).map((alias) => alias.name).join(" | ")
        case "abbreviation":
          return unit.abbreviation ?? ""
        case "pluralAbbreviation":
          return unit.pluralAbbreviation ?? ""
        case "description":
          return unit.description ?? ""
        case "useAbbreviation":
          return unit.useAbbreviation ? "1" : "0"
        case "fraction":
          return unit.fraction ? "1" : "0"
        case "standardQuantity":
          return String(unit.standardQuantity ?? "")
        case "standardUnit":
          return unit.standardUnit ?? ""
        default:
          return ""
      }
    }

    return [...filteredUnits].sort((left, right) => {
      const leftValue = getUnitSortValue(left)
      const rightValue = getUnitSortValue(right)
      const comparison = leftValue.localeCompare(rightValue, "fr", { sensitivity: "base", numeric: true })
      return sortDirection === "asc" ? comparison : -comparison
    })
  }, [filteredUnits, sortDirection, sortKey])

  const total = sortedFilteredUnits.length
  const totalPages = total > 0 ? Math.ceil(total / perPage) : 0
  const safePage = totalPages > 0 ? Math.min(page, totalPages) : 1
  const startIndex = (safePage - 1) * perPage
  const units = sortedFilteredUnits.slice(startIndex, startIndex + perPage)

  const createUnit = useCallback(async (payload: {
    name: string
    pluralName?: string | null
    description?: string
    abbreviation?: string
    pluralAbbreviation?: string | null
    useAbbreviation: boolean
    fraction: boolean
    aliases?: MealieIngredientUnitAlias[]
    standardQuantity?: number | null
    standardUnit?: string | null
  }) => {
    setSaving(true)
    setError(null)
    try {
      const created = await createUnitUseCase.execute(payload)
      if (created) {
        setAllUnits((prev) => sortUnitsByName([...prev, created]))
      } else {
        const latest = await getPaginatedUnitsUseCase.execute(1, 1, undefined, "created_at", "desc")
        const latestItem = latest.items[0]
        if (latestItem) {
          setAllUnits((prev) => sortUnitsByName([latestItem, ...prev.filter((entry) => entry.id !== latestItem.id)]))
        } else {
          await load()
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Impossible d'ajouter l'unite."
      setError(message)
      throw err instanceof Error ? err : new Error(message)
    } finally {
      setSaving(false)
    }
  }, [load])

  const updateUnit = useCallback(async (unit: MealieIngredientUnitOutput, payload: {
    name: string
    pluralName?: string | null
    description?: string
    abbreviation?: string
    pluralAbbreviation?: string | null
    useAbbreviation: boolean
    fraction: boolean
    aliases?: MealieIngredientUnitAlias[]
    standardQuantity?: number | null
    standardUnit?: string | null
  }) => {
    setSaving(true)
    setError(null)
    try {
      const updated = await updateUnitUseCase.execute(unit.id, payload)
      setAllUnits((prev) => sortUnitsByName(prev.map((entry) => (entry.id === unit.id ? updated : entry))))
    } catch (err) {
      const message = err instanceof Error ? err.message : "Impossible de modifier l'unite."
      setError(message)
      throw err instanceof Error ? err : new Error(message)
    } finally {
      setSaving(false)
    }
  }, [])

  const deleteUnit = useCallback(async (unitId: string) => {
    setSaving(true)
    setError(null)
    try {
      await deleteUnitUseCase.execute(unitId)
      setAllUnits((prev) => prev.filter((entry) => entry.id !== unitId))
    } catch (err) {
      const message = err instanceof Error ? err.message : "Impossible de supprimer l'unite."
      setError(message)
      throw err instanceof Error ? err : new Error(message)
    } finally {
      setSaving(false)
    }
  }, [])

  const deleteUnits = useCallback(async (unitIds: string[]) => {
    setSaving(true)
    setError(null)
    try {
      for (const unitId of unitIds) {
        await deleteUnitUseCase.execute(unitId)
      }
      const ids = new Set(unitIds)
      setAllUnits((prev) => prev.filter((entry) => !ids.has(entry.id)))
    } catch (err) {
      const message = err instanceof Error ? err.message : "Impossible de supprimer les unites selectionnees."
      setError(message)
      throw err instanceof Error ? err : new Error(message)
    } finally {
      setSaving(false)
    }
  }, [])

  const mergeSelectedUnits = useCallback(async (selectedUnits: MealieIngredientUnitOutput[], winnerId: string) => {
    setSaving(true)
    setError(null)
    try {
      for (const unit of selectedUnits) {
        if (unit.id === winnerId) continue
        await mergeUnitsUseCase.execute({ fromUnit: unit.id, toUnit: winnerId })
      }
      const losingIds = new Set(selectedUnits.filter((unit) => unit.id !== winnerId).map((unit) => unit.id))
      setAllUnits((prev) => sortUnitsByName(prev.filter((unit) => !losingIds.has(unit.id))))
    } catch (err) {
      const message = err instanceof Error ? err.message : "Impossible de fusionner les unites selectionnees."
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
    units,
    allUnits,
    filteredUnits,
    total,
    page: safePage,
    totalPages,
    loading,
    saving,
    error,
    setPage,
    createUnit,
    updateUnit,
    deleteUnit,
    deleteUnits,
    mergeSelectedUnits,
  }
}
