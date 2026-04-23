import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { ArrowDown, ArrowLeft, ArrowUp, GitMerge, Loader2, Pencil, Plus, Search, Sparkles, Tag, Tags, Trash2 } from "lucide-react"

// components ui
import { Button, Input } from "components/ui"

// hooks
import { useTagManagement } from "hooks/management/useTagManagement.ts"

// components
import { DeleteToolDialog } from "components/maintenance/common"
import { TagFormDialog, MergeTagsDialog, AutoCleanTagsDialog } from "components/maintenance/tagsManagementPage"

// types
import type { MealieRecipeOutput } from "@/shared/types/mealie/Recipes.ts"
import type { MealieRecipeTag } from "@/shared/types/mealie/Tags.ts"

// utils
import { buildTagMergeRecommendations, toggleValueInArray, toggleValuesInArray } from "@/shared/utils"

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const
type TagSortKey = "name"
type SortDirection = "asc" | "desc"

export function TagsManagementPage() {
  const [search, setSearch] = useState("")
  const [perPage, setPerPage] = useState<number>(10)
  const [createOpen, setCreateOpen] = useState(false)
  const [editingTag, setEditingTag] = useState<MealieRecipeTag | null>(null)
  const [editingTagRecipes, setEditingTagRecipes] = useState<MealieRecipeOutput[]>([])
  const [loadingTagDetails, setLoadingTagDetails] = useState(false)
  const [tagDetailsError, setTagDetailsError] = useState<string | null>(null)
  const [deletingTag, setDeletingTag] = useState<MealieRecipeTag | null>(null)
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [mergeOpen, setMergeOpen] = useState(false)
  const [autoCleanOpen, setAutoCleanOpen] = useState(false)
  const [sortKey] = useState<TagSortKey>("name")
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")

  const {
    tags,
    filteredTags,
    total,
    page,
    totalPages,
    loading,
    saving,
    error,
    setPage,
    createTag,
    updateTag,
    deleteTag,
    deleteTags,
    getTagRecipes,
    removeTagFromRecipes,
    mergeTags,
  } = useTagManagement(search, perPage, sortKey, sortDirection)

  const rangeLabel = useMemo(() => {
    if (total === 0) return "0 tag"
    const start = (page - 1) * perPage + 1
    const end = Math.min(page * perPage, total)
    return `${start}-${end} sur ${total}`
  }, [page, perPage, total])

  const allVisibleSelected = tags.length > 0 && tags.every((tag) => selectedTagIds.includes(tag.id))
  const selectedTags = useMemo(
    () => filteredTags.filter((tag) => selectedTagIds.includes(tag.id)),
    [filteredTags, selectedTagIds],
  )
  const autoCleanRecommendations = useMemo(
    () => buildTagMergeRecommendations(filteredTags),
    [filteredTags],
  )

  const toggleTagSelection = (tagId: string) => {
    setSelectedTagIds((prev) => toggleValueInArray(prev, tagId))
  }

  const toggleVisibleSelection = () => {
    setSelectedTagIds((prev) => {
      const visibleIds = tags.map((tag) => tag.id)
      return toggleValuesInArray(prev, visibleIds)
    })
  }

  const handleEditTag = async (tag: MealieRecipeTag) => {
    setEditingTag(tag)
    setEditingTagRecipes([])
    setTagDetailsError(null)
    setLoadingTagDetails(true)
    try {
      const recipes = await getTagRecipes(tag.slug)
      setEditingTagRecipes(recipes)
    } catch (err) {
      setTagDetailsError(err instanceof Error ? err.message : "Impossible de charger les recettes liees a ce tag.")
    } finally {
      setLoadingTagDetails(false)
    }
  }

  const toggleSort = () => {
    setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"))
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <TagFormDialog
        key={`create-${createOpen ? "open" : "closed"}`}
        open={createOpen}
        onOpenChange={setCreateOpen}
        mode="create"
        loading={saving}
        onSubmit={async ({ name }) => {
          await createTag(name)
          setCreateOpen(false)
        }}
      />

      <TagFormDialog
        key={editingTag ? `${editingTag.id}-${editingTag.name}` : "edit-closed"}
        open={editingTag !== null}
        onOpenChange={(open) => {
          if (!open) {
            setEditingTag(null)
            setEditingTagRecipes([])
            setTagDetailsError(null)
          }
        }}
        mode="edit"
        initialName={editingTag?.name ?? ""}
        loading={saving}
        associatedRecipes={editingTagRecipes}
        recipesLoading={loadingTagDetails}
        recipesError={tagDetailsError}
        onRemoveTagFromRecipes={async (recipeSlugs) => {
          if (!editingTag) return
          await removeTagFromRecipes(editingTag, recipeSlugs)
          const nextRecipes = editingTagRecipes.filter(
            (recipe) => !recipeSlugs.includes(recipe.slug),
          )
          setEditingTagRecipes(nextRecipes)
        }}
        onSubmit={async ({ name }) => {
          if (!editingTag) return
          await updateTag(editingTag, name)
          setEditingTag(null)
        }}
      />

      <DeleteToolDialog
        open={deletingTag !== null}
        onOpenChange={(open) => !open && setDeletingTag(null)}
        title="Supprimer le tag"
        description={
          deletingTag
            ? `Confirme la suppression de "${deletingTag.name}".`
            : "Confirme la suppression de ce tag."
        }
        loading={saving}
        onConfirm={async () => {
          if (!deletingTag) return
          await deleteTag(deletingTag.id)
          setSelectedTagIds((prev) => prev.filter((id) => id !== deletingTag.id))
          setDeletingTag(null)
        }}
      />

      <DeleteToolDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        title="Supprimer les tags"
        description={`Confirme la suppression de ${selectedTagIds.length} tag${selectedTagIds.length > 1 ? "s" : ""} selectionne${selectedTagIds.length > 1 ? "s" : ""}.`}
        confirmLabel="Supprimer la selection"
        loading={saving}
        onConfirm={async () => {
          await deleteTags(selectedTagIds)
          setSelectedTagIds([])
          setBulkDeleteOpen(false)
        }}
      />

      <MergeTagsDialog
        open={mergeOpen}
        onOpenChange={setMergeOpen}
        tags={selectedTags}
        loading={saving}
        onConfirm={async (winnerTagId) => {
          await mergeTags(selectedTags, winnerTagId)
          setSelectedTagIds([])
          setMergeOpen(false)
        }}
      />

      <AutoCleanTagsDialog
        open={autoCleanOpen}
        onOpenChange={setAutoCleanOpen}
        recommendations={autoCleanRecommendations}
        loading={saving}
        onConfirm={async (selections) => {
          for (const selection of selections) {
            const group = autoCleanRecommendations.find((entry) => entry.key === selection.key)
            if (!group) continue
            await mergeTags(group.tags, selection.winnerTagId)
          }
          setSelectedTagIds([])
          setAutoCleanOpen(false)
        }}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <Tag className="h-5 w-5 text-primary" />
            <h1 className="font-heading text-2xl font-bold">Gestion des tags</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Ajoute, modifie ou supprime les tags disponibles dans Mealie.
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
              placeholder="Rechercher un tag..."
              className="pl-9"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" onClick={() => setAutoCleanOpen(true)} className="gap-2">
              <Sparkles className="h-4 w-4" />
              Auto clean
            </Button>
            <Button type="button" onClick={() => setCreateOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Ajouter un tag
            </Button>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-muted-foreground">{rangeLabel}</div>
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

          {selectedTagIds.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedTagIds.length > 1 && (
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
                Supprimer ({selectedTagIds.length})
              </Button>
            </div>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between gap-3">
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
                      aria-label="Selectionner les tags visibles"
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
                        Chargement des tags...
                      </div>
                    </td>
                  </tr>
                ) : tags.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-10">
                      <div className="flex flex-col items-center justify-center gap-2 text-center text-muted-foreground">
                        <Tags className="h-5 w-5" />
                        <span>Aucun tag trouve.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  tags.map((tag) => (
                    <tr key={tag.id} className="border-t border-border/40">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedTagIds.includes(tag.id)}
                          onChange={() => toggleTagSelection(tag.id)}
                          aria-label={`Selectionner ${tag.name}`}
                          className="h-4 w-4 rounded border-border text-primary focus:ring-ring"
                        />
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground">{tag.name}</td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => void handleEditTag(tag)}
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
                          onClick={() => setDeletingTag(tag)}
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

        <div className="mt-4 flex items-center justify-between gap-3">
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
      </section>
    </div>
  )
}
