import { useState, type Dispatch, type DragEvent, type SetStateAction } from "react"
import { GripVertical, Plus, RefreshCw, Trash2, X } from "lucide-react"

import type {
  RecipeFormIngredient,
  RecipeFormInstruction,
} from "@/shared/types/mealie/Recipes.ts"
import { cn } from "@/lib/utils.ts"
import { MarkdownContent } from "components/common/MarkdownContent.tsx"
import { Badge, Button, Combobox } from "components/ui"
import { autoResizeTextarea, formatRecipeIngredientLine } from "./recipeDetail.helpers.tsx"

interface IngredientOption {
  id: string
  label: string
}

interface RecipeInstructionsSectionProps {
  visibleInstructions: RecipeFormInstruction[]
  ingredients: RecipeFormIngredient[]
  isEditMode: boolean
  saving: boolean
  instructionIngredientInputs: Record<number, string>
  instructionIngredientOptions: IngredientOption[]
  onInstructionIngredientInputsChange: Dispatch<SetStateAction<Record<number, string>>>
  onAutoLinkIngredients: () => void
  onAddInstruction: () => void
  onUpdateInstruction: (index: number, value: string) => void
  onMoveInstruction: (fromIndex: number, toIndex: number) => void
  onRemoveInstruction: (index: number) => void
  onUpdateInstructionReferences: (
    instructionIndex: number,
    updater: (currentReferenceIds: string[]) => string[],
  ) => void
}

