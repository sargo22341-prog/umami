import { useEffect, useMemo, useState } from "react"
import { Minus, PackageOpen, Plus, Trash2 } from "lucide-react"
import { LabelSectionHeader } from "components/common/LabelSectionHeader.tsx"
import type { ShoppingItem, ShoppingLabel } from "@/domain/shopping/entities/ShoppingItem.ts"
import { getDefaultExpandedLabels } from "@/shared/utils/labelCollapsing.ts"

function formatQuantity(quantity: number): string {
  if (!Number.isFinite(quantity)) return ""
  return quantity.toFixed(1).replace(/\.0$/, "")
}

interface CellierFoodRowProps {
  item: ShoppingItem
  onUpdateQuantity: (item: ShoppingItem, quantity: number) => void
  onDelete: (id: string) => void
}

function CellierFoodRow({ item, onUpdateQuantity, onDelete }: CellierFoodRowProps) {
  const quantity = item.quantity ?? 0
  const [draftQuantity, setDraftQuantity] = useState(formatQuantity(quantity))

  useEffect(() => {
    setDraftQuantity(formatQuantity(quantity))
  }, [quantity])

  const commitQuantity = () => {
    const parsed = Number.parseFloat(draftQuantity.replace(",", "."))
    if (!Number.isFinite(parsed) || parsed < 0) {
      setDraftQuantity(formatQuantity(quantity))
      return
    }
    onUpdateQuantity(item, parsed)
  }

  return (
    <li className="flex min-h-[48px] items-center gap-3 border-b border-border/25 px-4 last:border-0 hover:bg-secondary/30 transition-colors group">
      <div className="flex shrink-0 items-center gap-0.5">
        <button
          type="button"
          onClick={() => onUpdateQuantity(item, Math.max(0, quantity - 1))}
          aria-label="Diminuer"
          className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground transition-all"
        >
          <Minus className="h-3 w-3" />
        </button>
        <input
          value={draftQuantity}
          onChange={(event) => setDraftQuantity(event.target.value)}
          onBlur={commitQuantity}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.currentTarget.blur()
            }
            if (event.key === "Escape") {
              setDraftQuantity(formatQuantity(quantity))
              event.currentTarget.blur()
            }
          }}
          inputMode="decimal"
          aria-label="Quantite"
          className="h-6 w-14 rounded-full bg-secondary px-2 py-0.5 text-center text-xs font-semibold tabular-nums text-foreground outline-none ring-0"
        />
        <button
          type="button"
          onClick={() => onUpdateQuantity(item, quantity + 1)}
          aria-label="Augmenter"
          className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground transition-all"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>

      <span className="flex-1 min-w-0 flex flex-col gap-1">
        <span className="flex items-center gap-2 flex-wrap">
          {item.unit?.name && (
            <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
              {item.unit.name}
            </span>
          )}
          <span className="text-sm font-medium leading-tight">
            {item.food?.name ?? item.display ?? item.note ?? "Article sans nom"}
          </span>
        </span>
      </span>
      {item.label ? (
        <div className="hidden shrink-0 items-center gap-1 sm:flex">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: item.label.color ?? "--color-secondary" }}
            />
            <span className="truncate">{item.label.name}</span>
          </span>
        </div>
      ) : null}
      <button
        type="button"
        onClick={() => onDelete(item.id)}
        aria-label="Supprimer"
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10 transition-all"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </li>
  )
}

interface GroupedCellierFoodProps {
  items: ShoppingItem[]
  labels: ShoppingLabel[]
  onUpdateQuantity: (item: ShoppingItem, quantity: number) => void
  onDelete: (id: string) => void
}

export function GroupedCellierFood({ items, labels, onUpdateQuantity, onDelete }: GroupedCellierFoodProps) {
  const sortedGroups = useMemo(() => {
    const groups = new Map<string, { label: string; color?: string; items: ShoppingItem[] }>()

    for (const item of items) {
      const key = item.label?.id ?? "__none__"
      const labelName = item.label?.name ?? "Sans etiquette"
      if (!groups.has(key)) {
        groups.set(key, { label: labelName, color: item.label?.color, items: [] })
      }
      groups.get(key)?.items.push(item)
    }

    const labelOrder = new Map(labels.map((label, index) => [label.id, index]))
    return [...groups.entries()].sort(([a], [b]) => {
      if (a === "__none__") return 1
      if (b === "__none__") return -1
      return (labelOrder.get(a) ?? Number.MAX_SAFE_INTEGER) - (labelOrder.get(b) ?? Number.MAX_SAFE_INTEGER)
    })
  }, [items, labels])

  const defaultExpandedGroups = useMemo(() => {
    return getDefaultExpandedLabels(
      sortedGroups.map(([key, group]) => ({ key, itemCount: group.items.length })),
    )
  }, [sortedGroups])

  const [manualExpandedGroups, setManualExpandedGroups] = useState<Record<string, boolean>>({})

  if (sortedGroups.length === 0) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
        <PackageOpen className="h-4 w-4" />
        Aucun aliment dans le cellier
      </div>
    )
  }

  return (
    <div>
      {sortedGroups.map(([key, group], index) => (
        <div key={key}>
          {sortedGroups.length > 1 && (
            <LabelSectionHeader
              label={group.label}
              color={group.color}
              isFirst={index === 0}
              collapsible
              expanded={manualExpandedGroups[key] ?? defaultExpandedGroups.has(key)}
              itemCount={group.items.length}
              onToggle={() => {
                const currentExpanded = manualExpandedGroups[key] ?? defaultExpandedGroups.has(key)
                setManualExpandedGroups((prev) => ({
                  ...prev,
                  [key]: !currentExpanded,
                }))
              }}
            />
          )}
          {(manualExpandedGroups[key] ?? defaultExpandedGroups.has(key)) && (
            <ul>
              {group.items.map((item) => (
                <CellierFoodRow
                  key={item.id}
                  item={item}
                  onUpdateQuantity={onUpdateQuantity}
                  onDelete={onDelete}
                />
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  )
}
