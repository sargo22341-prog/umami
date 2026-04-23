import { useMemo, useState } from "react"
import { Loader2 } from "lucide-react"
import {
  Button, Input, Label, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "components/ui"
import type { MealieRecipeOutput } from "@/shared/types/mealie/Recipes.ts"
import { recipeImageUrl } from "@/shared/utils"

interface CategoryFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "create" | "edit"
  initialName?: string
  loading?: boolean
  associatedRecipes?: MealieRecipeOutput[]
  recipesLoading?: boolean
  recipesError?: string | null
  onSubmit: (values: { name: string }) => Promise<void> | void
}

export function CategoryFormDialog({
  open,
  onOpenChange,
  mode,
  initialName = "",
  loading = false,
  associatedRecipes = [],
  recipesLoading = false,
  recipesError = null,
  onSubmit,
}: CategoryFormDialogProps) {
  const [name, setName] = useState(initialName)
  const isEdit = mode === "edit"

  const selectableRecipes = useMemo(
    () => associatedRecipes.filter((recipe): recipe is MealieRecipeOutput => Boolean(recipe.slug)),
    [associatedRecipes],
  )

  const handleSubmit = async () => {
    if (!name.trim()) return
    await onSubmit({ name })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-3xl sm:w-full" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editer la categorie" : "Ajouter une categorie"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Modifie simplement le nom de la categorie."
              : "Ajoute une nouvelle categorie dans Mealie."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="category-name">Nom</Label>
            <Input
              id="category-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ex: Dessert, Plat principal..."
              disabled={loading}
            />
          </div>

          {isEdit && (
            <div className="space-y-3 rounded-[var(--radius-xl)] border border-border/50 bg-secondary/15 p-4">
              <div>
                <p className="text-sm font-semibold">Recettes associees</p>
                <p className="text-xs text-muted-foreground">
                  Verifie les recettes actuellement rattachees a cette categorie avant de la fusionner.
                </p>
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
              ) : selectableRecipes.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune recette n&apos;utilise actuellement cette categorie.</p>
              ) : (
                <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                  {selectableRecipes.map((recipe) => (
                    <div
                      key={recipe.id}
                      className="grid grid-cols-[56px_minmax(0,1fr)] items-center gap-3 rounded-[var(--radius-lg)] border border-border/40 bg-card px-3 py-2"
                    >
                      <img
                        src={recipeImageUrl(recipe, "min-original")}
                        alt={recipe.name ?? "Recette"}
                        className="h-14 w-14 rounded-[var(--radius-md)] object-cover"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{recipe.name ?? "Recette sans nom"}</p>
                      </div>
                    </div>
                  ))}
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
