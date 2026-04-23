import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { ArrowDown, ArrowLeft, ArrowUp, FolderOpen, GitMerge, Loader2, Pencil, Plus, Search, Trash2, Tags } from "lucide-react"

// components ui
import { Button, Input } from "components/ui"

// hooks
import { useCategoryManagement } from "hooks/management/useCategoryManagement.ts"

// components
import { DeleteToolDialog, MergeItemsDialog } from "components/maintenance/common"
import { CategoryFormDialog } from "components/maintenance/categoriesManagementPage/CategoryFormDialog.tsx"

// types
import type { MealieRecipeCategory } from "@/shared/types/mealie/Category.ts"
import type { MealieRecipeOutput } from "@/shared/types/mealie/Recipes.ts"
import { toggleValueInArray, toggleValuesInArray } from "@/shared/utils"

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const
type CategorySortKey = "name"
type SortDirection = "asc" | "desc"

export function CategoriesManagementPage() {
  const [search, setSearch] = useState("")
  const [perPage, setPerPage] = useState<number>(10)
  const [createOpen, setCreateOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<MealieRecipeCategory | null>(null)
  const [editingCategoryRecipes, setEditingCategoryRecipes] = useState<MealieRecipeOutput[]>([])
  const [loadingCategoryDetails, setLoadingCategoryDetails] = useState(false)
  const [categoryDetailsError, setCategoryDetailsError] = useState<string | null>(null)
  const [deletingCategory, setDeletingCategory] = useState<MealieRecipeCategory | null>(null)
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([])
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [mergeOpen, setMergeOpen] = useState(false)
  const [sortKey] = useState<CategorySortKey>("name")
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")

  const { allCategories, categories, total, page, totalPages, loading, saving, error,
    setPage, createCategory, updateCategory, deleteCategory, deleteCategories, getCategoryRecipes, mergeSelectedCategories,
  } = useCategoryManagement(search, perPage, sortKey, sortDirection)

  const rangeLabel = useMemo(() => {
    if (total === 0) return "0 categorie"
    const start = (page - 1) * perPage + 1
    const end = Math.min(page * perPage, total)
    return `${start}-${end} sur ${total}`
  }, [page, perPage, total])

  const allVisibleSelected =
    categories.length > 0 && categories.every((category) => selectedCategoryIds.includes(category.id))
  const selectedCategories = useMemo(
    () => allCategories.filter((category) => selectedCategoryIds.includes(category.id)),
    [allCategories, selectedCategoryIds],
  )

  const toggleCategorySelection = (categoryId: string) => {
    setSelectedCategoryIds((prev) => toggleValueInArray(prev, categoryId))
  }

  const toggleVisibleSelection = () => {
    setSelectedCategoryIds((prev) => {
      const visibleIds = categories.map((category) => category.id)
      return toggleValuesInArray(prev, visibleIds)
    })
  }

  const toggleSort = () => {
    setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"))
  }

  const resetEditingState = () => {
    setEditingCategory(null)
    setEditingCategoryRecipes([])
    setCategoryDetailsError(null)
  }

  const handleEditCategory = async (category: MealieRecipeCategory) => {
    setEditingCategory(category)
    setEditingCategoryRecipes([])
    setCategoryDetailsError(null)
    setLoadingCategoryDetails(true)
    try {
      const recipes = await getCategoryRecipes(category.slug)
      setEditingCategoryRecipes(recipes)
    } catch (err) {
      setCategoryDetailsError(err instanceof Error ? err.message : "Impossible de charger les recettes liees a cette categorie.")
    } finally {
      setLoadingCategoryDetails(false)
    }
  }

  const paginationControls = (
    <div className="flex items-center justify-between gap-3">
      <Button
        type="button"
        variant="outline"
        onClick={() => setPage(page - 1)}
        disabled={loading || page <= 1}
      >
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
  )

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <CategoryFormDialog
        key={`create-${createOpen ? "open" : "closed"}`}
        open={createOpen}
        onOpenChange={setCreateOpen}
        mode="create"
        loading={saving}
        onSubmit={async ({ name }) => {
          await createCategory(name)
          setCreateOpen(false)
        }}
      />

      <CategoryFormDialog
        key={editingCategory ? `${editingCategory.id}-${editingCategory.name}` : "edit-closed"}
        open={editingCategory !== null}
        onOpenChange={(open) => {
          if (!open) {
            resetEditingState()
          }
        }}
        mode="edit"
        initialName={editingCategory?.name ?? ""}
        loading={saving}
        associatedRecipes={editingCategoryRecipes}
        recipesLoading={loadingCategoryDetails}
        recipesError={categoryDetailsError}
        onSubmit={async ({ name }) => {
          if (!editingCategory) return
          await updateCategory(editingCategory, name)
          resetEditingState()
        }}
      />

      <MergeItemsDialog
        open={mergeOpen}
        onOpenChange={setMergeOpen}
        title="Fusionner les categories"
        description="Choisis la categorie qui doit rester. Les recettes des autres categories seront rattachees a celle-ci, puis les categories non selectionnees seront supprimees."
        items={selectedCategories.map((category) => ({ id: category.id, name: category.name }))}
        loading={saving}
        onConfirm={async (winnerId) => {
          await mergeSelectedCategories(selectedCategoryIds, winnerId)
          setSelectedCategoryIds([])
          setMergeOpen(false)
        }}
      />

      <DeleteToolDialog
        open={deletingCategory !== null}
        onOpenChange={(open) => !open && setDeletingCategory(null)}
        title="Supprimer la categorie"
        description={
          deletingCategory
            ? `Confirme la suppression de "${deletingCategory.name}".`
            : "Confirme la suppression de cette categorie."
        }
        loading={saving}
        onConfirm={async () => {
          if (!deletingCategory) return
          await deleteCategory(deletingCategory.id)
          setSelectedCategoryIds((prev) => prev.filter((id) => id !== deletingCategory.id))
          setDeletingCategory(null)
        }}
      />

      <DeleteToolDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        title="Supprimer les categories"
        description={`Confirme la suppression de ${selectedCategoryIds.length} categorie${selectedCategoryIds.length > 1 ? "s" : ""} selectionne${selectedCategoryIds.length > 1 ? "s" : ""}.`}
        confirmLabel="Supprimer la selection"
        loading={saving}
        onConfirm={async () => {
          await deleteCategories(selectedCategoryIds)
          setSelectedCategoryIds([])
          setBulkDeleteOpen(false)
        }}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-primary" />
            <h1 className="font-heading text-2xl font-bold">Gestion des categories</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Ajoute, modifie ou supprime les categories disponibles dans Mealie.
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
              placeholder="Rechercher une categorie..."
              className="pl-9"
            />
          </div>

          <Button type="button" onClick={() => setCreateOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Ajouter une categorie
          </Button>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-muted-foreground">{rangeLabel}</div>
          <div className="flex flex-wrap items-center gap-2">
            {selectedCategoryIds.length > 0 && (
              <>
                {selectedCategoryIds.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setMergeOpen(true)}
                  >
                    <GitMerge className="h-4 w-4" />
                    Fusionner
                  </Button>
                )}
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => setBulkDeleteOpen(true)}
                >
                  <Trash2 className="h-4 w-4" />
                  Supprimer ({selectedCategoryIds.length})
                </Button>
              </>
            )}
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Afficher</span>
              <select
                value={perPage}
                onChange={(event) => setPerPage(Number(event.target.value))}
                className="h-9 rounded-[var(--radius-lg)] border border-input bg-card px-3 text-sm text-foreground shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)] focus:outline-none focus:ring-2 focus:ring-ring/30"              >
                {PAGE_SIZE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="mt-3">
          {paginationControls}
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
                      aria-label="Selectionner les categories visibles"
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
                        Chargement des categories...
                      </div>
                    </td>
                  </tr>
                ) : categories.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-10">
                      <div className="flex flex-col items-center justify-center gap-2 text-center text-muted-foreground">
                        <Tags className="h-5 w-5" />
                        <span>Aucune categorie trouvee.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  categories.map((category) => (
                    <tr key={category.id} className="border-t border-border/40">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedCategoryIds.includes(category.id)}
                          onChange={() => toggleCategorySelection(category.id)}
                          aria-label={`Selectionner ${category.name}`}
                          className="h-4 w-4 rounded border-border text-primary focus:ring-ring"
                        />
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground">{category.name}</td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => void handleEditCategory(category)}
                        >
                          <Pencil className="h-4 w-4" />
                          <span className="hidden sm:inline">Editer</span>
                        </Button>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeletingCategory(category)}
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

        <div className="mt-4">
          {paginationControls}
        </div>
      </section>
    </div>
  )
}
