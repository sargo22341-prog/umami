import { useMemo, useRef, useState } from "react"
import { Check, Pencil, Tag, Trash2, X } from "lucide-react"
import { Input } from "components/ui"
import { LabelSectionHeader } from "components/common/LabelSectionHeader.tsx"
import { cn } from "@/lib/utils"
import type { ShoppingItem, ShoppingLabel } from "@/domain/shopping/entities/ShoppingItem"
import { getDefaultExpandedLabels } from "@/shared/utils/labelCollapsing.ts"

interface HabituelFoodRowProps {
  item: ShoppingItem
  labels: ShoppingLabel[]
  selected: boolean
  onSelect: (itemId: string, selected: boolean) => void
  onDelete: (id: string) => void
  onUpdateNote: (item: ShoppingItem, note: string) => void
}

export function HabituelFoodRow({
  item,
  labels,
  selected,
  onSelect,
  onDelete,
  onUpdateNote,
}: HabituelFoodRowProps) {
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState(item.note ?? "")
  const inputRef = useRef<HTMLInputElement>(null)

  const name = item.food?.name ?? item.display ?? item.note ?? "Article sans nom"

  const handleEdit = () => {
    setEditValue(item.note ?? "")
    setEditing(true)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  const handleSave = () => {
    const trimmed = editValue.trim()
    if (trimmed) {
      onUpdateNote(item, trimmed)
    }
    setEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSave()
    if (e.key === "Escape") setEditing(false)
  }

  return (
    <li className="flex min-h-[48px] items-center gap-3 border-b border-border/25 px-4 last:border-0 hover:bg-secondary/30 transition-colors group">
      {!editing && (
        <button
          type="button"
          onClick={() => onSelect(item.id, !selected)}
          aria-label={selected ? "Retirer de la selection" : "Selectionner"}
          className={cn(
            "shrink-0 flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all",
            selected
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border hover:border-primary/50",
          )}
        >
          {selected && <Check className="h-3 w-3 stroke-[3]" />}
        </button>
      )}

      {editing ? (
        <div className="flex flex-1 items-center gap-1.5">
          <Input
            ref={inputRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="h-7 flex-1 rounded-xl text-sm"
          />
          <button
            type="button"
            onClick={handleSave}
            className="text-primary hover:text-primary/80 transition-colors"
          >
            <Check className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <>
          <span className="flex-1 min-w-0 flex flex-col gap-1">
            <span className="flex items-center gap-2 flex-wrap">
              {item.unit?.name && (
                <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                  {item.unit.name}
                </span>
              )}
              <span className="text-sm font-medium leading-tight">{name}</span>
            </span>
          </span>

          <div className="hidden shrink-0 items-center gap-1 sm:flex">
            {item.label ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: item.label.color ?? "--color-secondary" }}
                />
                <span className="truncate">{item.label.name}</span>
              </span>
            ) : labels.length > 0 ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                <Tag className="h-3 w-3" />
                <span>Sans etiquette</span>
              </span>
            ) : null}

            <button
              type="button"
              onClick={handleEdit}
              aria-label="Modifier"
              className="flex h-6 w-6 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(item.id)}
              aria-label="Supprimer"
              className="flex h-6 w-6 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </>
      )}
    </li>
  )
}

interface GroupedHabituelFoodProps {
  items: ShoppingItem[]
  labels: ShoppingLabel[]
  selectedIds: Set<string>
  onSelect: (itemId: string, selected: boolean) => void
  onDelete: (id: string) => void
  onUpdateNote: (item: ShoppingItem, note: string) => void
}

export function GroupedHabituelFood({
  items,
  labels,
  selectedIds,
  onSelect,
  onDelete,
  onUpdateNote,
}: GroupedHabituelFoodProps) {
  const sorted = useMemo(() => {
    const groups = new Map<string, { label: string; color?: string; items: ShoppingItem[] }>()

    for (const item of items) {
      const key = item.label?.id ?? "__none__"
      const labelName = item.label?.name ?? "Sans etiquette"
      if (!groups.has(key)) {
        groups.set(key, { label: labelName, color: item.label?.color, items: [] })
      }
      groups.get(key)!.items.push(item)
    }

    return [...groups.entries()].sort(([, groupA], [, groupB]) => {
      if (groupA.label === "Sans etiquette") return 1
      if (groupB.label === "Sans etiquette") return -1
      return groupA.label.localeCompare(groupB.label, "fr")
    })
  }, [items])

  const defaultExpandedGroups = useMemo(() => {
    return getDefaultExpandedLabels(
      sorted.map(([key, group]) => ({ key, itemCount: group.items.length })),
    )
  }, [sorted])

  const [manualExpandedGroups, setManualExpandedGroups] = useState<Record<string, boolean>>({})

  if (sorted.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        Aucun article habituel
      </p>
    )
  }

  return (
    <div>
      {sorted.map(([key, group], i) => (
        <div key={key}>
          {sorted.length > 1 && (
            <LabelSectionHeader
              label={group.label}
              color={group.color}
              isFirst={i === 0}
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
                <HabituelFoodRow
                  key={item.id}
                  item={item}
                  labels={labels}
                  selected={selectedIds.has(item.id)}
                  onSelect={onSelect}
                  onDelete={onDelete}
                  onUpdateNote={onUpdateNote}
                />
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  )
}
