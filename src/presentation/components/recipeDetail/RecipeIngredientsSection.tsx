import { GripVertical, Loader2, Plus, RefreshCw, Trash2 } from "lucide-react"

import type { RecipeFormIngredient } from "@/shared/types/mealie/Recipes.ts"
import { Button, Combobox, Input } from "components/ui"
import { InlineEditCompactNumber } from "components/common/InlineEditCompactNumber.tsx"

interface Option {
  id: string
  label: string
}

interface RecipeIngredientsSectionProps {
  recipeServings: string
  isEditMode: boolean
  saving: boolean
  visibleIngredients: RecipeFormIngredient[]
  totalIngredientCount: number
  analyzableIngredientIndexes: number[]
  analyzingIngredientIndexes: number[]
  foodOptions: Option[]
  unitOptions: Option[]
  onChangeServings: (value: string) => void
  onAnalyzeIngredients: (indexes?: number[]) => Promise<void>
  onAddIngredient: () => void
  onUpdateIngredientField: (index: number, partial: Partial<RecipeFormIngredient>) => void
  onRemoveIngredient: (index: number) => void
}

export function RecipeIngredientsSection({
  recipeServings,
  isEditMode,
  saving,
  visibleIngredients,
  totalIngredientCount,
  analyzableIngredientIndexes,
  analyzingIngredientIndexes,
  foodOptions,
  unitOptions,
  onChangeServings,
  onAnalyzeIngredients,
  onAddIngredient,
  onUpdateIngredientField,
  onRemoveIngredient,
}: RecipeIngredientsSectionProps) {
  return (
    <section className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <h2 className="font-heading text-lg font-bold tracking-tight">Ingredients</h2>
          <span className="text-sm text-muted-foreground">pour</span>
          <InlineEditCompactNumber
            label=""
            value={recipeServings}
            unit={Number(recipeServings || "0") > 1 ? "portions" : "portion"}
            placeholder="1"
            onChange={onChangeServings}
            disabled={saving || !isEditMode}
            step="1"
            inputMode="numeric"
          />
        </div>

        {isEditMode && (
          <div className="flex items-center justify-end gap-2 sm:flex-shrink-0">
            {analyzableIngredientIndexes.length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void onAnalyzeIngredients(analyzableIngredientIndexes)}
                disabled={saving || analyzingIngredientIndexes.length > 0}
                className="gap-1.5"
              >
                {analyzingIngredientIndexes.length > 0 ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Analyse...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-3.5 w-3.5" />
                    Analyser
                  </>
                )}
              </Button>
            )}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onAddIngredient}
              disabled={saving || !isEditMode}
              className="gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              Ajouter
            </Button>
          </div>
        )}
      </div>

      {isEditMode ? (
        <>
          <div className="hidden px-1 sm:grid sm:grid-cols-[16px_70px_1fr_1fr_1.5fr_32px] sm:items-center sm:gap-2">
            <span />
            <span className="text-xs font-medium text-muted-foreground">Qte</span>
            <span className="text-xs font-medium text-muted-foreground">Unite</span>
            <span className="text-xs font-medium text-muted-foreground">Ingredient</span>
            <span className="text-xs font-medium text-muted-foreground">Notes</span>
            <span />
          </div>

          <div className="space-y-2">
            {visibleIngredients.map((ingredient, index) => (
              <div key={ingredient.referenceId ?? index} className="overflow-x-auto">
                <div className="grid min-w-[720px] grid-cols-[16px_70px_140px_180px_220px_32px] items-center gap-2">
                  <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground" />

                  <Input
                    type="text"
                    inputMode="decimal"
                    placeholder="Qte"
                    value={ingredient.quantity}
                    onChange={(event) => onUpdateIngredientField(index, { quantity: event.target.value })}
                    disabled={saving || !isEditMode}
                    className="min-w-0 px-2"
                    aria-label={`Quantite ingredient ${index + 1}`}
                  />

                  <Combobox
                    value={ingredient.unit}
                    onChange={(value, option) => onUpdateIngredientField(index, { unit: value, unitId: option?.id })}
                    options={unitOptions}
                    placeholder="Unite"
                    disabled={saving || !isEditMode}
                    inputClassName="bg-white dark:bg-zinc-900"
                    aria-label={`Unite ingredient ${index + 1}`}
                  />

                  <Combobox
                    value={ingredient.food}
                    onChange={(value, option) =>
                      onUpdateIngredientField(index, {
                        food: value,
                        foodId: option && option.id !== "__create__" ? option.id : undefined,
                      })}
                    options={foodOptions}
                    placeholder="Ingredient..."
                    disabled={saving || !isEditMode}
                    allowCreate
                    createLabel={(value) => `Creer "${value}"`}
                    inputClassName="bg-white dark:bg-zinc-900"
                    aria-label={`Ingredient ${index + 1}`}
                  />

                  <Input
                    type="text"
                    placeholder="Notes..."
                    value={ingredient.note}
                    onChange={(event) => onUpdateIngredientField(index, { note: event.target.value })}
                    disabled={saving || !isEditMode}
                    className="min-w-0 px-2"
                    aria-label={`Notes ingredient ${index + 1}`}
                  />

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemoveIngredient(index)}
                    disabled={saving || !isEditMode || totalIngredientCount <= 1}
                    className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                    aria-label={`Supprimer ingredient ${index + 1}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="space-y-2">
          {visibleIngredients.map((ingredient, index) => (
            <div key={ingredient.referenceId ?? index} className="text-sm leading-relaxed">
              <span className="font-medium text-foreground">
                - {[ingredient.quantity, ingredient.unit, ingredient.food].map((part) => part.trim()).filter(Boolean).join(" ") || "Ingredient"}
              </span>
              {ingredient.note?.trim() ? (
                <span className="text-muted-foreground"> ({ingredient.note.trim()})</span>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
