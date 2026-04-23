import { useMemo, useState } from "react"
import { ChevronDown, ChevronRight, Loader2, Plus, Trash2 } from "lucide-react"

import { 
  Button, Input, Label, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "components/ui"
import type { MealieLabel } from "@/shared/types/mealie/Labels.ts"
import type { MealieIngredientFoodAlias } from "@/shared/types/mealie/food.ts"
import { cn } from "@/lib/utils.ts"

interface FoodFormDialogValues {
  name: string
  pluralName?: string | null
  description?: string | null
  labelId?: string | null
  aliases?: MealieIngredientFoodAlias[]
  available: boolean
}

interface FoodFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "create" | "edit"
  labels: MealieLabel[]
  initialValues?: {
    name?: string
    pluralName?: string | null
    description?: string | null
    labelId?: string | null
    aliases?: MealieIngredientFoodAlias[]
    available?: boolean
  }
  loading?: boolean
  onSubmit: (values: FoodFormDialogValues) => Promise<void> | void
}

export function FoodFormDialog({
  open,
  onOpenChange,
  mode,
  labels,
  initialValues,
  loading = false,
  onSubmit,
}: FoodFormDialogProps) {
  const isEdit = mode === "edit"

  const [name, setName] = useState(() => initialValues?.name ?? "")
  const [pluralName, setPluralName] = useState(() => initialValues?.pluralName ?? "")
  const [description, setDescription] = useState(() => initialValues?.description ?? "")
  const [labelId, setLabelId] = useState(() => initialValues?.labelId ?? "")
  const [available, setAvailable] = useState(() => initialValues?.available ?? false)
  const [aliases, setAliases] = useState<string[]>(() => (initialValues?.aliases ?? []).map((alias) => alias.name))
  const [aliasesOpen, setAliasesOpen] = useState(false)
  const [editingAliasIndex, setEditingAliasIndex] = useState<number | null>(null)
  const [aliasDraft, setAliasDraft] = useState("")
  const [aliasError, setAliasError] = useState<string | null>(null)

  const normalizedReservedNames = useMemo(() => {
    return [name, pluralName]
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean)
  }, [name, pluralName])

  const commitAlias = (index: number) => {
    const trimmedAlias = aliasDraft.trim().replace(/\s+/g, " ")
    if (!trimmedAlias) {
      setAliasError("Un alias vide n'est pas autorise.")
      return false
    }

    const normalizedAlias = trimmedAlias.toLowerCase()
    const hasDuplicate = aliases.some((alias, aliasIndex) => (
      aliasIndex !== index && alias.trim().toLowerCase() === normalizedAlias
    ))

    if (hasDuplicate || normalizedReservedNames.includes(normalizedAlias)) {
      setAliasError("Cet alias existe deja.")
      return false
    }

    setAliases((prev) => prev.map((alias, aliasIndex) => (aliasIndex === index ? trimmedAlias : alias)))
    setEditingAliasIndex(null)
    setAliasDraft("")
    setAliasError(null)
    return true
  }

  const startEditingAlias = (index: number) => {
    setEditingAliasIndex(index)
    setAliasDraft(aliases[index] ?? "")
    setAliasError(null)
  }

  const cancelEditingAlias = (index: number) => {
    const currentAlias = aliases[index] ?? ""
    if (!currentAlias.trim()) {
      setAliases((prev) => prev.filter((_, aliasIndex) => aliasIndex !== index))
    }
    setEditingAliasIndex(null)
    setAliasDraft("")
    setAliasError(null)
  }

  const handleAddAlias = () => {
    setAliasesOpen(true)
    setAliases((prev) => [...prev, ""])
    const nextIndex = aliases.length
    setEditingAliasIndex(nextIndex)
    setAliasDraft("")
    setAliasError(null)
  }

  const handleDeleteAlias = (index: number) => {
    setAliases((prev) => prev.filter((_, aliasIndex) => aliasIndex !== index))
    if (editingAliasIndex === index) {
      setEditingAliasIndex(null)
      setAliasDraft("")
      setAliasError(null)
    } else if (editingAliasIndex !== null && editingAliasIndex > index) {
      setEditingAliasIndex(editingAliasIndex - 1)
    }
  }

  const handleSubmit = async () => {
    const trimmedName = name.trim()
    if (!trimmedName) return
    if (editingAliasIndex !== null && !commitAlias(editingAliasIndex)) return

    const normalizedSeen = new Set<string>()
    const nextAliases = aliases
      .map((alias) => alias.trim().replace(/\s+/g, " "))
      .filter(Boolean)

    for (const reservedName of [trimmedName, pluralName.trim()]) {
      const normalizedReserved = reservedName.trim().toLowerCase()
      if (normalizedReserved) normalizedSeen.add(normalizedReserved)
    }

    for (const alias of nextAliases) {
      const normalizedAlias = alias.toLowerCase()
      if (normalizedSeen.has(normalizedAlias)) {
        setAliasError("Les aliases doivent etre uniques et differents du nom principal.")
        setAliasesOpen(true)
        return
      }
      normalizedSeen.add(normalizedAlias)
    }

    await onSubmit({
      name: trimmedName,
      pluralName: pluralName.trim() || null,
      description: description.trim(),
      labelId: labelId || null,
      aliases: nextAliases.map((alias) => ({ name: alias })),
      available,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-lg sm:w-full" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editer l'aliment" : "Ajouter un aliment"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Modifie les informations de cet aliment." : "Ajoute un nouvel aliment dans Mealie."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="food-name">Nom</Label>
            <Input id="food-name" value={name} onChange={(e) => setName(e.target.value)} disabled={loading} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="food-plural-name">Nom pluriel</Label>
            <Input
              id="food-plural-name"
              value={pluralName}
              onChange={(e) => setPluralName(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="food-label">Label</Label>
            <select
              id="food-label"
              value={labelId}
              onChange={(e) => setLabelId(e.target.value)}
              disabled={loading}
              className="h-10 w-full rounded-[var(--radius-lg)] border border-input bg-background px-3 text-sm"
            >
              <option value="">Aucun label</option>
              {labels.map((label) => (
                <option key={label.id} value={label.id}>
                  {label.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="food-description">Description</Label>
            <Input
              id="food-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
            />
          </div>

          <label className="flex items-center gap-3 rounded-[var(--radius-xl)] border border-border/50 bg-secondary/20 px-4 py-3 text-sm sm:col-span-2">
            <input
              type="checkbox"
              checked={available}
              onChange={(event) => setAvailable(event.target.checked)}
              disabled={loading}
              className="h-4 w-4 rounded border-border text-primary focus:ring-ring"
            />
            <span>Disponible dans mon foyer</span>
          </label>

          <div className="sm:col-span-2">
            <section className="rounded-[var(--radius-xl)] border border-border/50 bg-secondary/15">
              <button
                type="button"
                onClick={() => setAliasesOpen((prev) => !prev)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
              >
                <div>
                  <p className="text-sm font-semibold">Alias</p>
                  <p className="text-xs text-muted-foreground">
                    Gere les noms alternatifs utilises pour retrouver cet aliment.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {aliases.filter((alias) => alias.trim()).length}
                  </span>
                  {aliasesOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                </div>
              </button>

              {aliasesOpen && (
                <div className="space-y-3 border-t border-border/40 px-4 py-4">
                  <div className="flex justify-end">
                    <Button type="button" variant="outline" size="sm" onClick={handleAddAlias} disabled={loading}>
                      <Plus className="h-4 w-4" />
                      Ajouter un alias
                    </Button>
                  </div>

                  {aliases.length === 0 ? (
                    <div className="rounded-[var(--radius-lg)] border border-dashed border-border/60 bg-card/60 px-3 py-4 text-sm text-muted-foreground">
                      Aucun alias pour le moment.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {aliases.map((alias, index) => {
                        const isEditing = editingAliasIndex === index

                        return (
                          <div
                            key={`${index}-${isEditing ? "editing" : alias}`}
                            className="flex items-center gap-2 rounded-[var(--radius-lg)] border border-border/40 bg-card px-3 py-2"
                          >
                            <div className="min-w-0 flex-1">
                              {isEditing ? (
                                <Input
                                  value={aliasDraft}
                                  onChange={(event) => {
                                    setAliasDraft(event.target.value)
                                    if (aliasError) setAliasError(null)
                                  }}
                                  onBlur={() => {
                                    void commitAlias(index)
                                  }}
                                  onKeyDown={(event) => {
                                    if (event.key === "Enter") {
                                      event.preventDefault()
                                      commitAlias(index)
                                    }
                                    if (event.key === "Escape") {
                                      event.preventDefault()
                                      cancelEditingAlias(index)
                                    }
                                  }}
                                  placeholder="Nouvel alias"
                                  disabled={loading}
                                  autoFocus
                                />
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => startEditingAlias(index)}
                                  className={cn(
                                    "w-full truncate text-left text-sm text-foreground",
                                    "rounded-[var(--radius-md)] px-1 py-1 hover:bg-secondary/50",
                                  )}
                                  disabled={loading}
                                >
                                  {alias}
                                </button>
                              )}
                            </div>

                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteAlias(index)}
                              disabled={loading}
                              className="text-destructive hover:bg-destructive/8 hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {aliasError && (
                    <div className="rounded-[var(--radius-lg)] border border-destructive/20 bg-destructive/8 px-3 py-2 text-sm text-destructive">
                      {aliasError}
                    </div>
                  )}
                </div>
              )}
            </section>
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
    </Dialog>
  )
}
