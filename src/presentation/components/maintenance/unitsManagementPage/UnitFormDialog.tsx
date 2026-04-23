import { useMemo, useState } from "react"
import { ChevronDown, ChevronRight, Loader2, Plus, Trash2 } from "lucide-react"
import { 
  Button, Input, Label, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "components/ui"
import type { MealieIngredientUnitAlias } from "@/shared/types/mealie/Units.ts"
import { cn } from "@/lib/utils.ts"
import { MEALIE_STANDARD_UNIT_OPTIONS } from "./unitStandardOptions.ts"

interface UnitFormDialogValues {
  name: string
  pluralName?: string | null
  description?: string
  abbreviation?: string
  pluralAbbreviation?: string | null
  useAbbreviation: boolean
  fraction: boolean
  aliases?: MealieIngredientUnitAlias[]
  standardQuantity?: number | null
  standardUnit?: string | null
}

interface UnitFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "create" | "edit"
  initialValues?: {
    name?: string
    pluralName?: string | null
    description?: string
    abbreviation?: string | null
    pluralAbbreviation?: string | null
    useAbbreviation?: boolean
    fraction?: boolean
    aliases?: MealieIngredientUnitAlias[]
    standardQuantity?: number | null
    standardUnit?: string | null
  }
  loading?: boolean
  onSubmit: (values: UnitFormDialogValues) => Promise<void> | void
}

