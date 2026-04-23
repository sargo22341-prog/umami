import { Plus, Eye, Trash2, Loader2 } from "lucide-react"
import type { MealieReadPlanEntry } from "@/shared/types/mealie/MealPlan.ts"
import { cn } from "@/lib/utils.ts"
import { recipeImageUrl } from "@/shared/utils"


interface MobileMealSectionProps {
  meals: MealieReadPlanEntry[]
  onAdd: () => void
  onMealTouchStart: (meal: MealieReadPlanEntry, e: React.TouchEvent) => void
  onView: (slug: string) => void
  onDelete: (id: number) => void
  deletingMealIds: number[]
  selectionMode?: boolean
  selectedMealIds?: Set<number>
  onToggleMealSelection?: (mealId: number, checked: boolean) => void
}


export function MobileMealSection({
  meals,
  onAdd,
  onMealTouchStart,
  onView,
  onDelete,
  deletingMealIds,
  selectionMode = false,
  selectedMealIds = new Set<number>(),
  onToggleMealSelection,
}: MobileMealSectionProps) {
  return (
    <div className="flex flex-col gap-2 px-3 pb-3">
      {meals.map((meal) => {
        const isDeleting = deletingMealIds.includes(meal.id)
        const title = meal.recipe?.name ?? meal.title ?? "Sans titre"
        const noteText = meal.recipe ? undefined : meal.text?.trim()
        const isSelectableRecipe = selectionMode && Boolean(meal.recipe?.slug)
        const isSelected = isSelectableRecipe && selectedMealIds.has(meal.id)
        return (
          <div
            key={meal.id}
            onTouchStart={(e) => {
              if (isDeleting || selectionMode) return
              onMealTouchStart(meal, e)
            }}
            className={cn(
              "relative rounded-[var(--radius-lg)]",
              "bg-card border border-border/40 shadow-subtle overflow-hidden",
              "touch-none select-none",
              isSelected && "border-primary/70 ring-2 ring-primary/25 shadow-warm",
            )}
          >
            {isSelectableRecipe && (
              <label className="absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-border/40 bg-background/95 shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={(event) => onToggleMealSelection?.(meal.id, event.target.checked)}
                  aria-label={`Selectionner ${title}`}
                  className={cn(
                    "h-3.5 w-3.5 appearance-none rounded-full border border-border/60 bg-background transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                    isSelected && "border-primary bg-primary",
                  )}
                />
              </label>
            )}
            {meal.recipe ? (
              <img
                src={recipeImageUrl(meal.recipe, "min-original")}
                alt={meal.recipe.name ?? "Repas"}
                draggable={false}
                className="w-full aspect-square object-cover pointer-events-none"
              />
            ) : (
              <div className="flex min-h-[140px] w-full flex-col items-start justify-center gap-2 bg-secondary px-3 py-4 text-left">
                <span className="line-clamp-2 text-[12px] font-semibold leading-snug text-foreground">
                  {title}
                </span>
                {noteText && (
                  <p className="line-clamp-4 text-[11px] leading-snug text-muted-foreground">
                    {noteText}
                  </p>
                )}
              </div>
            )}

            <div className="flex border-t border-border/30">
              {meal.recipe?.slug && (
                <button
                  type="button"
                  onTouchStart={(e) => e.stopPropagation()}
                  onClick={() => onView(meal.recipe!.slug)}
                  aria-label="Voir la recette"
                  title="Voir la recette"
                  className="flex flex-1 items-center justify-center py-2"
                >
                  <Eye className="h-4 w-4" />
                </button>
              )}

              <button
                type="button"
                onTouchStart={(e) => e.stopPropagation()}
                onClick={() => onDelete(meal.id)}
                disabled={isDeleting}
                aria-label="Supprimer du planning"
                title="Supprimer du planning"
                className="flex flex-1 items-center justify-center py-2 border-l border-border/30 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        )
      })}
      <button
        type="button"
        onClick={onAdd}
        aria-label="Ajouter un repas"
        title="Ajouter un repas"
        className={cn(
          "flex w-full items-center justify-center rounded-[var(--radius-lg)]",
          "border border-dashed border-border/60 py-3",
          "text-muted-foreground hover:border-primary/60 hover:text-primary hover:bg-primary/4",
          "transition-all duration-150",
        )}
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  )
}
