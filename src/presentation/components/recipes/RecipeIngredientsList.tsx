import type { MealieRecipeIngredientOutput } from "@/shared/types/mealie/Recipes.ts"

interface RecipeIngredientsListProps {
  ingredients: MealieRecipeIngredientOutput[]
  /** Heading size class â€” defaults to "text-lg" */
  headingSize?: "text-lg" | "text-base"
  headingText?: string
}

export function RecipeIngredientsList({
  ingredients,
  headingSize = "text-lg",
  headingText = "Ingrédients",
}: RecipeIngredientsListProps) {
  if (ingredients.length === 0) return null

  return (
    <section className="space-y-3">
      <h2 className={`font-heading ${headingSize} font-bold tracking-tight`}>{headingText}</h2>
      <ul className="space-y-1.5">
        {ingredients.map((ing, i) => (
          <li key={i} className="flex items-baseline gap-1 text-sm">
            {ing.quantity != null && (
              <span className="font-semibold tabular-nums text-foreground">{ing.quantity}</span>
            )}
            {ing.unit?.name && <span className="text-muted-foreground text-xs">{ing.unit.name}</span>}
            {ing.food?.name && <span className="font-medium">{ing.food.name}</span>}
            {ing.note && <span className="text-muted-foreground text-xs"> - {ing.note}</span>}
          </li>
        ))}
      </ul>
    </section>
  )
}
