import { useEffect, useMemo, useRef, useState } from "react"
import { AlertCircle, CheckCircle2, ChevronDown, ChevronRight, Link2, Loader2 } from "lucide-react"

import { cn } from "@/lib/utils.ts"
import {
  addFoodAliasToMealieFood,
  enrichFoodWithPluralForm,
  type UrlImportReviewDraft,
} from "@/infrastructure/recipeSources/urlImportReviewService.ts"
import type { RecipeFormIngredient } from "@/shared/types/mealie/Recipes.ts"
import type { MealieIngredientFoodOutput } from "@/shared/types/mealie/food.ts"
import { buildPreferredUnitLabel, getFoodSuggestions, normalizeFoodAliasValue } from "@/shared/utils"
import {
  type AliasActionFeedback, type ReviewRow,
  buildEmptyIngredient, buildFoodOptions, buildIngredientsFromDraft,
  buildInitialOpenState, buildReviewRows, getSingularPluralSuggestion, hasMeaningfulIngredient,
} from "./urlImportIngredientReviewDialog.helpers.ts"
import {
  Badge, Button, Combobox, Input,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "components/ui"

interface UrlImportIngredientReviewDialogProps {
  open: boolean
  draft: UrlImportReviewDraft | null
  loading: boolean
  error?: string | null
  onOpenChange: (open: boolean) => void
  onConfirm: (ingredients: RecipeFormIngredient[]) => Promise<void> | void
}

function SectionHeader({
  title,
  description,
  count,
  open,
  onToggle,
}: {
  title: string
  description: string
  count: number
  open: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center gap-3 rounded-[var(--radius-xl)] border border-border/60 bg-secondary/25 px-4 py-4 text-left transition-colors hover:bg-secondary/40"
    >
      <div className="text-muted-foreground">
        {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          <Badge variant={title === "A verifier" ? "outline" : "secondary"} className="px-2 py-0.5 text-[10px]">
            {count}
          </Badge>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </div>
    </button>
  )
}

function ReviewDialogBody({
  draft,
  loading,
  error,
  onOpenChange,
  onConfirm,
}: Omit<UrlImportIngredientReviewDialogProps, "open" | "draft"> & { draft: UrlImportReviewDraft }) {
  const [ingredients, setIngredients] = useState<RecipeFormIngredient[]>(() => buildIngredientsFromDraft(draft))
  const [availableFoods, setAvailableFoods] = useState<MealieIngredientFoodOutput[]>(() => draft.availableFoods)
  const [openById, setOpenById] = useState<Record<string, boolean>>(() => buildInitialOpenState(draft))
  const [suggestionById, setSuggestionById] = useState<Record<string, string>>({})
  const [suggestionInputById, setSuggestionInputById] = useState<Record<string, string>>({})
  const [aliasFeedbackById, setAliasFeedbackById] = useState<Record<string, AliasActionFeedback>>({})
  const [pluralFeedbackById, setPluralFeedbackById] = useState<Record<string, AliasActionFeedback>>({})
  const [reviewSectionOpen, setReviewSectionOpen] = useState(true)
  const [matchedSectionOpen, setMatchedSectionOpen] = useState(false)
  const previousMatchStateRef = useRef<Record<string, boolean>>({})

  const foodOptions = useMemo(() => buildFoodOptions(availableFoods), [availableFoods])
  const unitOptions = useMemo(
    () => draft.availableUnits.map((unit) => ({
      id: unit.id,
      label: buildPreferredUnitLabel(unit),
    })),
    [draft.availableUnits],
  )

  const rows = useMemo(
    () => buildReviewRows(draft, ingredients, availableFoods),
    [availableFoods, draft, ingredients],
  )

  const rowsToReview = useMemo(
    () => [...rows]
      .filter((row) => !row.isFullMatch)
      .sort((left, right) => {
        if (left.completenessScore !== right.completenessScore) {
          return left.completenessScore - right.completenessScore
        }
        return left.index - right.index
      }),
    [rows],
  )

  const matchedRows = useMemo(
    () => rows.filter((row) => row.isFullMatch),
    [rows],
  )

  const validatedCount = matchedRows.length
  const totalCount = rows.length
  const progressPercent = totalCount > 0 ? Math.round((validatedCount / totalCount) * 100) : 0

  useEffect(() => {
    setOpenById((current) => {
      let nextState = current

      for (const row of rows) {
        const wasFullMatch = previousMatchStateRef.current[row.item.id]
        if (row.isFullMatch && wasFullMatch === false && current[row.item.id]) {
          if (nextState === current) {
            nextState = { ...current }
          }
          nextState[row.item.id] = false
        }
      }

      previousMatchStateRef.current = Object.fromEntries(rows.map((row) => [row.item.id, row.isFullMatch]))
      return nextState
    })
  }, [rows])

  const updateIngredient = (index: number, patch: Partial<RecipeFormIngredient>) => {
    setIngredients((prev) => prev.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)))
  }

  const toggleRow = (id: string) => {
    setOpenById((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const handleConfirm = async () => {
    const nextIngredients = ingredients
      .filter(hasMeaningfulIngredient)
      .map((ingredient) => ({
        ...ingredient,
        quantity: ingredient.quantity.trim(),
        unit: ingredient.unit.trim(),
        food: ingredient.food.trim(),
        note: ingredient.note.trim(),
      }))

    await onConfirm(nextIngredients.length > 0 ? nextIngredients : [buildEmptyIngredient()])
  }

  const handleAliasMerge = async (
    rowId: string,
    ingredient: RecipeFormIngredient,
    selectedFoodId: string | undefined,
    index: number,
  ) => {
    if (!selectedFoodId) return

    const targetFood = availableFoods.find((food) => food.id === selectedFoodId)
    if (!targetFood) return

    const aliasCandidate = normalizeFoodAliasValue(ingredient.food)
    if (!aliasCandidate) {
      setAliasFeedbackById((prev) => ({
        ...prev,
        [rowId]: {
          state: "error",
          message: "Nom d'ingredient vide, alias impossible a ajouter.",
        },
      }))
      return
    }

    setAliasFeedbackById((prev) => ({
      ...prev,
      [rowId]: {
        state: "loading",
        message: "Ajout de l'alias en cours...",
      },
    }))

    try {
      const updatedFood = await addFoodAliasToMealieFood(targetFood, aliasCandidate)
      setAvailableFoods((prev) => prev.map((food) => (food.id === updatedFood.id ? updatedFood : food)))
      updateIngredient(index, {
        food: updatedFood.name,
        foodId: updatedFood.id,
      })
      setAliasFeedbackById((prev) => ({
        ...prev,
        [rowId]: {
          state: "success",
          message: `Alias ajoute sur "${updatedFood.name}".`,
        },
      }))
    } catch (mergeError) {
      setAliasFeedbackById((prev) => ({
        ...prev,
        [rowId]: {
          state: "error",
          message: mergeError instanceof Error
            ? mergeError.message
            : "Impossible d'ajouter l'alias sur cette food.",
        },
      }))
    }
  }

  const handleSingularPluralEnrichment = async (itemId: string, targetFood: MealieIngredientFoodOutput, candidate: string) => {
    setPluralFeedbackById((prev) => ({
      ...prev,
      [itemId]: {
        state: "loading",
        message: "Mise a jour de la food en cours...",
      },
    }))

    try {
      const result = await enrichFoodWithPluralForm(targetFood, candidate)
      setAvailableFoods((prev) => prev.map((food) => (food.id === result.updatedFood.id ? result.updatedFood : food)))
      setPluralFeedbackById((prev) => ({
        ...prev,
        [itemId]: {
          state: "success",
          message: result.mode === "pluralName"
            ? `PluralName defini sur "${candidate}".`
            : `Alias "${candidate}" ajoute sur "${result.updatedFood.name}".`,
        },
      }))
    } catch (updateError) {
      setPluralFeedbackById((prev) => ({
        ...prev,
        [itemId]: {
          state: "error",
          message: updateError instanceof Error
            ? updateError.message
            : "Impossible d'enrichir cette food.",
        },
      }))
    }
  }

  const renderIngredientRow = (row: ReviewRow) => {
    const { item, index, ingredient, foodMatch, unitMatch, isUnitOptional, isFullMatch } = row
    const suggestions = !foodMatch
      ? getFoodSuggestions(ingredient.food, availableFoods)
      : []
    const selectedSuggestionId = suggestionById[item.id] ?? suggestions[0]?.item.id
    const selectedSuggestionLabel = selectedSuggestionId
      ? availableFoods.find((food) => food.id === selectedSuggestionId)?.name ?? ""
      : ""
    const suggestionInputValue = suggestionInputById[item.id] ?? selectedSuggestionLabel
    const aliasFeedback = aliasFeedbackById[item.id]
    const pluralFeedback = pluralFeedbackById[item.id]
    const open = openById[item.id] ?? false
    const singularPluralSuggestion = getSingularPluralSuggestion(item, availableFoods)
    const singularPluralTargetFood = singularPluralSuggestion
      ? availableFoods.find((food) => food.id === item.foodMatch?.item.id) ?? item.foodMatch?.item ?? null
      : null

    return (
      <section
        key={item.id}
        className={cn(
          "rounded-[var(--radius-xl)] border bg-card shadow-subtle transition-colors",
          isFullMatch ? "border-border/50" : "border-red-400/80",
        )}
      >
        <button
          type="button"
          onClick={() => toggleRow(item.id)}
          className="flex w-full items-start gap-3 px-4 py-4 text-left transition-colors hover:bg-secondary/25"
        >
          <div className="pt-0.5 text-muted-foreground">
            {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/70">
                Ingredient brut
              </div>
              <Badge variant={isFullMatch ? "secondary" : "outline"} className="px-2 py-0.5 text-[10px] md:hidden">
                {isFullMatch ? "Match 100%" : "A verifier"}
              </Badge>
            </div>
            <div className="rounded-[var(--radius-lg)] bg-secondary/70 px-3 py-3 text-sm leading-relaxed text-foreground">
              {item.raw}
            </div>
          </div>
          <div className="hidden shrink-0 items-center gap-2 md:flex">
            <Badge variant={isFullMatch ? "secondary" : "outline"} className="px-2 py-0.5 text-[10px]">
              {isFullMatch ? "Match 100%" : "A verifier"}
            </Badge>
          </div>
        </button>

        {open && (
          <div className="border-t border-border/40 px-4 py-4">
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/70">
                  Analyse editable
                </div>

                <div className="grid gap-3 lg:grid-cols-[100px_180px_minmax(0,1fr)]">
                  <Input
                    value={ingredient.quantity}
                    onChange={(event) => updateIngredient(index, { quantity: event.target.value })}
                    placeholder="Quantite"
                    inputMode="decimal"
                    disabled={loading}
                  />

                  <Combobox
                    value={ingredient.unit}
                    onChange={(value, option) =>
                      updateIngredient(index, {
                        unit: value,
                        unitId: option?.id,
                      })}
                    options={unitOptions}
                    placeholder="Unite"
                    disabled={loading}
                  />

                  <Combobox
                    value={ingredient.food}
                    onChange={(value, option) =>
                      updateIngredient(index, {
                        food: value,
                        foodId: option && option.id !== "__create__" ? option.id : undefined,
                      })}
                    options={foodOptions}
                    placeholder="Ingredient"
                    disabled={loading}
                    allowCreate
                    createLabel={(value) => `Creer "${value}"`}
                  />
                </div>

                <Input
                  value={ingredient.note}
                  onChange={(event) => updateIngredient(index, { note: event.target.value })}
                  placeholder="Note optionnelle"
                  disabled={loading}
                />
              </div>

              <div className="space-y-3">
                <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/70">
                  Validation Mealie
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge variant={unitMatch || isUnitOptional ? "secondary" : "outline"} className="px-2 py-0.5 text-[10px]">
                    {isUnitOptional
                      ? "Sans unite a verifier"
                      : unitMatch
                        ? `Unite OK: ${buildPreferredUnitLabel(unitMatch.item)}`
                        : "Unite non trouvee"}
                  </Badge>

                  <Badge variant={foodMatch ? "secondary" : "outline"} className="px-2 py-0.5 text-[10px]">
                    {foodMatch ? `Food OK: ${foodMatch.item.name}` : "Ingredient non trouvee"}
                  </Badge>

                  {item.foodMatch?.strategy === "singular" && (
                    <Badge variant="outline" className="px-2 py-0.5 text-[10px]">
                      Match via singulier/pluriel
                    </Badge>
                  )}

                  <Badge variant={isFullMatch ? "secondary" : "outline"} className="px-2 py-0.5 text-[10px]">
                    {isFullMatch ? "Match global 100%" : "Match incomplet"}
                  </Badge>
                </div>

                {singularPluralSuggestion && singularPluralTargetFood && (
                  <div className="space-y-2 rounded-[var(--radius-lg)] border border-dashed border-border/70 bg-secondary/25 p-3">
                    <div className="text-sm text-foreground">
                      {singularPluralSuggestion.mode === "pluralName"
                        ? `Cette food a ete matchee via le fallback singulier/pluriel. Definir "${singularPluralSuggestion.candidate}" comme pluralName ?`
                        : `Cette food a ete matchee via le fallback singulier/pluriel. Ajouter "${singularPluralSuggestion.candidate}" en alias ?`}
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      disabled={loading || pluralFeedback?.state === "loading"}
                      onClick={() =>
                        void handleSingularPluralEnrichment(
                          item.id,
                          singularPluralTargetFood,
                          singularPluralSuggestion.candidate,
                        )}
                      className="justify-center"
                    >
                      {pluralFeedback?.state === "loading" ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Mise a jour...
                        </>
                      ) : singularPluralSuggestion.mode === "pluralName" ? (
                        "Definir le pluralName"
                      ) : (
                        "Ajouter en alias"
                      )}
                    </Button>

                    {pluralFeedback?.message && (
                      <div
                        className={cn(
                          "text-xs",
                          pluralFeedback.state === "error" ? "text-destructive" : "text-muted-foreground",
                        )}
                      >
                        {pluralFeedback.message}
                      </div>
                    )}
                  </div>
                )}

                {!foodMatch && (
                  <div className="space-y-2 rounded-[var(--radius-lg)] border border-dashed border-border/70 bg-secondary/25 p-3">
                    <div className="grid gap-2 md:grid-cols-[auto_minmax(0,1fr)]">
                      <Button
                        type="button"
                        variant="outline"
                        disabled={loading || aliasFeedback?.state === "loading" || !selectedSuggestionId}
                        onClick={() => void handleAliasMerge(item.id, ingredient, selectedSuggestionId, index)}
                        className="justify-center"
                      >
                        {aliasFeedback?.state === "loading" ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Fusion...
                          </>
                        ) : (
                          "Fusionner et ajouter en alias"
                        )}
                      </Button>

                      <Combobox
                        value={suggestionInputValue}
                        onChange={(value, option) => {
                          setSuggestionInputById((prev) => ({ ...prev, [item.id]: value }))
                          setSuggestionById((prev) => ({
                            ...prev,
                            [item.id]: option?.id ?? "",
                          }))
                        }}
                        options={suggestions.map((suggestion) => ({
                          id: suggestion.item.id,
                          label: suggestion.item.name,
                        }))}
                        placeholder={
                          suggestions.length > 0
                            ? "Choisir une suggestion proche"
                            : "Aucune suggestion pertinente"
                        }
                        disabled={loading || suggestions.length === 0}
                        aria-label={`Suggestions pour ${ingredient.food || item.raw}`}
                      />
                    </div>

                    {aliasFeedback?.message && (
                      <div
                        className={cn(
                          "text-xs",
                          aliasFeedback.state === "error" ? "text-destructive" : "text-muted-foreground",
                        )}
                      >
                        {aliasFeedback.message}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </section>
    )
  }

  return (
    <>
      <DialogHeader className="border-b border-border/50 px-6 py-5">
        <DialogTitle>Verifier les ingredients importes</DialogTitle>
        <DialogDescription>
          Les ingredients a verifier restent regroupes en haut. Des qu&apos;un ingredient atteint un match a 100%, il bascule automatiquement dans la section dediee.
        </DialogDescription>
        <div className="mt-3 space-y-3">
          <div className="rounded-[var(--radius-xl)] border border-border/60 bg-secondary/20 px-4 py-3 text-foreground">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold">
                  {validatedCount}/{totalCount} ingredient{totalCount > 1 ? "s" : ""} valides
                </div>
                <div className="text-xs text-muted-foreground">
                  {rowsToReview.length > 0
                    ? `${rowsToReview.length} ingredient${rowsToReview.length > 1 ? "s restent" : " reste"} a verifier`
                    : "Tous les ingredients sont maintenant a 100%"}
                </div>
              </div>
              <Badge variant="secondary" className="px-2.5 py-1 text-[10px]">
                {progressPercent}%
              </Badge>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-border/50">
              <div
                className="h-full rounded-full bg-foreground/80 transition-[width] duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>{draft.formData.name}</span>
            <span>•</span>
            <span>{draft.analyzedIngredients.length} ingredient{draft.analyzedIngredients.length > 1 ? "s" : ""}</span>
          </div>
        </div>
      </DialogHeader>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
        {draft.analyzedIngredients.length === 0 ? (
          <div className="rounded-[var(--radius-xl)] border border-dashed border-border/70 bg-secondary/40 p-5 text-sm text-muted-foreground">
            Aucun ingredient brut n&apos;a ete extrait depuis cette URL.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-3">
              <SectionHeader
                title="A verifier"
                description="Les ingredients qui demandent encore une validation ou une correction restent visibles en priorite."
                count={rowsToReview.length}
                open={reviewSectionOpen}
                onToggle={() => setReviewSectionOpen((prev) => !prev)}
              />

              {reviewSectionOpen && (
                rowsToReview.length > 0 ? (
                  <div className="space-y-3">
                    {rowsToReview.map(renderIngredientRow)}
                  </div>
                ) : (
                  <div className="rounded-[var(--radius-xl)] border border-dashed border-border/70 bg-secondary/20 p-4 text-sm text-muted-foreground">
                    Aucun ingredient en attente de verification.
                  </div>
                )
              )}
            </div>

            <div className="space-y-3">
              <SectionHeader
                title="Match a 100%"
                description="Les ingredients deja valides sont regroupes ici et peuvent rester replies pour gagner de la place."
                count={matchedRows.length}
                open={matchedSectionOpen}
                onToggle={() => setMatchedSectionOpen((prev) => !prev)}
              />

              {matchedSectionOpen && (
                matchedRows.length > 0 ? (
                  <div className="space-y-3">
                    {matchedRows.map(renderIngredientRow)}
                  </div>
                ) : (
                  <div className="rounded-[var(--radius-xl)] border border-dashed border-border/70 bg-secondary/20 p-4 text-sm text-muted-foreground">
                    Aucun ingredient n&apos;a encore atteint un match a 100%.
                  </div>
                )
              )}
            </div>
          </div>
        )}

        {draft.url && (
          <div className="mt-4 flex items-start gap-2 rounded-[var(--radius-lg)] bg-secondary/40 px-3 py-2 text-xs text-muted-foreground">
            <Link2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span className="break-all">{draft.url}</span>
          </div>
        )}

        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-[var(--radius-lg)] border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-border/50 px-6 py-4">
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
          Annuler
        </Button>
        <Button
          type="button"
          onClick={() => void handleConfirm()}
          disabled={loading}
          className={cn("gap-2", loading && "pointer-events-none")}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Enregistrement...
            </>
          ) : (
            "Valider et creer la recette"
          )}
        </Button>
      </div>
    </>
  )
}

export function UrlImportIngredientReviewDialog({
  open,
  draft,
  loading,
  error,
  onOpenChange,
  onConfirm,
}: UrlImportIngredientReviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onOpenAutoFocus={(event) => event.preventDefault()}
        className="flex max-h-[90vh] w-[calc(100vw-1rem)] max-w-[70vw] flex-col overflow-hidden p-0 sm:w-[calc(100vw-2rem)]"
        onInteractOutside={(event) => {
          const target = event.target as HTMLElement | null
          if (
            target?.closest?.('[data-combobox-dropdown="true"]')
            || target?.closest?.('[data-autocomplete-dropdown="true"]')
          ) {
            event.preventDefault()
          }
        }}
      >
        {!draft ? null : (
          <ReviewDialogBody
            key={`${draft.recipe?.id ?? "preview"}:${draft.url}`}
            draft={draft}
            loading={loading}
            error={error}
            onOpenChange={onOpenChange}
            onConfirm={onConfirm}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
