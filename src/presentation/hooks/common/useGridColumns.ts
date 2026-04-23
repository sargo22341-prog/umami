import { useCallback, useEffect, useMemo, useState } from "react"

const STORAGE_KEY = "umami:grid_columns"
const DEFAULT_PORTRAIT_COLUMNS = 2
const DEFAULT_LANDSCAPE_COLUMNS = 4
const PORTRAIT_MIN_COLUMNS = 2
const PORTRAIT_MAX_COLUMNS = 4
const LANDSCAPE_MIN_COLUMNS = 2
const LANDSCAPE_MAX_COLUMNS = 6

type GridColumnsConfig = {
  portrait: number
  landscape: number
}

function isPortraitViewport() {
  if (typeof window === "undefined") return true
  return window.matchMedia("(orientation: portrait)").matches
}

function clampColumns(value: number, portrait: boolean) {
  const min = portrait ? PORTRAIT_MIN_COLUMNS : LANDSCAPE_MIN_COLUMNS
  const max = portrait ? PORTRAIT_MAX_COLUMNS : LANDSCAPE_MAX_COLUMNS
  return Math.min(max, Math.max(min, value))
}

function readFromStorage(): GridColumnsConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return {
        portrait: DEFAULT_PORTRAIT_COLUMNS,
        landscape: DEFAULT_LANDSCAPE_COLUMNS,
      }
    }

    const parsed = JSON.parse(raw) as Partial<GridColumnsConfig> | number
    if (typeof parsed === "number") {
      return {
        portrait: clampColumns(parsed, true),
        landscape: clampColumns(parsed, false),
      }
    }

    return {
      portrait: clampColumns(parsed.portrait ?? DEFAULT_PORTRAIT_COLUMNS, true),
      landscape: clampColumns(parsed.landscape ?? DEFAULT_LANDSCAPE_COLUMNS, false),
    }
  } catch {
    return {
      portrait: DEFAULT_PORTRAIT_COLUMNS,
      landscape: DEFAULT_LANDSCAPE_COLUMNS,
    }
  }
}

function writeToStorage(value: GridColumnsConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
  } catch {
    // Silently ignore storage errors
  }
}

export function useGridColumns() {
  const [storedColumns, setStoredColumns] = useState<GridColumnsConfig>(readFromStorage)
  const [isPortrait, setIsPortrait] = useState(isPortraitViewport)

  useEffect(() => {
    const mediaQuery = window.matchMedia("(orientation: portrait)")
    const handleChange = (event: MediaQueryListEvent) => {
      setIsPortrait(event.matches)
    }

    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [])

  const min = isPortrait ? PORTRAIT_MIN_COLUMNS : LANDSCAPE_MIN_COLUMNS
  const max = isPortrait ? PORTRAIT_MAX_COLUMNS : LANDSCAPE_MAX_COLUMNS
  const columns = isPortrait ? storedColumns.portrait : storedColumns.landscape

  const setColumns = useCallback((next: number) => {
    setStoredColumns((prev) => {
      const updated: GridColumnsConfig = isPortrait
        ? { ...prev, portrait: clampColumns(next, true) }
        : { ...prev, landscape: clampColumns(next, false) }
      writeToStorage(updated)
      return updated
    })
  }, [isPortrait])

  const increment = useCallback(() => {
    setColumns(columns + 1)
  }, [columns, setColumns])

  const decrement = useCallback(() => {
    setColumns(columns - 1)
  }, [columns, setColumns])

  return useMemo(
    () => ({
      columns,
      setColumns,
      increment,
      decrement,
      canIncrement: columns < max,
      canDecrement: columns > min,
      min,
      max,
      orientation: isPortrait ? "portrait" : "landscape",
      values: storedColumns,
    }),
    [columns, decrement, increment, isPortrait, max, min, setColumns, storedColumns],
  )
}
