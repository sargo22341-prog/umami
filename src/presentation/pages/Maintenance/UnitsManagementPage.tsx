import { useMemo, useState } from "react"
import { ArrowDown, ArrowLeft, ArrowUp, GitMerge, Loader2, Pencil, Plus, Ruler, Search, Trash2 } from "lucide-react"
import { Link } from "react-router-dom"

// Components Ui
import { Button, Input } from "components/ui"

// Components
import { DeleteToolDialog, MergeItemsDialog } from "components/maintenance/common"
import { UnitFormDialog, getMealieStandardUnitLabel } from "components/maintenance/unitsManagementPage"

// hooks
import { useUnitManagement } from "hooks/management/useUnitManagement.ts"

// types
import type { MealieIngredientUnitOutput } from "@/shared/types/mealie/Units.ts"
import { toggleValueInArray, toggleValuesInArray } from "@/shared/utils"

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const
type UnitSortKey =
  | "name"
  | "pluralName"
  | "aliases"
  | "abbreviation"
  | "pluralAbbreviation"
  | "description"
  | "useAbbreviation"
  | "fraction"
  | "standardQuantity"
  | "standardUnit"
type SortDirection = "asc" | "desc"

export function UnitsManagementPage() {
  const [search, setSearch] = useState("")
  const [perPage, setPerPage] = useState<number>(10)
  const [createOpen, setCreateOpen] = useState(false)
  const [editingUnit, setEditingUnit] = useState<MealieIngredientUnitOutput | null>(null)
  const [deletingUnit, setDeletingUnit] = useState<MealieIngredientUnitOutput | null>(null)
  const [selectedUnitIds, setSelectedUnitIds] = useState<string[]>([])
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [mergeOpen, setMergeOpen] = useState(false)
  const [sortKey, setSortKey] = useState<UnitSortKey>("name")
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")

  const {
    units, filteredUnits, total, page, totalPages, loading, saving, error,
    setPage, createUnit, updateUnit, deleteUnit, deleteUnits, mergeSelectedUnits,
  } = useUnitManagement(search, perPage, sortKey, sortDirection)

  const rangeLabel = useMemo(() => {
    if (total === 0) return "0 unite"
    const start = (page - 1) * perPage + 1
    const end = Math.min(page * perPage, total)
    return `${start}-${end} sur ${total}`
  }, [page, perPage, total])

  const allVisibleSelected = units.length > 0 && units.every((unit) => selectedUnitIds.includes(unit.id))
  const selectedUnits = useMemo(
    () => filteredUnits.filter((unit) => selectedUnitIds.includes(unit.id)),
    [filteredUnits, selectedUnitIds],
  )

  const toggleUnitSelection = (unitId: string) => {
    setSelectedUnitIds((prev) => toggleValueInArray(prev, unitId))
  }

  const toggleVisibleSelection = () => {
    setSelectedUnitIds((prev) => {
      const visibleIds = units.map((unit) => unit.id)
      return toggleValuesInArray(prev, visibleIds)
    })
  }

  const toggleSort = (nextKey: UnitSortKey) => {
    if (sortKey === nextKey) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"))
      return
    }

    setSortKey(nextKey)
    setSortDirection("asc")
  }

  const renderSortHeader = (label: string, key: UnitSortKey) => {
    const active = sortKey === key
    const Icon = active && sortDirection === "desc" ? ArrowDown : ArrowUp

    return (
      <button
        type="button"
        onClick={() => toggleSort(key)}
        className="inline-flex items-center gap-1 text-left transition-colors hover:text-foreground"
      >
        <span>{label}</span>
        <Icon className={`h-3.5 w-3.5 ${active ? "text-foreground" : "text-muted-foreground/40"}`} />
      </button>
    )
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <UnitFormDialog
        key={`create-${createOpen ? "open" : "closed"}`}
        open={createOpen}
        onOpenChange={setCreateOpen}
        mode="create"
        loading={saving}
        onSubmit={async (values) => {
          await createUnit(values)
          setCreateOpen(false)
        }}
      />

      <UnitFormDialog
        key={editingUnit ? `${editingUnit.id}-${editingUnit.name}` : "edit-closed"}
        open={editingUnit !== null}
        onOpenChange={(open) => !open && setEditingUnit(null)}
        mode="edit"
        initialValues={editingUnit ?? undefined}
        loading={saving}
        onSubmit={async (values) => {
          if (!editingUnit) return
          await updateUnit(editingUnit, values)
          setEditingUnit(null)
        }}
      />

      <DeleteToolDialog
        open={deletingUnit !== null}
        onOpenChange={(open) => !open && setDeletingUnit(null)}
        title="Supprimer l'unite"
        description={deletingUnit ? `Confirme la suppression de "${deletingUnit.name}".` : "Confirme la suppression de cette unite."}
        loading={saving}
        onConfirm={async () => {
          if (!deletingUnit) return
          await deleteUnit(deletingUnit.id)
          setSelectedUnitIds((prev) => prev.filter((id) => id !== deletingUnit.id))
          setDeletingUnit(null)
        }}
      />

      <DeleteToolDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        title="Supprimer les unites"
        description={`Confirme la suppression de ${selectedUnitIds.length} unite${selectedUnitIds.length > 1 ? "s" : ""} selectionne${selectedUnitIds.length > 1 ? "s" : ""}.`}
        confirmLabel="Supprimer la selection"
        loading={saving}
        onConfirm={async () => {
          await deleteUnits(selectedUnitIds)
          setSelectedUnitIds([])
          setBulkDeleteOpen(false)
        }}
      />

      <MergeItemsDialog
        open={mergeOpen}
        onOpenChange={setMergeOpen}
        title="Fusionner les unites"
        description="Choisis l'unite a conserver. Les autres seront fusionnees dans celle-ci."
        items={selectedUnits.map((unit) => ({ id: unit.id, name: unit.name }))}
        loading={saving}
        onConfirm={async (winnerId) => {
          await mergeSelectedUnits(selectedUnits, winnerId)
          setSelectedUnitIds([])
          setMergeOpen(false)
        }}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <Ruler className="h-5 w-5 text-primary" />
            <h1 className="font-heading text-2xl font-bold">Gestion des unites</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Ajoute, modifie, fusionne ou supprime les unites disponibles dans Mealie.
          </p>
        </div>

        <Button asChild variant="outline" className="gap-2 self-start">
          <Link to="/settings">
            <ArrowLeft className="h-4 w-4" />
            Retour aux parametres
          </Link>
        </Button>
      </div>

      <section className="rounded-[var(--radius-2xl)] border border-border/50 bg-card p-4 shadow-subtle">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher une unite..."
              className="pl-9"
            />
          </div>

          <Button type="button" onClick={() => setCreateOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Ajouter une unite
          </Button>
        </div>

        <div className="mt-4 flex flex-col gap-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-muted-foreground">{rangeLabel}</div>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Afficher</span>
              <select
                value={perPage}
                onChange={(event) => setPerPage(Number(event.target.value))}
                className="h-9 rounded-[var(--radius-lg)] border border-input bg-card px-3 text-sm text-foreground"
              >
                {PAGE_SIZE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {selectedUnitIds.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedUnitIds.length > 1 && (
                <Button type="button" variant="outline" size="sm" onClick={() => setMergeOpen(true)}>
                  <GitMerge className="h-4 w-4" />
                  Fusionner
                </Button>
              )}
              <Button type="button" variant="destructive" size="sm" onClick={() => setBulkDeleteOpen(true)}>
                <Trash2 className="h-4 w-4" />
                Supprimer ({selectedUnitIds.length})
              </Button>
            </div>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between gap-3">
          <Button type="button" variant="outline" onClick={() => setPage(page - 1)} disabled={loading || page <= 1}>
            Precedent
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {Math.max(page, 1)}{totalPages > 0 ? ` / ${totalPages}` : ""}
          </span>
          <Button
            type="button"
            variant="outline"
            onClick={() => setPage(page + 1)}
            disabled={loading || totalPages === 0 || page >= totalPages}
          >
            Suivant
          </Button>
        </div>

        {error && (
          <div className="mt-4 rounded-[var(--radius-xl)] border border-destructive/20 bg-destructive/8 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="mt-4 overflow-hidden rounded-[var(--radius-xl)] border border-border/50">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead className="bg-secondary/35 text-left text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={toggleVisibleSelection}
                      aria-label="Selectionner les unites visibles"
                      className="h-4 w-4 rounded border-border text-primary focus:ring-ring"
                    />
                  </th>
                  <th className="px-4 py-3 font-medium">{renderSortHeader("Nom", "name")}</th>
                  <th className="px-4 py-3 font-medium">{renderSortHeader("Nom pluriel", "pluralName")}</th>
                  <th className="px-4 py-3 font-medium">{renderSortHeader("Aliases", "aliases")}</th>
                  <th className="px-4 py-3 font-medium">{renderSortHeader("Abreviation", "abbreviation")}</th>
                  <th className="px-4 py-3 font-medium">{renderSortHeader("Abreviation plurielle", "pluralAbbreviation")}</th>
                  <th className="px-4 py-3 font-medium">{renderSortHeader("Description", "description")}</th>
                  <th className="px-4 py-3 font-medium">{renderSortHeader("Utiliser abreviation", "useAbbreviation")}</th>
                  <th className="px-4 py-3 font-medium">{renderSortHeader("Fraction", "fraction")}</th>
                  <th className="px-4 py-3 font-medium">{renderSortHeader("Quantite standard", "standardQuantity")}</th>
                  <th className="px-4 py-3 font-medium">{renderSortHeader("Unite standard", "standardUnit")}</th>
                  <th className="px-4 py-3 font-medium text-right">Editer</th>
                  <th className="px-4 py-3 font-medium text-right">Supprimer</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={13} className="px-4 py-10">
                      <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Chargement des unites...
                      </div>
                    </td>
                  </tr>
                ) : units.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="px-4 py-10 text-center text-muted-foreground">
                      Aucune unite trouvee.
                    </td>
                  </tr>
                ) : (
                  units.map((unit) => (
                    <tr key={unit.id} className="border-t border-border/40">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedUnitIds.includes(unit.id)}
                          onChange={() => toggleUnitSelection(unit.id)}
                          aria-label={`Selectionner ${unit.name}`}
                          className="h-4 w-4 rounded border-border text-primary focus:ring-ring"
                        />
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground">{unit.name}</td>
                      <td className="px-4 py-3">{unit.pluralName || "-"}</td>
                      <td className="max-w-[240px] px-4 py-3">
                        {unit.aliases && unit.aliases.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {unit.aliases.map((alias) => (
                              <span
                                key={`${unit.id}-${alias.name}`}
                                className="inline-flex rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-foreground"
                              >
                                {alias.name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="px-4 py-3">{unit.abbreviation || "-"}</td>
                      <td className="px-4 py-3">{unit.pluralAbbreviation || "-"}</td>
                      <td className="max-w-[260px] px-4 py-3 truncate">{unit.description || "-"}</td>
                      <td className="px-4 py-3">{unit.useAbbreviation ? "Oui" : "Non"}</td>
                      <td className="px-4 py-3">{unit.fraction ? "Oui" : "Non"}</td>
                      <td className="px-4 py-3">{unit.standardQuantity ?? "-"}</td>
                      <td className="px-4 py-3">{getMealieStandardUnitLabel(unit.standardUnit)}</td>
                      <td className="px-4 py-3 text-right">
                        <Button type="button" variant="outline" size="sm" onClick={() => setEditingUnit(unit)}>
                          <Pencil className="h-4 w-4" />
                          <span className="hidden sm:inline">Editer</span>
                        </Button>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeletingUnit(unit)}
                          className="text-destructive hover:bg-destructive/8 hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="hidden sm:inline">Supprimer</span>
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  )
}
