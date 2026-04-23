import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { ArrowDown, ArrowLeft, ArrowUp, Check, CookingPot, Loader2, Pencil, Plus, Search, Trash2, Wrench, X } from "lucide-react"

// hooks
import { useToolManagement } from "hooks/management/useToolManagement.ts"

// components ui
import { Button, Input } from "components/ui"

// components
import { ToolFormDialog } from "components/maintenance/toolsManagementPage/ToolFormDialog.tsx"
import { DeleteToolDialog } from "components/maintenance/common"

// types
import type { MealieRecipeTool } from "@/shared/types/mealie/Tools.ts"
import { cn } from "@/lib/utils.ts"
import { toggleValueInArray, toggleValuesInArray } from "@/shared/utils"

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const
type ToolSortKey = "name" | "available"
type SortDirection = "asc" | "desc"

export function ToolsManagementPage() {
  const [search, setSearch] = useState("")
  const [perPage, setPerPage] = useState<number>(10)
  const [createOpen, setCreateOpen] = useState(false)
  const [editingTool, setEditingTool] = useState<MealieRecipeTool | null>(null)
  const [deletingTool, setDeletingTool] = useState<MealieRecipeTool | null>(null)
  const [selectedToolIds, setSelectedToolIds] = useState<string[]>([])
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [sortKey, setSortKey] = useState<ToolSortKey>("name")
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")

  const {
    tools, total, page, totalPages, householdSlug, loading, saving, error,
    setPage, createTool, updateTool, deleteTool, deleteTools,
  } = useToolManagement(search, perPage, sortKey, sortDirection)

  const rangeLabel = useMemo(() => {
    if (total === 0) return "0 ustensile"
    const start = (page - 1) * perPage + 1
    const end = Math.min(page * perPage, total)
    return `${start}-${end} sur ${total}`
  }, [page, perPage, total])

  const allVisibleSelected = tools.length > 0 && tools.every((tool) => selectedToolIds.includes(tool.id))

  const toggleToolSelection = (toolId: string) => {
    setSelectedToolIds((prev) => toggleValueInArray(prev, toolId))
  }

  const toggleVisibleSelection = () => {
    setSelectedToolIds((prev) => {
      const visibleIds = tools.map((tool) => tool.id)
      return toggleValuesInArray(prev, visibleIds)
    })
  }

  const toggleSort = (nextKey: ToolSortKey) => {
    if (sortKey === nextKey) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"))
      return
    }

    setSortKey(nextKey)
    setSortDirection("asc")
  }

  const renderSortHeader = (label: string, key: ToolSortKey) => {
    const active = sortKey === key
    const Icon = active && sortDirection === "desc" ? ArrowDown : ArrowUp

    return (
      <button
        type="button"
        onClick={() => toggleSort(key)}
        className="inline-flex items-center gap-1 text-left transition-colors hover:text-foreground"
      >
        <span>{label}</span>
        <Icon className={cn("h-3.5 w-3.5", active ? "text-foreground" : "text-muted-foreground/40")} />
      </button>
    )
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <ToolFormDialog
        key={`create-${createOpen ? "open" : "closed"}`}
        open={createOpen}
        onOpenChange={setCreateOpen}
        mode="create"
        initialAvailable
        loading={saving}
        onSubmit={async ({ name, available }) => {
          await createTool(name, available)
          setCreateOpen(false)
        }}
      />

      <ToolFormDialog
        key={editingTool ? `${editingTool.id}-${editingTool.name}-${(editingTool.householdsWithTool ?? []).join(",")}` : "edit-closed"}
        open={editingTool !== null}
        onOpenChange={(open) => !open && setEditingTool(null)}
        mode="edit"
        initialName={editingTool?.name ?? ""}
        initialAvailable={
          editingTool && householdSlug
            ? (editingTool.householdsWithTool ?? []).includes(householdSlug)
            : false
        }
        loading={saving}
        onSubmit={async ({ name, available }) => {
          if (!editingTool) return
          await updateTool(editingTool, name, available)
          setEditingTool(null)
        }}
      />

      <DeleteToolDialog
        open={deletingTool !== null}
        onOpenChange={(open) => !open && setDeletingTool(null)}
        toolName={deletingTool?.name}
        loading={saving}
        onConfirm={async () => {
          if (!deletingTool) return
          await deleteTool(deletingTool.id)
          setSelectedToolIds((prev) => prev.filter((id) => id !== deletingTool.id))
          setDeletingTool(null)
        }}
      />

      <DeleteToolDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        title="Supprimer les ustensiles"
        description={`Confirme la suppression de ${selectedToolIds.length} ustensile${selectedToolIds.length > 1 ? "s" : ""} selectionne${selectedToolIds.length > 1 ? "s" : ""}.`}
        confirmLabel="Supprimer la selection"
        loading={saving}
        onConfirm={async () => {
          await deleteTools(selectedToolIds)
          setSelectedToolIds([])
          setBulkDeleteOpen(false)
        }}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <CookingPot className="h-5 w-5 text-primary" />
            <h1 className="font-heading text-2xl font-bold">Gestion des ustensiles</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Ajoute, modifie ou supprime les ustensiles disponibles dans Mealie.
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
              placeholder="Rechercher un ustensile..."
              className="pl-9"
            />
          </div>

          <Button type="button" onClick={() => setCreateOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Ajouter un ustensile
          </Button>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-muted-foreground">{rangeLabel}</div>
          <div className="flex flex-wrap items-center gap-2">
            {selectedToolIds.length > 0 && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => setBulkDeleteOpen(true)}
              >
                <Trash2 className="h-4 w-4" />
                Supprimer ({selectedToolIds.length})
              </Button>
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
                      aria-label="Selectionner les ustensiles visibles"
                      className="h-4 w-4 rounded border-border text-primary focus:ring-ring"
                    />
                  </th>
                  <th className="px-4 py-3 font-medium">{renderSortHeader("Nom", "name")}</th>
                  <th className="px-4 py-3 font-medium">
                    {renderSortHeader("Disponible", "available")}
                  </th>
                  <th className="px-4 py-3 font-medium text-right">Editer</th>
                  <th className="px-4 py-3 font-medium text-right">
                    <span className="hidden sm:inline">Supprimer</span>
                    <span className="sm:hidden">Supp.</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10">
                      <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Chargement des ustensiles...
                      </div>
                    </td>
                  </tr>
                ) : tools.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10">
                      <div className="flex flex-col items-center justify-center gap-2 text-center text-muted-foreground">
                        <Wrench className="h-5 w-5" />
                        <span>Aucun ustensile trouve.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  tools.map((tool) => {
                    const available = householdSlug
                      ? (tool.householdsWithTool ?? []).includes(householdSlug)
                      : false

                    return (
                      <tr key={tool.id} className="border-t border-border/40">
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedToolIds.includes(tool.id)}
                            onChange={() => toggleToolSelection(tool.id)}
                            aria-label={`Selectionner ${tool.name}`}
                            className="h-4 w-4 rounded border-border text-primary focus:ring-ring"
                          />
                        </td>
                        <td className="px-4 py-3 font-medium text-foreground">{tool.name}</td>
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
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingTool(tool)}
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
                            onClick={() => setDeletingTool(tool)}
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

        <div className="mt-4 flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => void setPage(page - 1)}
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
            onClick={() => void setPage(page + 1)}
            disabled={loading || totalPages === 0 || page >= totalPages}
          >
            Suivant
          </Button>
        </div>
      </section>
    </div>
  )
}
