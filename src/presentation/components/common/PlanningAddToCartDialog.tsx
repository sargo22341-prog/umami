import { useMemo, useState } from "react"
import { Loader2, Minus, Plus, ShoppingCart, Trash2 } from "lucide-react"
import { Button, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from "components/ui"
import { cn } from "@/lib/utils.ts"
import { recipeImageUrl, getRecipeServingsBase, scaleRecipeIngredientQuantity } from "@/shared/utils"
import type { MealieRecipeIngredientOutput, MealieRecipeOutput } from "@/shared/types/mealie/Recipes.ts"
import type { RecipeCartSelection } from "@/application/shopping/usecases/AddRecipesToListUseCase.ts"

export interface PlanningCartRecipe {
  recipe: MealieRecipeOutput
  occurrences: number
}

interface PlanningAddToCartDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  recipes: PlanningCartRecipe[]
  loadingRecipes: boolean
  submitting: boolean
  onSubmit: (selections: RecipeCartSelection[]) => Promise<boolean>
}

interface InitializedDialogState {
  portionByRecipeId: Record<string, number>
  expandedByRecipeId: Record<string, boolean>
  checkedByKey: Record<string, boolean>
  removedByRecipeId: Record<string, boolean>
}

function formatScaledQuantity(
  quantity: number | undefined,
  recipe: MealieRecipeOutput,
  portions: number,
): string {
  const scaled = scaleRecipeIngredientQuantity(quantity, recipe, portions)

  if (scaled == null) {
    return portions > 1 ? `x${portions}` : ""
  }

  if (Number.isInteger(scaled)) return String(scaled)
  return scaled.toFixed(2).replace(/\.?0+$/, "")
}

function formatPortionLabel(portions: number): string {
  return `${portions} portion${portions > 1 ? "s" : ""}`
}

function formatIngredientLabel(
  recipe: MealieRecipeOutput,
  ingredient: MealieRecipeIngredientOutput,
  portions: number,
): string {
  const quantityText = formatScaledQuantity(ingredient.quantity ?? undefined, recipe, portions)
  const unitText = ingredient.unit?.abbreviation ?? ingredient.unit?.name ?? ""
  const foodText = ingredient.food?.name ?? ""
  const noteText = ingredient.note?.trim() ?? ""
  const displayText = ingredient.display?.trim() ?? ""

  const primary = [quantityText, unitText, foodText].filter(Boolean).join(" ").trim()

  if (primary && noteText && noteText !== foodText) return `${primary} - ${noteText}`
  if (primary) return primary
  if (displayText) return portions > 1 ? `${displayText} x${portions}` : displayText
  if (noteText) return portions > 1 ? `${noteText} x${portions}` : noteText
  return portions > 1 ? `Ingredient x${portions}` : "Ingredient"
}

function getIngredientSelectionKey(recipe: MealieRecipeOutput, ingredient: MealieRecipeIngredientOutput, index: number): string {
  if (ingredient.food?.id) return `food:${ingredient.food.id}`

  return `recipe:${recipe.id}:${ingredient.referenceId ?? index}:${ingredient.food?.name ?? ingredient.note ?? ingredient.display ?? ""}`
}

function buildInitialState(recipes: PlanningCartRecipe[]): InitializedDialogState {
  const portionByRecipeId: Record<string, number> = {}
  const expandedByRecipeId: Record<string, boolean> = {}
  const checkedByKey: Record<string, boolean> = {}
  const removedByRecipeId: Record<string, boolean> = {}

  recipes.forEach((entry, index) => {
    portionByRecipeId[entry.recipe.id] = getRecipeServingsBase(entry.recipe)
    expandedByRecipeId[entry.recipe.id] = index === 0
    removedByRecipeId[entry.recipe.id] = false

    ;(entry.recipe.recipeIngredient ?? []).forEach((ingredient, ingredientIndex) => {
      checkedByKey[getIngredientSelectionKey(entry.recipe, ingredient, ingredientIndex)] = true
    })
  })

  return { portionByRecipeId, expandedByRecipeId, checkedByKey, removedByRecipeId }
}