export function UnitFormDialog({
  open,
  onOpenChange,
  mode,
  initialValues,
  loading = false,
  onSubmit,
}: UnitFormDialogProps) {
  const isEdit = mode === "edit"
  const [name, setName] = useState(() => initialValues?.name ?? "")
  const [pluralName, setPluralName] = useState(() => initialValues?.pluralName ?? "")
  const [description, setDescription] = useState(() => initialValues?.description ?? "")
  const [abbreviation, setAbbreviation] = useState(() => initialValues?.abbreviation ?? "")
  const [pluralAbbreviation, setPluralAbbreviation] = useState(() => initialValues?.pluralAbbreviation ?? "")
  const [useAbbreviation, setUseAbbreviation] = useState(() => initialValues?.useAbbreviation ?? false)
  const [fraction, setFraction] = useState(() => initialValues?.fraction ?? true)
  const [standardQuantity, setStandardQuantity] = useState(() =>
    initialValues?.standardQuantity != null ? String(initialValues.standardQuantity) : "",
  )
  const [standardUnit, setStandardUnit] = useState(() => initialValues?.standardUnit ?? "")
  const [aliases, setAliases] = useState<string[]>(() => (initialValues?.aliases ?? []).map((alias) => alias.name))
  const [aliasesOpen, setAliasesOpen] = useState(false)
  const [editingAliasIndex, setEditingAliasIndex] = useState<number | null>(null)
  const [aliasDraft, setAliasDraft] = useState("")
  const [aliasError, setAliasError] = useState<string | null>(null)

  const normalizedReservedNames = useMemo(() => {
    return [name, pluralName, abbreviation, pluralAbbreviation]
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean)
  }, [abbreviation, name, pluralAbbreviation, pluralName])

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

    for (const reservedName of [trimmedName, pluralName.trim(), abbreviation.trim(), pluralAbbreviation.trim()]) {
      const normalizedReserved = reservedName.trim().toLowerCase()
      if (normalizedReserved) normalizedSeen.add(normalizedReserved)
    }

    for (const alias of nextAliases) {
      const normalizedAlias = alias.toLowerCase()
      if (normalizedSeen.has(normalizedAlias)) {
        setAliasError("Les aliases doivent etre uniques et differents des noms principaux.")
        setAliasesOpen(true)
        return
      }
      normalizedSeen.add(normalizedAlias)
    }

    await onSubmit({
      name: trimmedName,
      pluralName: pluralName.trim() || null,
      description: description.trim(),
      abbreviation: abbreviation.trim(),
      pluralAbbreviation: pluralAbbreviation.trim() || null,
      useAbbreviation,
      fraction,
      aliases: nextAliases.map((alias) => ({ name: alias })),
      standardQuantity: standardQuantity.trim() ? Number(standardQuantity) : null,
      standardUnit: standardUnit.trim() || null,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-xl sm:w-full" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editer l'unite" : "Ajouter une unite"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Modifie les informations de cette unite." : "Ajoute une nouvelle unite dans Mealie."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="unit-name">Nom</Label>
              <Input id="unit-name" value={name} onChange={(e) => setName(e.target.value)} disabled={loading} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="unit-plural-name">Nom pluriel</Label>
              <Input
                id="unit-plural-name"
                value={pluralName}
                onChange={(e) => setPluralName(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="unit-abbreviation">Abreviation</Label>
              <Input
                id="unit-abbreviation"
                value={abbreviation}
                onChange={(e) => setAbbreviation(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="unit-plural-abbreviation">Abreviation plurielle</Label>
              <Input
                id="unit-plural-abbreviation"
                value={pluralAbbreviation}
                onChange={(e) => setPluralAbbreviation(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="unit-description">Description</Label>
            <Input
              id="unit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
              placeholder="Description optionnelle"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex items-center gap-3 rounded-[var(--radius-xl)] border border-border/50 bg-secondary/20 px-4 py-3 text-sm">
              <input
                type="checkbox"
                checked={useAbbreviation}
                onChange={(event) => setUseAbbreviation(event.target.checked)}
                disabled={loading}
                className="h-4 w-4 rounded border-border text-primary focus:ring-ring"
              />
              <span>Utiliser l'abreviation</span>
            </label>
            <label className="flex items-center gap-3 rounded-[var(--radius-xl)] border border-border/50 bg-secondary/20 px-4 py-3 text-sm">
              <input
                type="checkbox"
                checked={fraction}
                onChange={(event) => setFraction(event.target.checked)}
                disabled={loading}
                className="h-4 w-4 rounded border-border text-primary focus:ring-ring"
              />
              <span>Fraction</span>
            </label>
          </div>

          <section className="rounded-[var(--radius-xl)] border border-border/50 bg-secondary/15">
            <button
              type="button"
              onClick={() => setAliasesOpen((prev) => !prev)}
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
            >
              <div>
                <p className="text-sm font-semibold">Alias</p>
                <p className="text-xs text-muted-foreground">
                  Gere les autres noms reconnus pour cette unite.
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

          <div className="rounded-[var(--radius-xl)] border border-border/50 bg-secondary/20 p-4">
            <div className="mb-4 space-y-1">
              <p className="text-sm font-medium text-foreground">Standardisation</p>
              <p className="text-sm text-muted-foreground">
                Indique comment cette unite se convertit vers une unite standard pour que Mealie puisse
                mieux rapprocher les unites compatibles, notamment dans les listes de courses.
              </p>
              <p className="text-xs text-muted-foreground">
                Exemple : 1 kilogramme = 1000 grammes. L'unite standard de "kilogramme" peut donc etre
                "gramme" avec une quantite standard de 1000.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="unit-standard-quantity">Quantite standard</Label>
                <Input
                  id="unit-standard-quantity"
                  type="number"
                  inputMode="decimal"
                  value={standardQuantity}
                  onChange={(e) => setStandardQuantity(e.target.value)}
                  disabled={loading}
                  placeholder="Ex: 1000"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="unit-standard-unit">Unite standard</Label>
                <select
                  id="unit-standard-unit"
                  value={standardUnit}
                  onChange={(event) => setStandardUnit(event.target.value)}
                  disabled={loading}
                  className="h-10 w-full rounded-[var(--radius-lg)] border border-input bg-background px-3 text-sm"
                >
                  <option value="">Aucune</option>
                  {MEALIE_STANDARD_UNIT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
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
