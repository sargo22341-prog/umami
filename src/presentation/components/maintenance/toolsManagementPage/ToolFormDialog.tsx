import { useState } from "react"
import { Loader2 } from "lucide-react"
import {
  Button, Input, Label, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "components/ui"

interface ToolFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "create" | "edit"
  initialName?: string
  initialAvailable?: boolean
  loading?: boolean
  onSubmit: (values: { name: string; available: boolean }) => Promise<void> | void
}

export function ToolFormDialog({
  open,
  onOpenChange,
  mode,
  initialName = "",
  initialAvailable = true,
  loading = false,
  onSubmit,
}: ToolFormDialogProps) {
  const [name, setName] = useState(initialName)
  const [available, setAvailable] = useState(initialAvailable)
  const isEdit = mode === "edit"

  const handleSubmit = async () => {
    if (!name.trim()) return
    await onSubmit({ name, available })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-md sm:w-full" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editer l'ustensile" : "Ajouter un ustensile"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Modifie le nom et sa disponibilite pour ton foyer."
              : "Ajoute un nouvel ustensile dans Mealie."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="tool-name">Nom</Label>
            <Input
              id="tool-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ex: Poele, Fouet, Mixeur..."
              disabled={loading}
            />
          </div>

          <label className="flex items-center gap-3 rounded-[var(--radius-xl)] border border-border/50 bg-secondary/20 px-4 py-3 text-sm">
            <input
              type="checkbox"
              checked={available}
              onChange={(event) => setAvailable(event.target.checked)}
              disabled={loading}
              className="h-4 w-4 rounded border-border text-primary focus:ring-ring"
            />
            <span>
              Disponible dans mon foyer
            </span>
          </label>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>
            Annuler
          </Button>
          <Button type="button" onClick={() => void handleSubmit()} disabled={loading || !name.trim()}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Enregistrement...
              </>
            ) : (
              isEdit ? "Enregistrer" : "Ajouter"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
