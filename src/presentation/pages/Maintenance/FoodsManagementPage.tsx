import { useMemo, useState } from "react"
import { ArrowDown, ArrowLeft, ArrowUp, Check, GitMerge, Loader2, Pencil, Plus, Search, Tag, Trash2, UtensilsCrossed, X } from "lucide-react"
import { Link } from "react-router-dom"

// components ui
import {
  Input, Button,
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle
} from "components/ui"

// components
import { FoodFormDialog } from "components/maintenance/foodsManagementPage/FoodFormDialog.tsx"
import { DeleteToolDialog, MergeItemsDialog } from "components/maintenance/common"

// hooks
import { useFoodManagement } from "hooks/management/useFoodManagement.ts"

// types
import type { MealieIngredientFoodOutput } from "@/shared/types/mealie/food.ts"

// utils
import { cn } from "@/lib/utils.ts"
import { toggleValueInArray, toggleValuesInArray } from "@/shared/utils"

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const

type FoodSortKey = "name" | "pluralName" | "description" | "label" | "available"
type SortDirection = "asc" | "desc"

export function FoodsManagementPage() {
  const [search, setSearch] = useState("")
  const [perPage, setPerPage] = useState<number>(10)
  const [createOpen, setCreateOpen] = useState(false)
  const [editingFood, setEditingFood] = useState<MealieIngredientFoodOutput | null>(null)
  const [deletingFood, setDeletingFood] = useState<MealieIngredientFoodOutput | null>(null)
  const [selectedFoodIds, setSelectedFoodIds] = useState<string[]>([])
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [mergeOpen, setMergeOpen] = useState(false)
  const [bulkLabelOpen, setBulkLabelOpen] = useState(false)
  const [bulkLabelId, setBulkLabelId] = useState("")
  const [sortKey, setSortKey] = useState<FoodSortKey>("name")
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")

  const { foods, allFoods, labels, householdSlug, total, page, totalPages, loading, saving, error,
    setPage, createFood, updateFood, deleteFood, deleteFoods, mergeSelectedFoods, assignLabelToFoods,
  } = useFoodManagement(search, perPage, sortKey, sortDirection)

  const rangeLabel = useMemo(() => {
    if (total === 0) return "0 aliment"
    const start = (page - 1) * perPage + 1
    const end = Math.min(page * perPage, total)
    return `${start}-${end} sur ${total}`
  }, [page, perPage, total])

  const allVisibleSelected = foods.length > 0 && foods.every((food) => selectedFoodIds.includes(food.id))
  const selectedFoods = useMemo(
    () => allFoods.filter((food) => selectedFoodIds.includes(food.id)),
    [allFoods, selectedFoodIds],
  )

  const toggleSort = (nextKey: FoodSortKey) => {
    if (sortKey === nextKey) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"))
      return
    }

    setSortKey(nextKey)
    setSortDirection("asc")
  }

  const renderSortHeader = (label: string, key: FoodSortKey) => {
    const active = sortKey === key
    const Icon = active && sortDirection === "desc" ? ArrowDown : ArrowUp

    return (
      <button
        type="button"
        onClick={() => toggleSort(key)}
        className="inline-flex items-center gap-1 text-left transition-colors hover:text-foreground"
      >
        <span>{label}</span>
        <Icon
          className={cn(
            "h-3.5 w-3.5",
            active ? "text-foreground" : "text-muted-foreground/40",
          )}
        />
      </button>
    )
  }

  const toggleFoodSelection = (foodId: string) => {
    setSelectedFoodIds((prev) => toggleValueInArray(prev, foodId))
  }

  const toggleVisibleSelection = () => {
    setSelectedFoodIds((prev) => {
      const visibleIds = foods.map((food) => food.id)
      return toggleValuesInArray(prev, visibleIds)
    })
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <FoodFormDialog
        key={`create-${createOpen ? "open" : "closed"}`}
        open={createOpen}
        onOpenChange={setCreateOpen}
        mode="create"
        labels={labels}
        initialValues={{ available: false }}
        loading={saving}
        onSubmit={async (values) => {
          await createFood(values)
          setCreateOpen(false)
        }}
      />

      <FoodFormDialog
        key={editingFood ? `${editingFood.id}-${editingFood.name}-${editingFood.aliases?.length ?? 0}` : "edit-closed"}
        open={editingFood !== null}
        onOpenChange={(open) => !open && setEditingFood(null)}
        mode="edit"
        labels={labels}
        initialValues={
          editingFood
            ? {
              ...editingFood,
              available: householdSlug ? (editingFood.householdsWithIngredientFood ?? []).includes(householdSlug) : false,
            }
            : undefined
        }
        loading={saving}
        onSubmit={async (values) => {
          if (!editingFood) return
          await updateFood(editingFood, values)
          setEditingFood(null)
        }}
      />

      <DeleteToolDialog
        open={deletingFood !== null}
        onOpenChange={(open) => !open && setDeletingFood(null)}
        title="Supprimer l'aliment"
        description={deletingFood ? `Confirme la suppression de "${deletingFood.name}".` : "Confirme la suppression de cet aliment."}
        loading={saving}
        onConfirm={async () => {
          if (!deletingFood) return
          await deleteFood(deletingFood.id)
          setSelectedFoodIds((prev) => prev.filter((id) => id !== deletingFood.id))
          setDeletingFood(null)
        }}
      />

      <DeleteToolDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        title="Supprimer les aliments"
        description={`Confirme la suppression de ${selectedFoodIds.length} aliment${selectedFoodIds.length > 1 ? "s" : ""} selectionne${selectedFoodIds.length > 1 ? "s" : ""}.`}
        confirmLabel="Supprimer la selection"
        loading={saving}
        onConfirm={async () => {
          await deleteFoods(selectedFoodIds)
          setSelectedFoodIds([])
          setBulkDeleteOpen(false)
        }}
      />

      <MergeItemsDialog
        open={mergeOpen}
        onOpenChange={setMergeOpen}
        title="Fusionner les aliments"
        description="L'aliment source sera supprime et toutes ses references seront transferees vers l'aliment cible conserve."
        items={selectedFoods.map((food) => ({ id: food.id, name: food.name }))}
        loading={saving}
        onConfirm={async (winnerId) => {
          await mergeSelectedFoods(selectedFoods, winnerId)
          setSelectedFoodIds([])
          setMergeOpen(false)
        }}
      />

      <Dialog open={bulkLabelOpen} onOpenChange={setBulkLabelOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-md sm:w-full">
          <DialogHeader>
            <DialogTitle>Assigner un label</DialogTitle>
            <DialogDescription>
              Choisis le label a appliquer aux aliments selectionnes.
            </DialogDescription>
          </DialogHeader>

          <select
            value={bulkLabelId}
            onChange={(event) => setBulkLabelId(event.target.value)}
            className="h-10 w-full rounded-[var(--radius-lg)] border border-input bg-background px-3 text-sm"
          >
            <option value="">Aucun label</option>
            {labels.map((label) => (
              <option key={label.id} value={label.id}>
                {label.name}
              </option>
            ))}
          </select>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setBulkLabelOpen(false)} disabled={saving}>
              Annuler
            </Button>
            <Button
              type="button"
              onClick={async () => {
                await assignLabelToFoods(selectedFoodIds, bulkLabelId || null)
                setBulkLabelOpen(false)
                setSelectedFoodIds([])
              }}
              disabled={saving}
              className="gap-2"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Tag className="h-4 w-4" />}
              Appliquer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <UtensilsCrossed className="h-5 w-5 text-primary" />
            <h1 className="font-heading text-2xl font-bold">Gestion des aliments</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Ajoute, modifie, fusionne ou supprime les aliments disponibles dans Mealie.
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
              placeholder="Rechercher un aliment..."
              className="pl-9"
            />
          </div>

          <Button type="button" onClick={() => setCreateOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Ajouter un aliment
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

          {selectedFoodIds.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setBulkLabelOpen(true)}>
                <Tag className="h-4 w-4" />
                Assigner un label
              </Button>
              {selectedFoodIds.length > 1 && (
                <Button type="button" variant="outline" size="sm" onClick={() => setMergeOpen(true)}>
                  <GitMerge className="h-4 w-4" />
                  Fusionner
                </Button>
              )}
              <Button type="button" variant="destructive" size="sm" onClick={() => setBulkDeleteOpen(true)}>
                <Trash2 className="h-4 w-4" />
                Supprimer ({selectedFoodIds.length})
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
                      aria-label="Selectionner les aliments visibles"
                      className="h-4 w-4 rounded border-border text-primary focus:ring-ring"
                    />
                  </th>
                  <th className="px-4 py-3 font-medium">{renderSortHeader("Nom", "name")}</th>
                  <th className="px-4 py-3 font-medium">{renderSortHeader("Nom pluriel", "pluralName")}</th>
                  <th className="px-4 py-3 font-medium">{renderSortHeader("Description", "description")}</th>
                  <th className="px-4 py-3 font-medium">{renderSortHeader("Label", "label")}</th>
                  <th className="px-4 py-3 font-medium">{renderSortHeader("Disponible", "available")}</th>
                  <th className="px-4 py-3 font-medium text-right">Editer</th>
                  <th className="px-4 py-3 font-medium text-right">Supprimer</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10">
                      <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Chargement des aliments...
                      </div>
                    </td>
                  </tr>
                ) : foods.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">
                      Aucun aliment trouve.
                    </td>
                  </tr>
                ) : (
                  foods.map((food) => {
                    const available = householdSlug ? (food.householdsWithIngredientFood ?? []).includes(householdSlug) : false
                    return (
                      <tr key={food.id} className="border-t border-border/40">
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedFoodIds.includes(food.id)}
                            onChange={() => toggleFoodSelection(food.id)}
                            aria-label={`Selectionner ${food.name}`}
                            className="h-4 w-4 rounded border-border text-primary focus:ring-ring"
                          />
                        </td>
                        <td className="px-4 py-3 font-medium text-foreground">{food.name}</td>
                        <td className="px-4 py-3">{food.pluralName || "-"}</td>
                        <td className="max-w-[280px] px-4 py-3 truncate">{food.description || "-"}</td>
                        <td className="px-4 py-3">{food.label?.name || "-"}</td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
                              available
                                ? "bg-[rgba(34,197,94,0.12)] text-[rgba(22,163,74,1)]"
                                : "bg-secondary text-muted-foreground",
                            )}
                          >
                            {available ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button type="button" variant="outline" size="sm" onClick={() => setEditingFood(food)}>
                            <Pencil className="h-4 w-4" />
                            <span className="hidden sm:inline">Editer</span>
                          </Button>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeletingFood(food)}
                            className="text-destructive hover:bg-destructive/8 hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="hidden sm:inline">Supprimer</span>
                          </Button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  )
}
