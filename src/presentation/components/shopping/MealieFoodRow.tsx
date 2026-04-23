import { useRef, useState } from "react"
import { Check, Minus, Plus, Tag, Trash2 } from "lucide-react"
import { LabelSectionHeader } from "components/common/LabelSectionHeader.tsx"
import { cn } from "@/lib/utils.ts"
import type { ShoppingItem, ShoppingLabel } from "@/domain/shopping/entities/ShoppingItem.ts"

function formatShoppingQuantity(quantity: number): string {
  if (!Number.isFinite(quantity)) return ""
  return quantity.toFixed(1).replace(/\.0$/, "")
}

function itemRecipeNames(item: ShoppingItem): string[] {
  if (item.referencedRecipe?.name) return [item.referencedRecipe.name]
  return []
}

interface MealieFoodRowProps {
  item: ShoppingItem
  labels: ShoppingLabel[]
  onToggle: (item: ShoppingItem) => void
  onDelete: (id: string) => void
  onUpdateQuantity: (item: ShoppingItem, qty: number) => void
  onUpdateNote: (item: ShoppingItem, note: string) => void
  onViewRecipe?: (recipeName: string) => void
}

function MealieFoodRow({ item, labels, onToggle, onDelete, onUpdateQuantity, onUpdateNote, onViewRecipe }: MealieFoodRowProps) {
  const itemQuantity = item.quantity ?? 0
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState(item.note ?? item.food?.name ?? "Article sans nom")
  const inputRef = useRef<HTMLInputElement>(null)
  const recipeNames = itemRecipeNames(item)

  const startEdit = () => {
    setEditValue(item.note ?? "")
    setEditing(true)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  const saveEdit = () => {
    const trimmed = editValue.trim()
    if (trimmed && trimmed !== item.note) {
      onUpdateNote(item, trimmed)
    }
    setEditing(false)
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") saveEdit()
    if (event.key === "Escape") setEditing(false)
  }

  return (
    <li className="group flex min-h-[48px] items-center gap-3 border-b border-border/25 px-4 last:border-0 transition-colors hover:bg-secondary/30">
      <button
        type="button"
        onClick={() => onToggle(item)}
        aria-label={item.checked ? "DÃ©cocher" : "Cocher"}
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all",
          item.checked ? "border-primary bg-primary" : "border-border hover:border-primary/50",
        )}
      >
        {item.checked && <Check className="h-3 w-3 stroke-[3] text-primary-foreground" />}
      </button>

      <div className="flex shrink-0 items-center gap-0.5">
        <button
          type="button"
          onClick={() => onUpdateQuantity(item, Math.max(0, itemQuantity - 1))}
          aria-label="Diminuer"
          className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground transition-all hover:bg-accent hover:text-foreground sm:opacity-0 sm:group-hover:opacity-100"
        >
          <Minus className="h-3 w-3" />
        </button>
        {itemQuantity > 0 ? (
          <span className="min-w-[1.5rem] rounded-full bg-secondary px-2 py-0.5 text-center text-xs font-semibold tabular-nums">
            {formatShoppingQuantity(itemQuantity)}
          </span>
        ) : (
          <span className="min-w-[1.5rem] rounded-full bg-muted px-2 py-0.5 text-center text-xs tabular-nums text-muted-foreground opacity-0 transition-all group-hover:opacity-100">
            â€”
          </span>
        )}
        <button
          type="button"
          onClick={() => onUpdateQuantity(item, itemQuantity + 1)}
          aria-label="Augmenter"
          className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground transition-all hover:bg-accent hover:text-foreground sm:opacity-0 sm:group-hover:opacity-100"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>

      {editing ? (
        <input
          ref={inputRef}
          value={editValue}
          onChange={(event) => setEditValue(event.target.value)}
          onBlur={saveEdit}
          onKeyDown={handleKeyDown}
          className="min-w-0 flex-1 border-b border-primary bg-transparent text-sm font-medium outline-none"
        />
      ) : (
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="flex flex-wrap items-center gap-2">
            {item.unit?.name && (
              <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                {item.unit.name}
              </span>
            )}
            <span
              onDoubleClick={startEdit}
              className={cn(
                "cursor-text text-sm font-medium leading-tight",
                item.checked && "line-through opacity-40",
              )}
            >
              {item.food?.name ?? item.display ?? item.note ?? "Article sans nom"}
            </span>
            {recipeNames.map((recipeName) => (
              <button
                key={recipeName}
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  onViewRecipe?.(recipeName)
                }}
                className="text-[10px] leading-tight text-muted-foreground/40 transition-colors hover:text-primary"
              >
                {recipeName}
              </button>
            ))}
          </span>

          {item.note && (
            <span
              className={cn(
                "text-xs leading-tight text-muted-foreground",
                item.checked && "opacity-40",
              )}
            >
              {item.note}
            </span>
          )}
        </span>
      )}

      <div className="hidden shrink-0 items-center gap-1 sm:flex">
        {!editing && item.label && (
          <div className="inline-flex h-6 max-w-[140px] items-center gap-1.5 rounded-full bg-muted px-2 text-xs text-muted-foreground">
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: item.label.color ?? "--color-secondary" }} />
            <span className="truncate">{item.label.name}</span>
          </div>
        )}
        {!editing && !item.label && labels.length > 0 && (
          <div className="inline-flex h-6 items-center gap-1.5 rounded-full bg-muted px-2 text-xs text-muted-foreground">
            <Tag className="h-3 w-3" />
            <span>Sans etiquette</span>
          </div>
        )}
        {!editing && (
          <button
            type="button"
            onClick={() => onDelete(item.id)}
            aria-label="Supprimer"
            className="flex h-6 w-6 items-center justify-center rounded-lg text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        )}
      </div>
    </li>
  )
}

