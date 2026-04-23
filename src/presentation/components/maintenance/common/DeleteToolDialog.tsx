import { Loader2, TriangleAlert } from "lucide-react"
import { 
  Button, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "components/ui"

interface DeleteToolDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  toolName?: string
  title?: string
  description?: string
  confirmLabel?: string
  loading?: boolean
  onConfirm: () => Promise<void> | void
}

export function DeleteToolDialog({
  open,
  onOpenChange,
  toolName,
  title,
  description,
  confirmLabel,
  loading = false,
  onConfirm,
}: DeleteToolDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-md sm:w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TriangleAlert className="h-5 w-5 text-destructive" />
            {title ?? "Supprimer l'ustensile"}
          </DialogTitle>
          <DialogDescription>
            {description ??
              (toolName
                ? `Confirme la suppression de "${toolName}".`
                : "Confirme la suppression de cet ustensile.")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>
            Annuler
          </Button>
          <Button type="button" variant="destructive" onClick={() => void onConfirm()} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Suppression...
              </>
            ) : (
              confirmLabel ?? "Supprimer"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
