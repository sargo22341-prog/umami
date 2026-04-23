import { Loader2, ShoppingBasket, Plus } from "lucide-react"

import { cn } from "@/lib/utils.ts"
import type { ShoppingItem, ShoppingLabel } from "@/domain/shopping/entities/ShoppingItem.ts"
import type { MealieIngredientUnitOutput } from "@/shared/types/mealie/Units.ts"
import { GroupedHabituelFood } from "./HabituelFoodRow.tsx"
import { FormLabelSelect } from "components/shopping/LabelDropdownFood.tsx"
import { AddHabitualsToCartDialog } from "./AddHabituelsToCartDialog.tsx"
import { Button, Combobox } from "components/ui"

interface ShoppingHabituelSectionProps {
  items: ShoppingItem[]
  labels: ShoppingLabel[]
  sortedLabels: ShoppingLabel[]
  selectedIds: Set<string>
  selectedItems: ShoppingItem[]
  dialogOpen: boolean
  units: MealieIngredientUnitOutput[]
  addInput: string
  addLabelId: string
  foodOptions: Array<{ id: string; label: string }>
  adding: boolean
  addingSelected: boolean
  selectedExistingFoodLabelId?: string | null
  onDialogOpenChange: (open: boolean) => void
  onInputChange: (value: string, foodId?: string) => void
  onLabelChange: (value: string) => void
  onSelect: (itemId: string, selected: boolean) => void
  onDelete: (id: string) => void
  onUpdateNote: (item: ShoppingItem, note: string) => void
  onAdd: (event: React.FormEvent) => void
  onAddSelected: (selections: Array<{ item: ShoppingItem; quantity: number; unitId?: string; note?: string }>) => void
  onFocusFoods: () => void
  onClearAll: () => void
  clearing: boolean
}

export function ShoppingHabituelSection({
  items,
  labels,
  sortedLabels,
  selectedIds,
  selectedItems,
  dialogOpen,
  units,
  addInput,
  addLabelId,
  foodOptions,
  adding,
  addingSelected,
  selectedExistingFoodLabelId,
  onDialogOpenChange,
  onInputChange,
  onLabelChange,
  onSelect,
  onDelete,
  onUpdateNote,
  onAdd,
  onAddSelected,
  onFocusFoods,
  onClearAll,
  clearing,
}: ShoppingHabituelSectionProps) {
  return (
    <>
      <AddHabitualsToCartDialog
        open={dialogOpen}
        onOpenChange={onDialogOpenChange}
        items={selectedItems}
        units={units}
        loading={addingSelected}
        onSubmit={onAddSelected}
      />

      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold">Habituels</h2>
          {items.length > 0 && (
            <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold text-muted-foreground">
              {items.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {selectedItems.length > 0 && (
            <Button
              type="button"
              size="sm"
              onClick={() => onDialogOpenChange(true)}
              className="gap-1.5 shadow-subtle"
            >
              <ShoppingBasket className="h-3.5 w-3.5" />
              Ajouter {selectedItems.length} selection{selectedItems.length > 1 ? "s" : ""}
            </Button>
          )}
          {items.length > 0 && (
            <button
              type="button"
              onClick={onClearAll}
              disabled={clearing}
              className="text-xs font-medium text-destructive transition-colors hover:text-destructive/80 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {clearing ? "Suppression..." : "Tout supprimer"}
            </button>
          )}
        </div>
      </div>

      <div className="rounded-[var(--radius-2xl)] border border-border/50 bg-card shadow-subtle">
        <GroupedHabituelFood
          items={items}
          labels={labels}
          selectedIds={selectedIds}
          onSelect={onSelect}
          onDelete={onDelete}
          onUpdateNote={onUpdateNote}
        />

        <div className="rounded-b-[var(--radius-2xl)] border-t border-border/40 bg-secondary/20 p-3">
          <form onSubmit={onAdd} className="flex gap-2">
            <Combobox
              value={addInput}
              onChange={(value, option) => onInputChange(value, option?.id && option.id !== "__create__" ? option.id : undefined)}
              options={foodOptions}
              allowCreate
              createLabel={(value) => `Creer "${value}"`}
              onFocus={onFocusFoods}
              placeholder="Ajouter un habituel..."
              className="flex-1"
              inputClassName="h-8 text-sm"
              disabled={adding}
              aria-label="Ajouter un habituel"
            />
            {labels.length > 0 && (
              selectedExistingFoodLabelId ? (
                <div
                  className={cn(
                    "flex h-8 items-center gap-2 rounded-[var(--radius-lg)] border border-input bg-secondary/40 px-2.5 text-xs text-muted-foreground",
                    "max-w-[150px] shrink-0",
                  )}
                >
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{
                      backgroundColor:
                        labels.find((label) => label.id === selectedExistingFoodLabelId)?.color ??
                        "--color-secondary",
                    }}
                  />
                  <span className="truncate">
                    {sortedLabels.find((label) => label.id === selectedExistingFoodLabelId)?.name ?? "Sans etiquette"}
                  </span>
                </div>
              ) : (
                <FormLabelSelect
                  labels={sortedLabels}
                  value={addLabelId}
                  onChange={onLabelChange}
                  disabled={adding}
                />
              )
            )}
            <Button
              type="submit"
              size="sm"
              className="h-8 shrink-0"
              disabled={adding || !addInput.trim()}
            >
              {adding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            </Button>
          </form>
        </div>
      </div>
    </>
  )
}