export function RecipeInstructionsSection({
  visibleInstructions,
  ingredients,
  isEditMode,
  saving,
  instructionIngredientInputs,
  instructionIngredientOptions,
  onInstructionIngredientInputsChange,
  onAutoLinkIngredients,
  onAddInstruction,
  onUpdateInstruction,
  onMoveInstruction,
  onRemoveInstruction,
  onUpdateInstructionReferences,
}: RecipeInstructionsSectionProps) {
  const [draggedInstructionIndex, setDraggedInstructionIndex] = useState<number | null>(null)
  const [dragOverInstructionIndex, setDragOverInstructionIndex] = useState<number | null>(null)

  const handleInstructionDrop = (event: DragEvent<HTMLLIElement>, targetIndex: number) => {
    event.preventDefault()

    if (draggedInstructionIndex == null) return

    onMoveInstruction(draggedInstructionIndex, targetIndex)
    setDraggedInstructionIndex(null)
    setDragOverInstructionIndex(null)
  }

  return (
    <section className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-heading text-lg font-bold tracking-tight">Instructions</h2>
        {isEditMode && (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onAutoLinkIngredients}
              disabled={saving || !isEditMode || ingredients.length === 0}
              className="gap-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Lier les ingredients
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onAddInstruction}
              disabled={saving || !isEditMode}
              className="gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              Ajouter
            </Button>
          </div>
        )}
      </div>

      <ol className="space-y-4">
        {visibleInstructions.map((step, index) => (
          <li
            key={step.id ?? index}
            onDragOver={(event) => {
              if (!isEditMode || saving || draggedInstructionIndex == null) return
              event.preventDefault()
              if (dragOverInstructionIndex !== index) {
                setDragOverInstructionIndex(index)
              }
            }}
            onDragLeave={() => {
              if (dragOverInstructionIndex === index) {
                setDragOverInstructionIndex(null)
              }
            }}
            onDrop={(event) => handleInstructionDrop(event, index)}
            onDragEnd={() => {
              setDraggedInstructionIndex(null)
              setDragOverInstructionIndex(null)
            }}
            className={cn(
              "flex items-start gap-3 rounded-[var(--radius-xl)] transition-colors",
              isEditMode && "px-2 py-2",
              dragOverInstructionIndex === index && "bg-primary/6 ring-1 ring-primary/20",
            )}
          >
            {isEditMode && (
              <button
                type="button"
                draggable={!saving}
                onDragStart={() => {
                  if (saving) return
                  setDraggedInstructionIndex(index)
                }}
                onDragEnd={() => {
                  setDraggedInstructionIndex(null)
                  setDragOverInstructionIndex(null)
                }}
                className="mt-1 inline-flex h-8 w-8 shrink-0 cursor-grab items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground active:cursor-grabbing"
                aria-label={`Deplacer l'etape ${index + 1}`}
                disabled={saving}
              >
                <GripVertical className="h-4 w-4" />
              </button>
            )}

            <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/8 text-[11px] font-bold text-primary">
              {index + 1}
            </span>

            <div className="min-w-0 flex-1">
              {isEditMode ? (
                <div className="space-y-2">
                  <textarea
                    ref={(element) => {
                      if (element) autoResizeTextarea(element, 3)
                    }}
                    aria-label={`Instruction ${index + 1}`}
                    placeholder="Decrivez cette etape"
                    disabled={saving || !isEditMode}
                    value={step.text}
                    onChange={(event) => {
                      onUpdateInstruction(index, event.target.value)
                      autoResizeTextarea(event.target, 3)
                    }}
                    onInput={(event) => autoResizeTextarea(event.currentTarget, 3)}
                    rows={1}
                    className={cn(
                      "w-full rounded-[var(--radius-xl)] border border-border/50 bg-secondary/20 px-3 py-2",
                      "resize-none overflow-hidden text-sm leading-relaxed text-foreground",
                      "outline-none transition-colors focus:border-ring",
                    )}
                  />

                  <div className="space-y-2 rounded-[var(--radius-xl)] border border-border/50 bg-secondary/10 p-3">
                    <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
                      Ingredients lies
                    </p>

                    {(step.ingredientReferences ?? []).length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {(step.ingredientReferences ?? [])
                          .map((reference) =>
                            ingredients.find((ingredient) => ingredient.referenceId === reference.referenceId))
                          .filter((ingredient): ingredient is RecipeFormIngredient => Boolean(ingredient))
                          .map((ingredient, linkedIndex) => (
                            <Badge
                              key={`${ingredient.referenceId ?? linkedIndex}-${index}`}
                              variant="outline"
                              className="gap-1.5 pr-1 text-xs"
                            >
                              <span>{formatRecipeIngredientLine(ingredient) || ingredient.food || ingredient.note}</span>
                              <button
                                type="button"
                                onClick={() => onUpdateInstructionReferences(index, (currentReferenceIds) =>
                                  currentReferenceIds.filter((referenceId) => referenceId !== ingredient.referenceId))}
                                className="rounded-full p-0.5 text-muted-foreground transition-colors hover:bg-destructive hover:text-destructive-foreground"
                                aria-label={`Retirer l'ingredient lie a l'etape ${index + 1}`}
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Aucun ingredient lie a cette etape.
                      </p>
                    )}

                    <Combobox
                      value={instructionIngredientInputs[index] ?? ""}
                      onChange={(value, option) => {
                        if (!option?.id) {
                          onInstructionIngredientInputsChange((current) => ({ ...current, [index]: value }))
                          return
                        }

                        onUpdateInstructionReferences(index, (currentReferenceIds) => [...currentReferenceIds, option.id])
                        onInstructionIngredientInputsChange((current) => ({ ...current, [index]: "" }))
                      }}
                      options={instructionIngredientOptions.filter((option) =>
                        !(step.ingredientReferences ?? []).some((reference) => reference.referenceId === option.id))}
                      placeholder="Ajouter un ingredient lie..."
                      disabled={saving || instructionIngredientOptions.length === 0}
                      emptyMessage="Tous les ingredients sont deja lies"
                      aria-label={`Ajouter un ingredient a l'etape ${index + 1}`}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <MarkdownContent content={step.text} className="px-2 py-1 text-sm leading-relaxed text-foreground/90" />
                  {(step.ingredientReferences ?? []).length > 0 && (
                    <div className="flex flex-wrap gap-2 px-2">
                      {(step.ingredientReferences ?? [])
                        .map((reference) => ingredients.find((ingredient) => ingredient.referenceId === reference.referenceId))
                        .filter((ingredient): ingredient is RecipeFormIngredient => Boolean(ingredient))
                        .map((ingredient, linkedIndex) => (
                          <Badge key={`${ingredient.referenceId ?? linkedIndex}-${index}`} variant="outline" className="text-xs">
                            {formatRecipeIngredientLine(ingredient) || ingredient.food || ingredient.note}
                          </Badge>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {isEditMode && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => onRemoveInstruction(index)}
                disabled={saving || !isEditMode}
                className="mt-0.5 h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </li>
        ))}
      </ol>
    </section>
  )
}
