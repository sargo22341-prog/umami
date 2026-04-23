import { useState } from "react"
import { Loader2 } from "lucide-react"
import {
  ColorPickerField, Label, Input, Button, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "components/ui"
import { randomHexColor } from "@/shared/utils"

interface LabelFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "create" | "edit"
  initialName?: string
  initialColor?: string
  loading?: boolean
  onSubmit: (values: { name: string; color: string }) => Promise<void> | void
}

export function LabelFormDialog({
  open,
  onOpenChange,
  mode,
  initialName = "",
  initialColor = "#959595",
  loading = false,
  onSubmit,
}: LabelFormDialogProps) {
  const dialogKey = `${mode}:${open ? "open" : "closed"}:${initialName}:${initialColor}`

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <LabelFormDialogContent
        key={dialogKey}
        onOpenChange={onOpenChange}
        mode={mode}
        initialName={initialName}
        initialColor={initialColor}
        loading={loading}
        onSubmit={onSubmit}
      />
    </Dialog>
  )
}

interface LabelFormDialogContentProps {
  onOpenChange: (open: boolean) => void
  mode: "create" | "edit"
  initialName: string
  initialColor: string
  loading: boolean
  onSubmit: (values: { name: string; color: string }) => Promise<void> | void
}

function LabelFormDialogContent({
  onOpenChange,
  mode,
  initialName,
  initialColor,
  loading,
  onSubmit,
}: LabelFormDialogContentProps) {
  const [name, setName] = useState(initialName)
  const [color, setColor] = useState(initialColor)
  const isEdit = mode === "edit"

  const handleSubmit = async () => {
    if (!name.trim()) return
    await onSubmit({ name: name.trim(), color })
  }

  return (
    <DialogContent className="w-[calc(100vw-2rem)] max-w-lg sm:w-full" onOpenAutoFocus={(e) => e.preventDefault()}>
      <DialogHeader>
        <DialogTitle>{isEdit ? "Editer le label" : "Ajouter un label"}</DialogTitle>
        <DialogDescription>
          {isEdit ? "Modifie le nom et la couleur du label." : "Ajoute un nouveau label dans Mealie."}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="label-name">Nom</Label>
          <Input
            id="label-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ex: Fruits et legumes"
            disabled={loading}
          />
        </div>

        <div className="space-y-1.5">
          <Label>Couleur</Label>
          <ColorPickerField
            value={color}
            onChange={setColor}
            disabled={loading}
            onRandomize={() => setColor(randomHexColor())}
          />
        </div>
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
          ) : isEdit ? (
            "Enregistrer"
          ) : (
            "Ajouter"
          )}
        </Button>
      </div>
    </DialogContent>
  )
}
