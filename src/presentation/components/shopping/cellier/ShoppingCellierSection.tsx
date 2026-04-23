import { Loader2, Minus, PackageOpen, Plus } from "lucide-react"

import type { ShoppingItem, ShoppingLabel } from "@/domain/shopping/entities/ShoppingItem.ts"
import type { MealieIngredientUnitOutput } from "@/shared/types/mealie/Units.ts"
import { GroupedCellierFood } from "./CellierFoodRow.tsx"
import { UnitDropdownSelect } from "components/shopping/UnitDropdownSelect.tsx"
import { Button, Combobox } from "components/ui"

interface ShoppingCellierSectionProps {
  items: ShoppingItem[]
  labels: ShoppingLabel[]
  units: MealieIngredientUnitOutput[]
  addInput: string
  addQuantity: number
  addUnitId: string
  foodOptions: Array<{ id: string; label: string }>
  adding: boolean
  deductionSummary: string[]
  clearing: boolean
  onInputChange: (value: string, foodId?: string) => void
  onQuantityChange: (value: number) => void
  onUnitChange: (value: string) => void
  onAdd: (event: React.FormEvent) => void
  onOpenUnits: () => void
  onFocusFoods: () => void
  onUpdateQuantity: (item: ShoppingItem, qty: number) => void
  onDelete: (id: string) => void
  onClearAll: () => void
}

export function ShoppingCellierSection({
  items,
  labels,
  units,
  addInput,
  addQuantity,
  addUnitId,
  foodOptions,
  adding,
  deductionSummary,
  clearing,
  onInputChange,
  onQuantityChange,
  onUnitChange,
  onAdd,
  onOpenUnits,
  onFocusFoods,
  onUpdateQuantity,
  onDelete,
  onClearAll,
}: ShoppingCellierSectionProps) {
  return (
    <>
      <div className="mb-3 mt-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PackageOpen className="h-4 w-4 text-primary" />
          <h2 className="text-base font-bold">Cellier</h2>
          {items.length > 0 && (
            <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold text-muted-foreground">
              {items.length}
            </span>
          )}
        </div>
        {items.length > 0 && (
          <button
            type="button"
            onClick={onClearAll}
            disabled={clearing}
            className="text-xs font-medium text-destructive transition-colors hover:text-destructive/80 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {clearing ? "Vidage..." : "Tout vider"}
          </button>
        )}
      </div>

      <div className="rounded-[var(--radius-2xl)] border border-border/50 bg-card shadow-subtle">
        <GroupedCellierFood
          items={items}
          labels={labels}
          onUpdateQuantity={onUpdateQuantity}
          onDelete={onDelete}
        />

        <div className="border-t border-border/40 bg-secondary/20 p-3">
          <form onSubmit={onAdd} className="flex flex-col gap-2">
            <div className="flex gap-2">
              <div className="flex shrink-0 items-center overflow-hidden rounded-[var(--radius-lg)] border border-input bg-card">
                <button
                  type="button"
                  onClick={() => onQuantityChange(Math.max(1, addQuantity - 1))}
                  className="flex h-8 w-7 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                  aria-label="Diminuer"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={addQuantity}
                  onChange={(event) => {
                    const nextValue = Number(event.target.value)
                    onQuantityChange(Number.isFinite(nextValue) && nextValue > 0 ? nextValue : 1)
                  }}
                  className="h-8 w-16 bg-transparent text-center text-sm font-semibold tabular-nums outline-none"
                />
                <button
                  type="button"
                  onClick={() => onQuantityChange(addQuantity + 1)}
                  className="flex h-8 w-7 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                  aria-label="Augmenter"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>

              <UnitDropdownSelect
                units={units}
                value={addUnitId}
                onChange={onUnitChange}
                onOpen={onOpenUnits}
                placeholder="Unite"
                className="max-w-[100px] shrink-0"
                buttonClassName="h-8 bg-card py-0"
                valueMode="id"
              />

              <Combobox
                value={addInput}
                onChange={(value, option) => onInputChange(value, option?.id && option.id !== "__create__" ? option.id : undefined)}
                options={foodOptions}
                allowCreate
                createLabel={(value) => `Creer "${value}"`}
                onFocus={onFocusFoods}
                placeholder="Ajouter au cellier..."
                className="flex-1"
                inputClassName="h-8 text-sm"
                disabled={adding}
                aria-label="Ajouter au cellier"
              />
              <Button
                type="submit"
                size="sm"
                className="h-8 shrink-0"
                disabled={adding || !addInput.trim()}
              >
                {adding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              </Button>
            </div>
          </form>
        </div>

        {deductionSummary.length > 0 && (
          <div className="border-t border-border/40 bg-background/60 px-4 py-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              Resume de la deduction
            </p>
            <div className="space-y-1.5">
              {deductionSummary.map((summary) => (
                <p key={summary} className="text-sm text-muted-foreground">
                  {summary}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
