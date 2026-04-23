import { useState, type ReactNode } from "react"
import { AlertTriangle, CheckSquare, ChevronDown, Loader2, RefreshCw } from "lucide-react"
import {
  Button, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "components/ui"
import { cn } from "@/lib/utils.ts"

export interface RecipeSyncFieldPreview {
  id: string
  label: string
  changed: boolean
  currentValue: string[]
  incomingValue: string[]
  currentRichValue?: ReactNode[]
  incomingRichValue?: ReactNode[]
}

interface RecipeSyncDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  recipeName: string
  sourceUrl: string
  loading: boolean
  applying: boolean
  error: string | null
  fields: RecipeSyncFieldPreview[]
  selectedFieldIds: string[]
  onToggleField: (fieldId: string) => void
  onRefresh: () => void
  onConfirm: () => void
  cancelLabel?: string
  onCancel?: () => void
  confirmLabel?: string
}

function FieldPreview({
  field,
  selected,
  disabled,
  onToggle,
}: {
  field: RecipeSyncFieldPreview
  selected: boolean
  disabled: boolean
  onToggle: () => void
}) {
  return (
    <label className="block rounded-[var(--radius-xl)] border border-border/50 bg-card p-4">
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggle}
          disabled={disabled}
          className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-ring"
        />
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-foreground">{field.label}</p>
            {field.changed ? (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-primary">
                Modifié
              </span>
            ) : (
              <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
                Identique
              </span>
            )}
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1.5 rounded-[var(--radius-lg)] border border-border/40 bg-secondary/15 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                Actuel
              </p>
              <div className="space-y-1 text-sm text-foreground/85">
                {(field.currentRichValue ?? field.currentValue).map((line, index) => (
                  <p key={`${field.id}-current-${index}`} className="whitespace-pre-wrap break-words">
                    {line}
                  </p>
                ))}
              </div>
            </div>

            <div className="space-y-1.5 rounded-[var(--radius-lg)] border border-primary/20 bg-primary/5 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-primary/80">
                Source
              </p>
              <div className="space-y-1 text-sm text-foreground/85">
                {(field.incomingRichValue ?? field.incomingValue).map((line, index) => (
                  <p key={`${field.id}-incoming-${index}`} className="whitespace-pre-wrap break-words">
                    {line}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </label>
  )
}

export function RecipeSyncDialog({
  open,
  onOpenChange,
  recipeName,
  sourceUrl,
  loading,
  applying,
  error,
  fields,
  selectedFieldIds,
  onToggleField,
  onRefresh,
  onConfirm,
  cancelLabel = "Fermer",
  onCancel,
  confirmLabel = "Valider",
}: RecipeSyncDialogProps) {
  const [showUnchanged, setShowUnchanged] = useState(false)
  const changedFields = fields.filter((field) => field.changed)
  const unchangedFields = fields.filter((field) => !field.changed)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100vh-2rem)] w-[calc(100vw-2rem)] max-w-4xl overflow-hidden sm:w-full overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Synchroniser la recette</DialogTitle>
          <DialogDescription>
            Compare la recette actuelle avec la source Mealie, puis applique uniquement les champs cochés.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto pr-1">
          <div className="rounded-[var(--radius-xl)] border border-amber-300/50 bg-amber-50/70 p-4 text-sm text-amber-900 dark:border-amber-700/40 dark:bg-amber-950/20 dark:text-amber-200">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <div className="space-y-1">
                <p className="font-medium">{recipeName}</p>
                <p className="break-all text-xs">{sourceUrl}</p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 rounded-[var(--radius-xl)] border border-border/50 bg-secondary/20 px-4 py-10 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Analyse de la source en cours...
            </div>
          ) : error ? (
            <div className="space-y-3 rounded-[var(--radius-xl)] border border-destructive/20 bg-destructive/8 p-4 text-sm text-destructive">
              <p>{error}</p>
              <Button type="button" variant="outline" size="sm" onClick={onRefresh} className="gap-1.5">
                <RefreshCw className="h-4 w-4" />
                Relancer l'analyse
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-foreground">Champs modifiés</p>
                  <span className="text-xs text-muted-foreground">
                    {selectedFieldIds.length} champ{selectedFieldIds.length > 1 ? "s" : ""} sélectionné{selectedFieldIds.length > 1 ? "s" : ""}
                  </span>
                </div>

                {changedFields.length === 0 ? (
                  <div className="rounded-[var(--radius-xl)] border border-border/50 bg-secondary/20 px-4 py-6 text-sm text-muted-foreground">
                    Aucun changement détecté entre la recette actuelle et la source.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {changedFields.map((field) => (
                      <FieldPreview
                        key={field.id}
                        field={field}
                        selected={selectedFieldIds.includes(field.id)}
                        disabled={applying}
                        onToggle={() => onToggleField(field.id)}
                      />
                    ))}
                  </div>
                )}
              </div>

              {unchangedFields.length > 0 && (
                <div className="space-y-3 rounded-[var(--radius-xl)] border border-border/50 bg-secondary/10 p-4">
                  <button
                    type="button"
                    onClick={() => setShowUnchanged((prev) => !prev)}
                    className="flex w-full items-center justify-between gap-3 text-left"
                  >
                    <div className="flex items-center gap-2">
                      <CheckSquare className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm font-semibold text-foreground">Champs inchangés</p>
                    </div>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 text-muted-foreground transition-transform",
                        showUnchanged && "rotate-180",
                      )}
                    />
                  </button>

                  {showUnchanged && (
                    <div className="space-y-3">
                      {unchangedFields.map((field) => (
                        <FieldPreview
                          key={field.id}
                          field={field}
                          selected={selectedFieldIds.includes(field.id)}
                          disabled={applying}
                          onToggle={() => onToggleField(field.id)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (onCancel) {
                onCancel()
                return
              }
              onOpenChange(false)
            }}
            disabled={applying}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={loading || applying || selectedFieldIds.length === 0}
            className="gap-1.5"
          >
            {applying ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Synchronisation...
              </>
            ) : (
              confirmLabel
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
