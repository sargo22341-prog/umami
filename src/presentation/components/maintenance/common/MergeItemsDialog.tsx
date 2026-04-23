import { useState } from "react"
import { AlertTriangle, Loader2 } from "lucide-react"
import { 
  Button, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "components/ui"

interface MergeItemsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  items: Array<{ id: string; name: string }>
  loading?: boolean
  onConfirm: (winnerId: string) => Promise<void> | void
}

export function MergeItemsDialog({
  open,
  onOpenChange,
  title,
  description,
  items,
  loading = false,
  onConfirm,
}: MergeItemsDialogProps) {
  const [winnerId, setWinnerId] = useState("")

  const effectiveWinnerId = items.some((item) => item.id === winnerId) ? winnerId : (items[0]?.id ?? "")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-md sm:w-full">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="rounded-[var(--radius-xl)] border border-amber-300/50 bg-amber-50/70 p-3 text-sm text-amber-900">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>Cette action est irreversible.</p>
          </div>
        </div>

        <div className="space-y-2">
          {items.map((item) => (
            <label
              key={item.id}
              className="flex items-center gap-3 rounded-[var(--radius-xl)] border border-border/50 bg-card px-4 py-3 text-sm"
            >
              <input
                type="checkbox"
                checked={winnerId === item.id}
                onChange={() => setWinnerId(item.id)}
                className="h-4 w-4 rounded border-border text-primary focus:ring-ring"
              />
              <span className="font-medium text-foreground">{item.name}</span>
            </label>
          ))}
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>
            Annuler
          </Button>
          <Button type="button" onClick={() => void onConfirm(effectiveWinnerId)} disabled={loading || !effectiveWinnerId}>
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