function itemSortKey(item: ShoppingItem): string {
  const note = item.note?.split(" â€” ")[0] ?? ""
  return (item.food?.name ?? note).toLowerCase()
}

interface GroupedMealieFoodProps {
  items: ShoppingItem[]
  labels: ShoppingLabel[]
  onToggle: (item: ShoppingItem) => void
  onDelete: (id: string) => void
  onUpdateQuantity: (item: ShoppingItem, qty: number) => void
  onUpdateNote: (item: ShoppingItem, note: string) => void
  onAiCategorize?: (uncategorizedItems: ShoppingItem[]) => void
  aiCategorizeLoading?: boolean
  onViewRecipe?: (recipeName: string) => void
}

export function GroupedMealieFood({ items, labels, onToggle, onDelete, onUpdateQuantity, onUpdateNote, onAiCategorize, aiCategorizeLoading, onViewRecipe }: GroupedMealieFoodProps) {
  const unchecked = items.filter((item) => !item.checked)
  const checked = items.filter((item) => item.checked)

  const buildGroups = (list: ShoppingItem[]) => {
    const groups = new Map<string, { label: string; color?: string; items: ShoppingItem[] }>()
    for (const item of list) {
      const key = item.label?.id ?? "__none__"
      const labelName = item.label?.name ?? "Sans Ã©tiquette"
      if (!groups.has(key)) {
        groups.set(key, { label: labelName, color: item.label?.color, items: [] })
      }
      groups.get(key)!.items.push(item)
    }
    for (const group of groups.values()) {
      group.items.sort((a, b) => itemSortKey(a).localeCompare(itemSortKey(b), "fr"))
    }
    const labelOrder = new Map(labels.map((label, index) => [label.id, index]))
    return [...groups.entries()].sort(([a], [b]) => {
      if (a === "__none__") return 1
      if (b === "__none__") return -1
      const indexA = labelOrder.get(a) ?? Infinity
      const indexB = labelOrder.get(b) ?? Infinity
      return indexA - indexB
    })
  }

  if (items.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        Aucun article dans la liste
      </p>
    )
  }

  const uncheckedGroups = buildGroups(unchecked)
  const checkedGroups = buildGroups(checked)

  return (
    <div>
      {uncheckedGroups.map(([key, group]) => (
        <div key={key}>
          {uncheckedGroups.length > 1 && (
            <LabelSectionHeader
              label={group.label}
              color={group.color}
              onAiCategorize={key === "__none__" && onAiCategorize ? () => onAiCategorize(group.items) : undefined}
              aiCategorizeLoading={key === "__none__" ? aiCategorizeLoading : undefined}
            />
          )}
          <ul>
            {group.items.map((item) => (
              <MealieFoodRow
                key={item.id}
                item={item}
                labels={labels}
                onToggle={onToggle}
                onDelete={onDelete}
                onUpdateQuantity={onUpdateQuantity}
                onUpdateNote={onUpdateNote}
                onViewRecipe={onViewRecipe}
              />
            ))}
          </ul>
        </div>
      ))}

      {checked.length > 0 && unchecked.length > 0 && (
        <div className="flex items-center gap-2 px-4 py-2">
          <div className="h-px flex-1 bg-border/30" />
          <span className="text-xs font-medium text-muted-foreground/50">cochÃ©s</span>
          <div className="h-px flex-1 bg-border/30" />
        </div>
      )}

      {checkedGroups.map(([key, group]) => (
        <div key={key}>
          {checkedGroups.length > 1 && <LabelSectionHeader label={group.label} color={group.color} />}
          <ul>
            {group.items.map((item) => (
              <MealieFoodRow
                key={item.id}
                item={item}
                labels={labels}
                onToggle={onToggle}
                onDelete={onDelete}
                onUpdateQuantity={onUpdateQuantity}
                onUpdateNote={onUpdateNote}
                onViewRecipe={onViewRecipe}
              />
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
