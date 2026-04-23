import { useMemo, useState } from "react"
import { Loader2, Minus, Plus } from "lucide-react"
import {
  Input, Button, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "components/ui"
import { LabelSectionHeader } from "components/common/LabelSectionHeader.tsx"
import type { ShoppingItem } from "@/domain/shopping/entities/ShoppingItem.ts"
import type { MealieIngredientUnitOutput } from "@/shared/types/mealie/Units.ts"
import { UnitDropdownSelect } from "components/shopping/UnitDropdownSelect.tsx"

interface HabituelCartSelection {
  item: ShoppingItem
  quantity: number
  unitId?: string
  note: string
}

interface AddHabitualsToCartDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  items: ShoppingItem[]
  units: MealieIngredientUnitOutput[]
  loading?: boolean
  onSubmit: (selections: HabituelCartSelection[]) => Promise<void> | void
}

interface GroupedSelections {
  key: string
  label: string
  color?: string
  selections: HabituelCartSelection[]
}

export function AddHabitualsToCartDialog({
  open,
  onOpenChange,
  items,
  units,
  loading = false,
  onSubmit,
}: AddHabitualsToCartDialogProps) {
  const dialogKey = useMemo(() => items.map((item) => item.id).join(":"), [items])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <AddHabitualsToCartDialogContent
        key={`${open ? "open" : "closed"}:${dialogKey}`}
        items={items}
        units={units}
        loading={loading}
        onOpenChange={onOpenChange}
        onSubmit={onSubmit}
      />
    </Dialog>
  )
}

interface AddHabitualsToCartDialogContentProps {
  items: ShoppingItem[]
  units: MealieIngredientUnitOutput[]
  loading: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (selections: HabituelCartSelection[]) => Promise<void> | void
}

function AddHabitualsToCartDialogContent({
  items,
  units,
  loading,
  onOpenChange,
  onSubmit,
}: AddHabitualsToCartDialogContentProps) {
  const [selections, setSelections] = useState<HabituelCartSelection[]>(() =>
    items.map((item) => ({
      item,
      quantity: 1,
      unitId: item.unit?.id ?? "",
      note: "",
    })),
  )

  const groupedSelections = useMemo<GroupedSelections[]>(() => {
    const groups = new Map<string, GroupedSelections>()

    for (const selection of selections) {
      const key = selection.item.label?.id ?? "__none__"
      const label = selection.item.label?.name ?? "Sans etiquette"
      if (!groups.has(key)) {
        groups.set(key, {
          key,
          label,
          color: selection.item.label?.color,
          selections: [],
        })
      }
      groups.get(key)?.selections.push(selection)
    }

    return [...groups.values()].sort((a, b) => {
      if (a.key === "__none__") return 1
      if (b.key === "__none__") return -1
      return a.label.localeCompare(b.label, "fr")
    })
  }, [selections])

  const canSubmit = useMemo(
    () => selections.length > 0 && selections.every((selection) => selection.quantity > 0),
    [selections],
  )

  const updateSelection = (
    itemId: string,
    updater: (selection: HabituelCartSelection) => HabituelCartSelection,
  ) => {
    setSelections((prev) =>
      prev.map((selection) =>
        selection.item.id === itemId ? updater(selection) : selection,
      ),
    )
  }

  const setSelectionUnit = (itemId: string, unitId: string) => {
    updateSelection(itemId, (current) => ({
      ...current,
      unitId,
    }))
  }

  const setQuantity = (itemId: string, quantity: number) => {
    updateSelection(itemId, (current) => ({
      ...current,
      quantity,
    }))
  }

  const handleSubmit = async () => {
    await onSubmit(
      selections.map((selection) => ({
        ...selection,
        quantity: Math.max(1, selection.quantity),
        unitId: selection.unitId || undefined,
      })),
    )
  }

  return (
    <DialogContent className="w-[calc(100vw-2rem)] max-w-3xl sm:w-full">
      <DialogHeader>
        <DialogTitle>Ajouter aux prochaines courses</DialogTitle>
        <DialogDescription>
          Modifie directement la quantite et l'unite sur chaque ligne.
        </DialogDescription>
      </DialogHeader>

      <div className="max-h-[70vh] overflow-y pr-1">
        {groupedSelections.map((group, groupIndex) => (
          <div key={group.key}>
            {groupedSelections.length > 1 && (
              <LabelSectionHeader
                label={group.label}
                color={group.color}
                isFirst={groupIndex === 0}
              />
            )}

            <div className="space-y-2 bg-card/20 px-0 py-2">
              {group.selections.map((selection) => {
                const itemName = selection.item.food?.name ?? selection.item.note ?? "Article sans nom"

                return (
                  <div
                    key={selection.item.id}
                    className="flex min-h-[48px] flex-wrap items-center gap-2  px-3 py-3"
                  >
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={loading}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() =>
                          updateSelection(selection.item.id, (current) => ({
                            ...current,
                            quantity: Math.max(0.1, Number((current.quantity - 1).toFixed(1))),
                          }))
                        }
                        className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        value={selection.quantity}
                        disabled={loading}
                        onChange={(event) => {
                          const next = Number(event.target.value)
                          updateSelection(selection.item.id, (current) => ({
                            ...current,
                            quantity: Number.isFinite(next) && next > 0 ? next : current.quantity,
                          }))
                        }}
                        onBlur={(event) => {
                          const next = Number(event.target.value)
                          setQuantity(selection.item.id, Number.isFinite(next) && next > 0 ? next : 1)
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === "Escape") {
                            const next = Number(event.currentTarget.value)
                            setQuantity(selection.item.id, Number.isFinite(next) && next > 0 ? next : 1)
                            event.currentTarget.blur()
                          }
                        }}
                        className="h-8 w-20 text-center font-semibold tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      />
                      <button
                        type="button"
                        disabled={loading}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() =>
                          updateSelection(selection.item.id, (current) => ({
                            ...current,
                            quantity: Number((current.quantity + 1).toFixed(1)),
                          }))
                        }
                        className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="min-w-[150px] max-w-[220px] flex-1">
                      <UnitDropdownSelect
                        units={units}
                        value={selection.unitId}
                        disabled={loading}
                        onChange={(value) => setSelectionUnit(selection.item.id, value)}
                        placeholder="___"
                        buttonClassName="h-8"
                        valueMode="id"
                      />
                    </div>

                    <span className="min-w-0 flex-1 text-sm font-medium text-foreground">
                      {itemName}
                    </span>

                    {selection.item.label && (
                      <span className="inline-flex max-w-[140px] items-center gap-1.5 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ backgroundColor: selection.item.label.color ?? "rgba(148, 163, 184, 0.9)" }}
                        />
                        <span className="truncate">{selection.item.label.name}</span>
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>
          Annuler
        </Button>
        <Button type="button" onClick={() => void handleSubmit()} disabled={loading || !canSubmit}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Ajout en cours...
            </>
          ) : (
            "Ajouter aux prochaines courses"
          )}
        </Button>
      </div>
    </DialogContent>
  )
}
