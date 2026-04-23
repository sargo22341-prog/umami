import type { ReactNode } from "react"

import { 
  Button, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "components/ui"

type SettingsConfirmDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: ReactNode
  note?: ReactNode
  confirmLabel: string
  confirmIcon?: ReactNode
  onConfirm: () => void
}

export function SettingsConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  note,
  confirmLabel,
  confirmIcon,
  onConfirm,
}: SettingsConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-md sm:w-full">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {note && (
          <div className="rounded-[var(--radius-xl)] border border-border/50 bg-secondary/20 p-3 text-sm text-muted-foreground">
            {note}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            type="button"
            onClick={() => {
              onOpenChange(false)
              onConfirm()
            }}
            className="gap-1.5"
          >
            {confirmIcon}
            {confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
