import { useMemo, useState } from "react"
import { CalendarDays, Check, Loader2 } from "lucide-react"

import { cn } from "@/lib/utils.ts"
import type { DayRecipeSummary, VisiblePlanningDay } from "./planningCart.utils.ts"
import { 
  Button, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "components/ui"

interface DaySelectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  visibleDays: VisiblePlanningDay[]
  dayRecipeSummaries: DayRecipeSummary[]
  submitting?: boolean
  onConfirm: (selectedDates: string[]) => void | Promise<void>
}

function DaySelectionDialogBody({
  visibleDays,
  dayRecipeSummaries,
  submitting = false,
  onOpenChange,
  onConfirm,
}: Omit<DaySelectionDialogProps, "open">) {
  const dayRecipeSummaryByDate = useMemo(
    () => new Map(dayRecipeSummaries.map((day) => [day.date, day])),
    [dayRecipeSummaries],
  )
  const selectableDates = useMemo(
    () => new Set(dayRecipeSummaries.filter((day) => day.hasRecipes).map((day) => day.date)),
    [dayRecipeSummaries],
  )
  const dayColumns = useMemo(() => {
    const chunkSize = 7
    return visibleDays.reduce<VisiblePlanningDay[][]>((columns, day, index) => {
      const columnIndex = Math.floor(index / chunkSize)
      if (!columns[columnIndex]) columns[columnIndex] = []
      columns[columnIndex].push(day)
      return columns
    }, [])
  }, [visibleDays])
  const [selectedDates, setSelectedDates] = useState<string[]>(() =>
    visibleDays.filter((day) => selectableDates.has(day.date)).map((day) => day.date),
  )

  const selectedSet = useMemo(() => new Set(selectedDates), [selectedDates])
  const hasVisibleDays = visibleDays.length > 0
  const hasSelectableDays = selectableDates.size > 0

  const toggleDate = (date: string) => {
    if (!selectableDates.has(date)) return

    setSelectedDates((prev) => (
      prev.includes(date)
        ? prev.filter((item) => item !== date)
        : [...prev, date]
    ))
  }

  const handleSubmit = async () => {
    if (selectedDates.length === 0 || submitting) return
    await onConfirm(selectedDates)
  }

  return (
    <DialogContent className="flex max-h-[80vh] max-w-3xl flex-col overflow-hidden">
      <DialogHeader>
        <DialogTitle>Choisir les jours a ajouter au panier</DialogTitle>
        <DialogDescription>
          Selectionnez un ou plusieurs jours visibles dans votre planning pour preparer la liste de courses.
        </DialogDescription>
      </DialogHeader>

      {!hasVisibleDays ? (
        <div className="rounded-[var(--radius-xl)] border border-border/50 bg-secondary/20 p-5 text-sm text-muted-foreground">
          Aucun jour n&apos;est visible dans le planning pour le moment.
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto pr-1">
          <div className="grid gap-3 md:grid-cols-2">
            {dayColumns.map((column, columnIndex) => (
              <div key={`day-column-${columnIndex}`} className="space-y-3">
                {column.map((day) => {
                  const summary = dayRecipeSummaryByDate.get(day.date)
                  const isSelectable = summary?.hasRecipes === true
                  const isSelected = selectedSet.has(day.date)
                  const recipeCount = summary?.recipeCount ?? 0

                  return (
                    <button
                      key={day.date}
                      type="button"
                      onClick={() => toggleDate(day.date)}
                      disabled={!isSelectable || submitting}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-[var(--radius-xl)] border px-4 py-3 text-left transition-colors",
                        isSelected
                          ? "border-primary/50 bg-primary/8 shadow-subtle"
                          : "border-border/50 bg-card hover:bg-secondary/40",
                        !isSelectable && "cursor-not-allowed opacity-55 hover:bg-card",
                      )}
                    >
                      <div
                        className={cn(
                          "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border",
                          isSelected
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-background text-transparent",
                        )}
                      >
                        <Check className="h-3.5 w-3.5" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-foreground">{day.label}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {isSelectable
                            ? `${recipeCount} recette${recipeCount > 1 ? "s" : ""} disponible${recipeCount > 1 ? "s" : ""}`
                            : "Aucune recette exploitable pour ce jour"}
                        </p>
                      </div>

                      <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" />
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-3 border-t border-border/40 pt-4">
        <p className="text-xs text-muted-foreground">
          {hasSelectableDays
            ? `${selectedDates.length} jour${selectedDates.length > 1 ? "s" : ""} selectionne${selectedDates.length > 1 ? "s" : ""}`
            : "Aucun jour selectionnable"}
        </p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Annuler
          </Button>
          <Button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={!hasSelectableDays || selectedDates.length === 0 || submitting}
            className="gap-2"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : null}
            Valider
          </Button>
        </div>
      </div>
    </DialogContent>
  )
}

export function DaySelectionDialog({
  open,
  onOpenChange,
  visibleDays,
  dayRecipeSummaries,
  submitting = false,
  onConfirm,
}: DaySelectionDialogProps) {
  const stateKey = [
    ...visibleDays.map((day) => day.date),
    ...dayRecipeSummaries.map((summary) => `${summary.date}:${summary.recipeCount}`),
  ].join("|")

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !submitting && onOpenChange(nextOpen)}>
      {open && (
        <DaySelectionDialogBody
          key={stateKey}
          visibleDays={visibleDays}
          dayRecipeSummaries={dayRecipeSummaries}
          submitting={submitting}
          onOpenChange={onOpenChange}
          onConfirm={onConfirm}
        />
      )}
    </Dialog>
  )
}
