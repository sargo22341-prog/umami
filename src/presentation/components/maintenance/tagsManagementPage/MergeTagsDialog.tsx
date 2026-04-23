import { useMemo, useState } from "react"
import { AlertTriangle, Loader2 } from "lucide-react"
import {
  Button, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "components/ui"
import type { MealieRecipeTag } from "@/shared/types/mealie/Tags.ts"

interface MergeTagsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tags: MealieRecipeTag[]
  loading?: boolean
  onConfirm: (winnerTagId: string) => Promise<void> | void
}

export function MergeTagsDialog({
  open,
  onOpenChange,
  tags,
  loading = false,
  onConfirm,
}: MergeTagsDialogProps) {
  const sortedTags = useMemo(
    () => [...tags].sort((a, b) => a.name.localeCompare(b.name, "fr", { sensitivity: "base" })),
    [tags],
  )
  const [winnerTagId, setWinnerTagId] = useState<string>(sortedTags[0]?.id ?? "")

  const handleConfirm = async () => {
    if (!winnerTagId) return
    await onConfirm(winnerTagId)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-lg sm:w-full">
        <DialogHeader>
          <DialogTitle>Fusionner les tags</DialogTitle>
          <DialogDescription>
            Choisis le tag qui doit rester. Les recettes des autres tags seront rattachees a celui-ci,
            puis les tags non selectionnes seront supprimes.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-[var(--radius-xl)] border border-amber-300/50 bg-amber-50/70 p-4 text-sm text-amber-900 dark:border-amber-700/40 dark:bg-amber-950/20 dark:text-amber-200">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>Attention, cette action est irreversible.</p>
          </div>
        </div>

        <div className="space-y-2">
          {sortedTags.map((tag) => (
            <label
              key={tag.id}
              className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-border/40 bg-card px-3 py-3 text-sm"
            >
              <input
                type="checkbox"
                checked={winnerTagId === tag.id}
                onChange={() => setWinnerTagId(tag.id)}
                className="h-4 w-4 rounded border-border text-primary focus:ring-ring"
              />
              <span className="font-medium text-foreground">{tag.name}</span>
            </label>
          ))}
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>
            Annuler
          </Button>
          <Button type="button" onClick={() => void handleConfirm()} disabled={loading || !winnerTagId}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Fusion...
              </>
            ) : (
              "Fusionner"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
