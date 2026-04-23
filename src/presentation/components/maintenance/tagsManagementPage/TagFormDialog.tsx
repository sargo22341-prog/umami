import { useMemo, useState } from "react"
import { Loader2, Trash2 } from "lucide-react"
import { 
  Dialog, Label, Input, Button, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "components/ui"
import type { MealieRecipeOutput } from "@/shared/types/mealie/Recipes.ts"
import { recipeImageUrl, toggleValueInArray, toggleValuesInArray } from "@/shared/utils"

interface TagFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "create" | "edit"
  initialName?: string
  loading?: boolean
  associatedRecipes?: MealieRecipeOutput[]
  recipesLoading?: boolean
  recipesError?: string | null
  onRemoveTagFromRecipes?: (recipeSlugs: string[]) => Promise<void> | void
  onSubmit: (values: { name: string }) => Promise<void> | void
}

export function TagFormDialog({
  open,
  onOpenChange,
  mode,
  initialName = "",
  loading = false,
  associatedRecipes = [],
  recipesLoading = false,
  recipesError = null,
  onRemoveTagFromRecipes,
  onSubmit,
}: TagFormDialogProps) {
  const [name, setName] = useState(initialName)
  const [selectedRecipeSlugs, setSelectedRecipeSlugs] = useState<string[]>([])
  const isEdit = mode === "edit"

  const selectableRecipes = useMemo(
    () => associatedRecipes.filter((recipe): recipe is MealieRecipeOutput => Boolean(recipe.slug)),
    [associatedRecipes],
  )
  const allSelected =
    selectableRecipes.length > 0 &&
    selectableRecipes.every((recipe) => selectedRecipeSlugs.includes(recipe.slug))

  const handleSubmit = async () => {
    if (!name.trim()) return
    await onSubmit({ name })
  }

  const toggleRecipeSelection = (slug: string) => {
    setSelectedRecipeSlugs((prev) => toggleValueInArray(prev, slug))
  }

  const toggleAllRecipes = () => {
    const slugs = selectableRecipes.map((recipe) => recipe.slug)
    setSelectedRecipeSlugs((prev) => toggleValuesInArray(prev, slugs))
  }

  const handleRemoveSelectedRecipes = async () => {
    if (!onRemoveTagFromRecipes || selectedRecipeSlugs.length === 0) return
    await onRemoveTagFromRecipes(selectedRecipeSlugs)
    setSelectedRecipeSlugs([])
  }

  const handleRemoveSingleRecipe = async (slug: string) => {
    if (!onRemoveTagFromRecipes) return
    await onRemoveTagFromRecipes([slug])
    setSelectedRecipeSlugs((prev) => prev.filter((entry) => entry !== slug))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-3xl sm:w-full" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editer le tag" : "Ajouter un tag"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Modifie simplement le nom du tag."
              : "Ajoute un nouveau tag dans Mealie."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="tag-name">Nom</Label>
            <Input
              id="tag-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ex: Rapide, Vegan, Comfort food..."
              disabled={loading}
            />
          </div>

          {isEdit && (
            <div className="space-y-3 rounded-[var(--radius-xl)] border border-border/50 bg-secondary/15 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold">Recettes associees</p>
                  <p className="text-xs text-muted-foreground">
                    Retire ce tag d&apos;une ou plusieurs recettes directement ici.
                  </p>
                </div>
                {selectedRecipeSlugs.length > 0 && onRemoveTagFromRecipes && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => void handleRemoveSelectedRecipes()}
                    disabled={loading}
                  >
                    <Trash2 className="h-4 w-4" />
                    Retirer ({selectedRecipeSlugs.length})
                  </Button>
                )}
              </div>

              {recipesLoading ? (
                <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Chargement des recettes...
                </div>
              ) : recipesError ? (
                <div className="rounded-[var(--radius-lg)] border border-destructive/20 bg-destructive/8 px-3 py-2 text-sm text-destructive">
                  {recipesError}
                </div>
              ) : associatedRecipes.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune recette n&apos;utilise actuellement ce tag.</p>
              ) : (
                <div className="space-y-2">
                  <label className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-border/40 bg-card/60 px-3 py-2 text-sm">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleAllRecipes}
                      className="h-4 w-4 rounded border-border text-primary focus:ring-ring"
                    />
                    <span>Selectionner les recettes visibles</span>
                  </label>

                  <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                    {selectableRecipes.map((recipe) => (
                      <div
                        key={recipe.id}
                        className="grid grid-cols-[auto_56px_minmax(0,1fr)_auto] items-center gap-3 rounded-[var(--radius-lg)] border border-border/40 bg-card px-3 py-2"
                      >
                        <input
                          type="checkbox"
                          checked={selectedRecipeSlugs.includes(recipe.slug)}
                          onChange={() => toggleRecipeSelection(recipe.slug)}
                          className="h-4 w-4 rounded border-border text-primary focus:ring-ring"
                        />
                        <img
                          src={recipeImageUrl(recipe, "min-original")}
                          alt={recipe.name ?? "Recette"}
                          className="h-14 w-14 rounded-[var(--radius-md)] object-cover"
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">{recipe.name ?? "Recette sans nom"}</p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => void handleRemoveSingleRecipe(recipe.slug)}
                          disabled={loading}
                          className="text-destructive hover:bg-destructive/8 hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
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
            ) : (
              isEdit ? "Enregistrer" : "Ajouter"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