function PlanningAddToCartDialogBody({
  recipes,
  loadingRecipes,
  submitting,
  onOpenChange,
  onSubmit,
}: Omit<PlanningAddToCartDialogProps, "open">) {
  const [state, setState] = useState<InitializedDialogState>(() => buildInitialState(recipes))
  const { portionByRecipeId, expandedByRecipeId, checkedByKey, removedByRecipeId } = state

  const recipeSummaries = useMemo(() => {
    return recipes
      .filter((entry) => removedByRecipeId[entry.recipe.id] !== true)
      .map((entry) => {
        const ingredients = entry.recipe.recipeIngredient ?? []
        const portions = portionByRecipeId[entry.recipe.id] ?? getRecipeServingsBase(entry.recipe)
        return {
          ...entry,
          ingredients,
          portions,
          expanded: expandedByRecipeId[entry.recipe.id] ?? false,
        }
      })
  }, [recipes, portionByRecipeId, expandedByRecipeId, removedByRecipeId])

  const hasSelectableIngredients = recipeSummaries.some((entry) => entry.ingredients.length > 0)

  const handleToggleIngredient = (recipe: MealieRecipeOutput, ingredient: MealieRecipeIngredientOutput, index: number) => {
    const key = getIngredientSelectionKey(recipe, ingredient, index)
    setState((prev) => ({
      ...prev,
      checkedByKey: {
        ...prev.checkedByKey,
        [key]: !(prev.checkedByKey[key] !== false),
      },
    }))
  }

  const handleChangePortions = (recipeId: string, delta: number) => {
    setState((prev) => ({
      ...prev,
      portionByRecipeId: {
        ...prev.portionByRecipeId,
        [recipeId]: Math.max(1, (prev.portionByRecipeId[recipeId] ?? 1) + delta),
      },
    }))
  }

  const handleToggleRecipe = (recipeId: string) => {
    setState((prev) => ({
      ...prev,
      expandedByRecipeId: {
        ...prev.expandedByRecipeId,
        [recipeId]: !(prev.expandedByRecipeId[recipeId] ?? false),
      },
    }))
  }

  const handleRemoveRecipe = (recipeId: string) => {
    setState((prev) => ({
      ...prev,
      removedByRecipeId: {
        ...prev.removedByRecipeId,
        [recipeId]: true,
      },
    }))
  }

  const handleSubmit = async () => {
    const selections: RecipeCartSelection[] = recipeSummaries
      .map((entry) => ({
        recipe: entry.recipe,
        portions: entry.portions,
        selectedIngredientIndexes: entry.ingredients
          .map((ingredient, index) => ({
            index,
            checked: checkedByKey[getIngredientSelectionKey(entry.recipe, ingredient, index)] !== false,
          }))
          .filter((item) => item.checked)
          .map((item) => item.index),
      }))
      .filter((entry) => entry.selectedIngredientIndexes.length > 0)

    const ok = await onSubmit(selections)
    if (ok) onOpenChange(false)
  }

  return (
    <DialogContent className="flex max-h-[90vh] w-[calc(100vw-1.5rem)] max-w-[calc(100vw-1.5rem)] flex-col sm:max-w-4xl">
      <DialogHeader>
        <DialogTitle>Ajouter mes recettes au panier</DialogTitle>
        <DialogDescription>
          Choisissez les portions et les ingredients a envoyer dans la liste de courses.
        </DialogDescription>
      </DialogHeader>

      <div className="flex-1 overflow-y-auto pr-1">
        {loadingRecipes ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : recipeSummaries.length === 0 ? (
          <div className="rounded-[var(--radius-xl)] border border-border/50 bg-secondary/20 p-6 text-sm text-muted-foreground">
            Aucune recette exploitable n&apos;a ete trouvee pour les jours selectionnes.
          </div>
        ) : (
          <div className="space-y-4 pr-3 pt-3">
            {recipeSummaries.map((entry) => (
              <section
                key={entry.recipe.id}
                className="relative overflow-visible rounded-[var(--radius-2xl)] border border-border/50 bg-card shadow-subtle"
              >
                <button
                  type="button"
                  onClick={() => handleRemoveRecipe(entry.recipe.id)}
                  className="absolute -right-2 -top-2 z-20 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border/60 bg-background shadow-[0_8px_24px_rgba(0,0,0,0.12)] text-muted-foreground transition-colors hover:border-destructive hover:bg-destructive hover:text-destructive-foreground"
                  aria-label={`Retirer ${entry.recipe.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>

                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => handleToggleRecipe(entry.recipe.id)}
                  onKeyDown={(event) => {
                    if (event.key !== "Enter" && event.key !== " ") return
                    event.preventDefault()
                    handleToggleRecipe(entry.recipe.id)
                  }}
                  className="block w-full cursor-pointer p-4 text-left"
                  aria-expanded={entry.expanded}
                  aria-label={entry.expanded ? `Replier ${entry.recipe.name}` : `Afficher ${entry.recipe.name}`}
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <img
                      src={recipeImageUrl(entry.recipe, "min-original")}
                      alt={entry.recipe.name}
                      className="h-14 w-14 shrink-0 rounded-[var(--radius-lg)] bg-muted object-cover"
                    />

                    <div className="min-w-0 flex-1">
                      <h3 className="line-clamp-2 text-sm font-bold">{entry.recipe.name}</h3>
                      <div className="mt-3 flex w-full min-w-0 items-center justify-between gap-3">
                        <p className="min-w-0 flex-1 text-xs text-muted-foreground">
                          {entry.ingredients.filter((ingredient, index) =>
                            checkedByKey[getIngredientSelectionKey(entry.recipe, ingredient, index)] !== false,
                          ).length}/{entry.ingredients.length} ingredient{entry.ingredients.length > 1 ? "s" : ""} selectionne{entry.ingredients.length > 1 ? "s" : ""}
                        </p>
                        <div
                          className="group ml-auto flex shrink-0 items-center gap-1 rounded-[var(--radius-lg)] border border-border bg-secondary/30 px-2 py-1"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => handleChangePortions(entry.recipe.id, -1)}
                            className="flex h-6 w-6 items-center justify-center rounded-[var(--radius-md)] text-muted-foreground transition-all hover:bg-secondary hover:text-foreground sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
                            aria-label="Reduire les portions"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="text-xs font-semibold tabular-nums text-foreground">
                            {formatPortionLabel(entry.portions)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleChangePortions(entry.recipe.id, 1)}
                            className="flex h-6 w-6 items-center justify-center rounded-[var(--radius-md)] text-muted-foreground transition-all hover:bg-secondary hover:text-foreground sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
                            aria-label="Augmenter les portions"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {entry.expanded && (
                  <div className="border-t border-border/40 bg-secondary/10 px-4 py-3">
                    {entry.ingredients.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Cette recette n'a pas d'ingredients structures.</p>
                    ) : (
                      <div className="space-y-2">
                        {entry.ingredients.map((ingredient, index) => {
                          const ingredientKey = getIngredientSelectionKey(entry.recipe, ingredient, index)
                          const checked = checkedByKey[ingredientKey] !== false

                          return (
                            <label
                              key={`${entry.recipe.id}-${ingredient.referenceId ?? index}`}
                              className={cn(
                                "flex items-center gap-3 rounded-[var(--radius-lg)] border px-3 py-2.5 transition-colors",
                                checked
                                  ? "border-border/50 bg-card"
                                  : "border-border/30 bg-card/40 opacity-65",
                              )}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => handleToggleIngredient(entry.recipe, ingredient, index)}
                                className="h-4 w-4 rounded border-border accent-primary"
                              />
                              <span className="min-w-0 flex-1 text-sm leading-snug">
                                {formatIngredientLabel(entry.recipe, ingredient, entry.portions)}
                              </span>
                            </label>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </section>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-border/40 pt-4">
        <Button
          onClick={() => void handleSubmit()}
          disabled={loadingRecipes || submitting || !hasSelectableIngredients}
          className="gap-2"
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ShoppingCart className="h-4 w-4" />
          )}
          Ajouter mes recettes
        </Button>
      </div>
    </DialogContent>
  )
}

export function PlanningAddToCartDialog({
  open,
  onOpenChange,
  recipes,
  loadingRecipes,
  submitting,
  onSubmit,
}: PlanningAddToCartDialogProps) {
  const stateKey = recipes
    .map((entry) => `${entry.recipe.id}:${entry.occurrences}`)
    .join("|")

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !submitting && onOpenChange(nextOpen)}>
      {open && (
        <PlanningAddToCartDialogBody
          key={stateKey}
          recipes={recipes}
          loadingRecipes={loadingRecipes}
          submitting={submitting}
          onOpenChange={onOpenChange}
          onSubmit={onSubmit}
        />
      )}
    </Dialog>
  )
}
