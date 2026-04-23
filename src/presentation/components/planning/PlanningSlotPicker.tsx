import { useState, useEffect } from "react"
import { Loader2, Plus } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "components/ui/dialog.tsx"
import { getPlanningRangeUseCase } from "@/infrastructure/container.ts"
import type { MealieReadPlanEntry } from "@/shared/types/mealie/MealPlan.ts"
import { cn } from "@/lib/utils.ts"
import { addDays, formatDayFr, startOfDay, toDateStr } from "@/shared/utils"

const SLOT_TYPES = [
  { key: "breakfast", label: "Petit déj." },
  { key: "lunch", label: "Déj." },
  { key: "snack", label: "Encas" },
  { key: "dinner", label: "Dîner" },
] as const

export interface PlanningSlotPickerProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  recipeName: string
  onSelect: (date: string, entryType: string, existingMealId?: number) => Promise<void>
}

export function PlanningSlotPicker({ open, onOpenChange, recipeName, onSelect }: PlanningSlotPickerProps) {
  const [slots, setSlots] = useState<MealieReadPlanEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [addingSlot, setAddingSlot] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    const today = startOfDay(new Date())
    const end = addDays(today, 13)
    getPlanningRangeUseCase
      .execute(toDateStr(today), toDateStr(end))
      .then(setSlots)
      .catch(() => setSlots([]))
      .finally(() => setLoading(false))
  }, [open])

  const today = startOfDay(new Date())
  const days = Array.from({ length: 14 }, (_, i) => toDateStr(addDays(today, i)))

  const mealMap = new Map(slots.map((meal) => [`${meal.date}-${meal.entryType}`, meal]))

  const handleSlotClick = async (date: string, entryType: string) => {
    const key = `${date}-${entryType}`
    const existing = mealMap.get(key)
    setAddingSlot(key)
    try {
      await onSelect(date, entryType, existing?.id)
    } finally {
      setAddingSlot(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading text-base">Où placer cet élément ?</DialogTitle>
          <p className="text-sm text-muted-foreground">{recipeName}</p>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="-mr-1 max-h-[60vh] space-y-2 overflow-y-auto pr-1">
            {days.map((date) => (
              <div key={date} className="grid grid-cols-[88px_1fr] items-start gap-2 sm:grid-cols-[88px_1fr_1fr]">
                <span className="truncate pt-2 text-[11px] capitalize text-muted-foreground">{formatDayFr(date)}</span>
                <div className="grid grid-cols-2 gap-1.5 sm:col-span-2">
                  {SLOT_TYPES.map(({ key, label }) => (
                    <SlotButton
                      key={key}
                      meal={mealMap.get(`${date}-${key}`)}
                      label={label}
                      isAdding={addingSlot === `${date}-${key}`}
                      onClick={() => void handleSlotClick(date, key)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="pt-1 text-center text-[11px] text-muted-foreground/50">
          Cliquez sur un créneau vide pour l'ajouter, ou sur un repas existant pour le remplacer.
        </p>
      </DialogContent>
    </Dialog>
  )
}

function SlotButton({ meal, label, isAdding, onClick }: {
  meal?: MealieReadPlanEntry
  label: string
  isAdding: boolean
  onClick: () => void
}) {
  if (isAdding) {
    return (
      <div className="flex h-8 items-center justify-center rounded-[var(--radius-md)] border border-primary/30 bg-primary/5">
        <Loader2 className="h-3 w-3 animate-spin text-primary" />
      </div>
    )
  }

  if (meal) {
    return (
      <button
        onClick={onClick}
        title={`Remplacer : ${meal.recipe?.name ?? meal.title}`}
        className={cn(
          "h-8 overflow-hidden rounded-[var(--radius-md)] border border-border bg-muted/40 px-2 text-left",
          "transition-colors hover:border-destructive/40 hover:bg-destructive/5 group",
        )}
      >
        <span className="block truncate text-[11px] leading-none text-foreground/70 group-hover:text-destructive">
          {meal.recipe?.name ?? meal.title ?? label}
        </span>
      </button>
    )
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex h-8 items-center justify-center gap-1 rounded-[var(--radius-md)] border border-dashed border-border/50 px-2",
        "transition-colors hover:border-primary/50 hover:bg-primary/5",
      )}
    >
      <Plus className="h-3 w-3 text-muted-foreground/40" />
      <span className="text-[11px] text-muted-foreground/40">{label}</span>
    </button>
  )
}
