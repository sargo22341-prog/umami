import { useMemo, useState } from "react"
import { ArrowDown, ArrowLeft, ArrowUp, Dices, Loader2, Pencil, Plus, Search, Tags, Trash2 } from "lucide-react"
import { Link } from "react-router-dom"

// components ui
import { Button, Input } from "components/ui"

// components
import { DeleteToolDialog } from "components/maintenance/common"
import { LabelFormDialog } from "components/maintenance/labelsManagementPage/LabelFormDialog.tsx"

// hooks
import { useLabelManagement } from "hooks/management/useLabelManagement.ts"

// types
import type { MealieLabel } from "@/shared/types/mealie/Labels.ts"

// utils
import { cn } from "@/lib/utils.ts"
import { randomHexColor, toggleValueInArray, toggleValuesInArray } from "@/shared/utils"

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const
type LabelSortKey = "name"
type SortDirection = "asc" | "desc"

export function LabelsManagementPage() {
  const [search, setSearch] = useState("")
  const [perPage, setPerPage] = useState<number>(10)
  const [createOpen, setCreateOpen] = useState(false)
  const [createColor, setCreateColor] = useState(() => randomHexColor())
  const [editingLabel, setEditingLabel] = useState<MealieLabel | null>(null)
  const [deletingLabel, setDeletingLabel] = useState<MealieLabel | null>(null)
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([])
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [sortKey] = useState<LabelSortKey>("name")
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")

  const {
    labels,
    allLabels,
    total,
    page,
    totalPages,
    loading,
    saving,
    error,
    setPage,
    createLabel,
    updateLabel,
    deleteLabel,
    deleteLabels,
  } = useLabelManagement(search, perPage, sortKey, sortDirection)

  const rangeLabel = useMemo(() => {
    if (total === 0) return "0 label"
    const start = (page - 1) * perPage + 1
    const end = Math.min(page * perPage, total)
    return `${start}-${end} sur ${total}`
  }, [page, perPage, total])

  const allVisibleSelected = labels.length > 0 && labels.every((label) => selectedLabelIds.includes(label.id))

  const toggleLabelSelection = (labelId: string) => {
    setSelectedLabelIds((prev) => toggleValueInArray(prev, labelId))
  }

  const toggleVisibleSelection = () => {
    setSelectedLabelIds((prev) => {
      const visibleIds = labels.map((label) => label.id)
      return toggleValuesInArray(prev, visibleIds)
    })
  }

  const randomizeAllLabels = async () => {
    for (const label of allLabels) {
      await updateLabel(label, label.name, randomHexColor())
    }
  }

  const toggleSort = () => {
    setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"))
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <LabelFormDialog
        key={`create-${createOpen ? "open" : "closed"}`}
        open={createOpen}
        onOpenChange={setCreateOpen}
        mode="create"
        initialColor={createColor}
        loading={saving}
        onSubmit={async ({ name, color }) => {
          await createLabel(name, color)
          setCreateOpen(false)
        }}
      />

      <LabelFormDialog
        key={editingLabel ? `${editingLabel.id}-${editingLabel.name}` : "edit-closed"}
        open={editingLabel !== null}
        onOpenChange={(open) => !open && setEditingLabel(null)}
        mode="edit"
        initialName={editingLabel?.name ?? ""}
        initialColor={editingLabel?.color ?? "#959595"}
        loading={saving}
        onSubmit={async ({ name, color }) => {
          if (!editingLabel) return
          await updateLabel(editingLabel, name, color)
          setEditingLabel(null)
        }}
      />

      <DeleteToolDialog
        open={deletingLabel !== null}
        onOpenChange={(open) => !open && setDeletingLabel(null)}
        title="Supprimer le label"
        description={
          deletingLabel
            ? `Confirme la suppression de "${deletingLabel.name}".`
            : "Confirme la suppression de ce label."
        }
        loading={saving}
        onConfirm={async () => {
          if (!deletingLabel) return
          await deleteLabel(deletingLabel.id)
          setSelectedLabelIds((prev) => prev.filter((id) => id !== deletingLabel.id))
          setDeletingLabel(null)
        }}
      />

      <DeleteToolDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        title="Supprimer les labels"
        description={`Confirme la suppression de ${selectedLabelIds.length} label${selectedLabelIds.length > 1 ? "s" : ""} selectionne${selectedLabelIds.length > 1 ? "s" : ""}.`}
        confirmLabel="Supprimer la selection"
        loading={saving}
        onConfirm={async () => {
          await deleteLabels(selectedLabelIds)
          setSelectedLabelIds([])
          setBulkDeleteOpen(false)
        }}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <Tags className="h-5 w-5 text-primary" />
            <h1 className="font-heading text-2xl font-bold">Gestion des labels</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Ajoute, modifie ou supprime les labels disponibles dans Mealie.
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
              placeholder="Rechercher un label..."
              className="pl-9"
            />
          </div>

          <Button type="button" onClick={() => { setCreateColor(randomHexColor()); setCreateOpen(true) }} className="gap-2">
            <Plus className="h-4 w-4" />
            Ajouter un label
          </Button>
        </div>

        <div className="mt-3 flex justify-end">
          <Button type="button" variant="outline" onClick={() => void randomizeAllLabels()} disabled={saving || allLabels.length === 0} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Dices className="h-4 w-4" />}
            Couleurs aléatoires pour tous les labels
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

          {selectedLabelIds.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="destructive" size="sm" onClick={() => setBulkDeleteOpen(true)}>
                <Trash2 className="h-4 w-4" />
                Supprimer ({selectedLabelIds.length})
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
                      aria-label="Selectionner les labels visibles"
                      className="h-4 w-4 rounded border-border text-primary focus:ring-ring"
                    />
                  </th>
                  <th className="px-4 py-3 font-medium">
                    <button
                      type="button"
                      onClick={toggleSort}
                      className="inline-flex items-center gap-1 text-left transition-colors hover:text-foreground"
                    >
                      <span>Nom</span>
                      {sortDirection === "desc" ? (
                        <ArrowDown className="h-3.5 w-3.5 text-foreground" />
                      ) : (
                        <ArrowUp className="h-3.5 w-3.5 text-foreground" />
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3 font-medium text-right">Editer</th>
                  <th className="px-4 py-3 font-medium text-right">Supprimer</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-10">
                      <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Chargement des labels...
                      </div>
                    </td>
                  </tr>
                ) : labels.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                      Aucun label trouve.
                    </td>
                  </tr>
                ) : (
                  labels.map((label) => (
                    <tr key={label.id} className="border-t border-border/40">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedLabelIds.includes(label.id)}
                          onChange={() => toggleLabelSelection(label.id)}
                          aria-label={`Selectionner ${label.name}`}
                          className="h-4 w-4 rounded border-border text-primary focus:ring-ring"
                        />
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground">
                        <div className="flex items-center gap-2">
                          <span className="h-3 w-3 rounded-full border border-border/50" style={{ backgroundColor: label.color }} />
                          <span>{label.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button type="button" variant="outline" size="sm" onClick={() => setEditingLabel(label)}>
                          <Pencil className="h-4 w-4" />
                          <span className="hidden sm:inline">Editer</span>
                        </Button>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeletingLabel(label)}
                          className={cn("text-destructive hover:bg-destructive/8 hover:text-destructive")}
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
