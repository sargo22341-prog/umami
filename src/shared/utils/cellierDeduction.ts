const CELLIER_NOTE_PREFIX = "Cellier:"
const CELLIER_NOTE_FRAGMENT = "dans le cellier"
const CELLIER_NOTE_SEPARATOR = " | "

export type CellierDeductionMode = "full" | "partial"

export interface ParsedCellierDeductionNote {
  mode: CellierDeductionMode
  quantity: number
  unitName?: string
  noteWithoutDeduction?: string
}

function normalizeUnitName(value?: string | null): string | undefined {
  if (typeof value !== "string") {
    return undefined
  }

  const normalized = value.trim()
  return normalized.length > 0 ? normalized : undefined
}

function formatQuantity(value: number): string {
  if (!Number.isFinite(value)) {
    return "0"
  }

  return value.toFixed(2).replace(/\.?0+$/, "")
}

function parseQuantity(value: string): number | null {
  const normalized = value.replace(",", ".").trim()
  const parsed = Number.parseFloat(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

export function buildCellierDeductionNote(
  mode: CellierDeductionMode,
  quantity: number,
  unitName?: string | null,
): string {
  const formattedQuantity = formatQuantity(quantity)
  const normalizedUnitName = normalizeUnitName(unitName)
  const quantityLabel = normalizedUnitName ? `${formattedQuantity} ${normalizedUnitName}` : formattedQuantity

  if (mode === "full") {
    return `${CELLIER_NOTE_PREFIX} les ${quantityLabel} sont dans le cellier`
  }

  return `${CELLIER_NOTE_PREFIX} dont ${quantityLabel} dans le cellier`
}

function parseCellierDeductionFragment(note: string): ParsedCellierDeductionNote | null {
  if (!note.includes(CELLIER_NOTE_FRAGMENT)) {
    return null
  }

  const fullMatch = note.match(/^Cellier:\s*les\s+([\d.,]+)(?:\s+(.+?))?\s+sont\s+dans le cellier$/i)
  if (fullMatch) {
    const quantity = parseQuantity(fullMatch[1])
    if (quantity == null) {
      return null
    }

    return {
      mode: "full",
      quantity,
      unitName: normalizeUnitName(fullMatch[2]),
    }
  }

  const partialMatch = note.match(/^Cellier:\s*dont\s+([\d.,]+)(?:\s+(.+?))?\s+dans le cellier$/i)
  if (partialMatch) {
    const quantity = parseQuantity(partialMatch[1])
    if (quantity == null) {
      return null
    }

    return {
      mode: "partial",
      quantity,
      unitName: normalizeUnitName(partialMatch[2]),
    }
  }

  return null
}

export function appendCellierDeductionToNote(
  note: string | null | undefined,
  deductionNote: string,
): string {
  const cleaned = removeCellierDeductionFromNote(note)
  return cleaned ? `${cleaned}${CELLIER_NOTE_SEPARATOR}${deductionNote}` : deductionNote
}

export function removeCellierDeductionFromNote(note?: string | null): string | undefined {
  if (!note) {
    return undefined
  }

  const parts = note
    .split(CELLIER_NOTE_SEPARATOR)
    .map((part) => part.trim())
    .filter(Boolean)

  const keptParts = parts.filter((part) => parseCellierDeductionFragment(part) == null)
  if (keptParts.length === 0) {
    return undefined
  }

  return keptParts.join(CELLIER_NOTE_SEPARATOR)
}

export function parseCellierDeductionNote(note?: string | null): ParsedCellierDeductionNote | null {
  if (!note) {
    return null
  }

  const parts = note
    .split(CELLIER_NOTE_SEPARATOR)
    .map((part) => part.trim())
    .filter(Boolean)

  for (const part of parts) {
    const parsed = parseCellierDeductionFragment(part)
    if (parsed) {
      return {
        ...parsed,
        noteWithoutDeduction: removeCellierDeductionFromNote(note),
      }
    }
  }

  return null
}

export function hasCellierDeductionNote(note?: string | null): boolean {
  return parseCellierDeductionNote(note) != null
}

export function resolveCellierRollback(note?: string | null): ParsedCellierDeductionNote | null {
  return parseCellierDeductionNote(note)
}
