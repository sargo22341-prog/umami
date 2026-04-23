// React
import {
  useCallback, useMemo, useState,
  type CSSProperties,
} from "react"

// React DOM
import { createPortal } from "react-dom"

// Icons (lucide)
import {
  AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  Eye, Loader2, ShoppingCart, Trash2,
} from "lucide-react"

// Types
import type { MealieReadPlanEntry } from "@/shared/types/mealie/MealPlan.ts"
import type { MealieRecipeOutput } from "@/shared/types/mealie/Recipes.ts"
import {
  DAY_LABELS, MEAL_TYPES, MEAL_TYPE_ORDER, MOBILE_GRID_ROWS,
  type MealTypeKey
} from "./planningPage.constants.ts"


// Utils
import { cn } from "@/lib/utils.ts"

// Shared utils
import {
  addDays, formatDate, formatDateRange, formatDayDate,
  recipeImageUrl,
} from "@/shared/utils"

// Hooks - Planning
import { usePlanning, usePlanningCartSelection, usePlanningMobileInteractions } from "hooks/planning"

// Hooks - Shopping
import { useAddRecipesToCart } from "hooks/shopping"

// Components - Common
import { RecipeDetailModal } from "components/common/recipe/RecipeDetailModal.tsx"
import { PlanningAddToCartDialog } from "components/common/PlanningAddToCartDialog.tsx"

// Components - Planning
import { MobileMealSection, MealCell, RecipePickerDialog, PlanningSelectionCheckbox } from "components/planning"

// UI Components
import { Button } from "components/ui"

function buildDesktopDayChunks(days: Date[]) {
  const chunkSize = 7
  return days.reduce<Date[][]>((chunks, day, index) => {
    const chunkIndex = Math.floor(index / chunkSize)
    if (!chunks[chunkIndex]) chunks[chunkIndex] = []
    chunks[chunkIndex].push(day)
    return chunks
  }, [])
}

function getMealsForSlot(
  mealPlans: MealieReadPlanEntry[],
  date: Date,
  type: string,
): MealieReadPlanEntry[] {
  const key = formatDate(date)
  return mealPlans.filter((meal) => meal.date === key && meal.entryType === type)
}

function getLastMealsForType(
  mealPlans: MealieReadPlanEntry[],
  date: Date,
  type: MealTypeKey,
  count: number,
): MealieReadPlanEntry[] {
  const result: MealieReadPlanEntry[] = []
  const seenIds = new Set<string>()
  let currentDate = date
  let currentIndex = MEAL_TYPE_ORDER.indexOf(type)

  for (let i = 0; i < count * 12 && result.length < count; i += 1) {
    currentIndex -= 1
    if (currentIndex < 0) {
      currentDate = addDays(currentDate, -1)
      currentIndex = MEAL_TYPE_ORDER.length - 1
    }

    const currentType = MEAL_TYPE_ORDER[currentIndex]
    const key = formatDate(currentDate)
    const slots = mealPlans.filter((meal) => meal.date === key && meal.entryType === currentType)
    for (const meal of slots) {
      if (meal.recipe && !seenIds.has(meal.recipe.id)) {
        seenIds.add(meal.recipe.id)
        result.push(meal)
        if (result.length >= count) break
      }
    }
  }

  return result
}

export function PlanningPage() {
  const {
    mealPlans, loading, error, deletingMealIds, centerDate, nbDays, setNbDays, goToPrevDay,
    goToNextDay, goToPrevPeriod, goToNextPeriod, goToToday, addMeal, deleteMeal,
  } = usePlanning()
  const {
    loadPlanningRecipes, addRecipes: addRecipesToCart, loadingRecipes: loadingCartRecipes,
    loading: addingToCart, error: cartError, success: cartSuccess,
  } = useAddRecipesToCart()

  const [pickerOpen, setPickerOpen] = useState(false)
  const [pendingSlot, setPendingSlot] = useState<{ date: string; entryType: string } | null>(null)
  const [previewSlug, setPreviewSlug] = useState<string | null>(null)

  const days = useMemo(
    () => Array.from({ length: nbDays }, (_, index) => addDays(centerDate, index)),
    [centerDate, nbDays],
  )
  const mobileDays = days
  const desktopDayChunks = useMemo(() => buildDesktopDayChunks(days), [days])

  const {
    cartDialogOpen, setCartDialogOpen, cartRecipes, cartSelectionMode, selectedVisibleCount,
    selectedVisibleMealIdSet, visibleRecipeMealIds, allVisibleRecipesSelected, someVisibleRecipesSelected,
    handleToggleMealSelection, handleToggleDaySelection, handleToggleAllVisibleSelection,
    handleCancelCartSelection, handleCartAction, getDaySelectionState,
  } = usePlanningCartSelection({
    days, mealPlans, loadPlanningRecipes,
  })

  const handleSetNbDays = useCallback((nextNbDays: 3 | 5 | 7 | 14) => {
    handleCancelCartSelection()
    setNbDays(nextNbDays)
  }, [handleCancelCartSelection, setNbDays])

  const handleGoToPrevPeriod = useCallback(() => {
    handleCancelCartSelection()
    goToPrevPeriod()
  }, [goToPrevPeriod, handleCancelCartSelection])

  const handleGoToNextPeriod = useCallback(() => {
    handleCancelCartSelection()
    goToNextPeriod()
  }, [goToNextPeriod, handleCancelCartSelection])

  const handleGoToPrevDay = useCallback(() => {
    handleCancelCartSelection()
    goToPrevDay()
  }, [goToPrevDay, handleCancelCartSelection])

  const handleGoToNextDay = useCallback(() => {
    handleCancelCartSelection()
    goToNextDay()
  }, [goToNextDay, handleCancelCartSelection])

  const handleGoToToday = useCallback(() => {
    handleCancelCartSelection()
    goToToday()
  }, [goToToday, handleCancelCartSelection])

  const handleAddMeal = (date: string, entryType: string) => {
    setPendingSlot({ date, entryType })
    setPickerOpen(true)
  }

  const handlePickerSelect = async (
    selection: { type: "recipe"; recipe: MealieRecipeOutput } | { type: "note"; title?: string; text?: string },
  ) => {
    if (!pendingSlot) return

    if (selection.type === "recipe") {
      await addMeal(pendingSlot.date, pendingSlot.entryType, selection.recipe.id)
    } else {
      await addMeal(
        pendingSlot.date,
        pendingSlot.entryType,
        undefined,
        selection.title,
        selection.text,
      )
    }

    setPendingSlot(null)
  }

  const handleLeftoverSelect = async (date: Date, entryType: string, meal: MealieReadPlanEntry) => {
    if (!meal.recipe) return
    await addMeal(formatDate(date), entryType, meal.recipe.id)
  }

  const handleDrop = useCallback(async (
    draggedMeal: MealieReadPlanEntry,
    targetDate: string,
    targetType: string,
  ) => {
    if (draggedMeal.date === targetDate && draggedMeal.entryType === targetType) return
    if (!draggedMeal.recipe) return
    await deleteMeal(draggedMeal.id)
    await addMeal(targetDate, targetType, draggedMeal.recipe.id)
  }, [deleteMeal, addMeal])

  const {
    mobileMenuMeal,
    setMobileMenuMeal,
    ghostState,
    mobileDragOver,
    handleMealTouchStart,
  } = usePlanningMobileInteractions({ onDrop: handleDrop })

  const handlePreviewOpenChange = (open: boolean) => {
    if (!open) setPreviewSlug(null)
  }

  return (
    <div className="flex flex-col gap-4">
      <div
        className={cn(
          "sticky top-0 z-20 -mx-4 md:-mx-7",
          "border-b border-border/40 bg-background/95 backdrop-blur-md",
          "px-4 pb-3 pt-5 md:px-7",
        )}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-heading text-2xl font-bold">Planning</h1>
            <p className="mt-0.5 text-[12.5px] font-medium text-muted-foreground">{formatDateRange(days)}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => void handleCartAction()}
              disabled={
                loadingCartRecipes
                || visibleRecipeMealIds.length === 0
                || (cartSelectionMode && selectedVisibleCount === 0)
              }
              className="h-9 gap-1.5 self-center"
            >
              {loadingCartRecipes ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : cartSuccess ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-[rgba(60,170,100,1)]" />
              ) : (
                <ShoppingCart className="h-3.5 w-3.5" />
              )}
              <span className="hidden sm:inline">
                {cartSelectionMode
                  ? `Ajouter au panier (${selectedVisibleCount} recette${selectedVisibleCount > 1 ? "s" : ""} selectionnee${selectedVisibleCount > 1 ? "s" : ""})`
                  : cartSuccess
                    ? "Ajoute !"
                    : "Ajouter au panier"}
              </span>
            </Button>

            {cartSelectionMode && (
              <>
                <div
                  className={cn(
                    "flex h-9 items-center gap-2 self-center rounded-[var(--radius-lg)] border border-border bg-card px-3 py-1.5 text-xs font-semibold shadow-subtle transition-colors hover:bg-secondary",
                    allVisibleRecipesSelected && "border-primary/50 bg-primary/5 text-foreground",
                  )}
                >
                  <PlanningSelectionCheckbox
                    checked={allVisibleRecipesSelected}
                    indeterminate={someVisibleRecipesSelected}
                    onChange={handleToggleAllVisibleSelection}
                    ariaLabel="Tout selectionner dans le planning visible"
                  />
                  <button
                    type="button"
                    onClick={() => handleToggleAllVisibleSelection(!allVisibleRecipesSelected)}
                    className="flex h-full items-center"
                  >
                    Tout selectionner
                  </button>
                </div>

                <Button variant="ghost" size="sm" onClick={handleCancelCartSelection} className="px-2.5">
                  Annuler
                </Button>
              </>
            )}

            <div className="flex items-center overflow-hidden rounded-[var(--radius-lg)] border border-border bg-card shadow-subtle">
              {([3, 5, 7, 14] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleSetNbDays(value)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-semibold transition-colors",
                    nbDays === value
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                  )}
                >
                  {value}j
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon-sm" onClick={handleGoToPrevPeriod}>
                <ChevronsLeft className="h-3.5 w-3.5" />
              </Button>
              <Button variant="outline" size="icon-sm" onClick={handleGoToPrevDay}>
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleGoToToday} className="px-3 text-[rgba(47,58,70,1)] dark:text-foreground">
                Aujourd&apos;hui
              </Button>
              <Button variant="outline" size="icon-sm" onClick={handleGoToNextDay}>
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
              <Button variant="outline" size="icon-sm" onClick={handleGoToNextPeriod}>
                <ChevronsRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {cartSelectionMode && (
        <div className="rounded-[var(--radius-xl)] border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-foreground">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>
              Mode selection actif. Choisissez une ou plusieurs recettes visibles, un jour complet, ou tout le planning affiche.
            </span>
            <span className="font-semibold">
              {selectedVisibleCount} recette{selectedVisibleCount > 1 ? "s" : ""} selectionnee{selectedVisibleCount > 1 ? "s" : ""}
            </span>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-7 w-7 animate-spin text-muted-foreground/50" />
        </div>
      )}

      {(error || cartError) && (
        <div className="flex items-center gap-3 rounded-[var(--radius-xl)] border border-destructive/20 bg-destructive/8 p-4 text-destructive">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span className="text-sm">{error ?? `Panier : ${cartError}`}</span>
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="flex flex-col gap-3 md:hidden">
            {mobileDays.map((date) => {
              const isToday = new Date().toDateString() === date.toDateString()
              const dayLabel = DAY_LABELS[date.getDay()]
              const dateStr = formatDate(date)
              const dateLabel = formatDayDate(date)
              const daySelection = getDaySelectionState(dateStr)

              return (
                <div
                  key={date.toISOString()}
                  className={cn(
                    "overflow-hidden rounded-[var(--radius-xl)] border",
                    isToday ? "border-primary/45 shadow-subtle" : "border-border/50 shadow-subtle",
                  )}
                >
                  <div
                    className={cn(
                      "flex items-center justify-between gap-3 px-4 py-2.5 text-sm font-bold",
                      isToday ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground",
                    )}
                  >
                    <div>
                      <span className="mr-2 text-[10px] font-bold uppercase tracking-[0.10em] opacity-60">{dayLabel}</span>
                      {dateLabel}
                    </div>
                    {cartSelectionMode && daySelection.mealIds.length > 0 && (
                      <PlanningSelectionCheckbox
                        checked={daySelection.checked}
                        indeterminate={daySelection.indeterminate}
                        onChange={(checked) => handleToggleDaySelection(dateStr, checked)}
                        ariaLabel={`Selectionner les recettes du ${dateLabel}`}
                      />
                    )}
                  </div>

                  <div className="grid grid-cols-2 divide-x divide-border/40">
                    {MOBILE_GRID_ROWS.flat().map((typeKey, index) => {
                      const mealType = MEAL_TYPES.find((item) => item.key === typeKey)!
                      const meals = getMealsForSlot(mealPlans, date, typeKey)
                      const isDropTarget = mobileDragOver?.date === dateStr && mobileDragOver.type === typeKey

                      return (
                        <div
                          key={typeKey}
                          data-date={dateStr}
                          data-type={typeKey}
                          className={cn(
                            mealType.color,
                            "border-t border-border/40",
                            index < 2 && "border-b border-border/40",
                            isDropTarget && "bg-primary/6 ring-2 ring-inset ring-primary/40",
                          )}
                        >
                          <div className="px-3 pb-1 pt-2">
                            <span className="text-[9.5px] font-bold uppercase tracking-[0.10em] text-muted-foreground/60">
                              {mealType.mobileLabel}
                            </span>
                          </div>
                          <MobileMealSection
                            meals={meals}
                            onAdd={() => handleAddMeal(dateStr, typeKey)}
                            onView={setPreviewSlug}
                            onDelete={deleteMeal}
                            deletingMealIds={deletingMealIds}
                            onMealTouchStart={handleMealTouchStart}
                            selectionMode={cartSelectionMode}
                            selectedMealIds={selectedVisibleMealIdSet}
                            onToggleMealSelection={handleToggleMealSelection}
                          />
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="hidden flex-col gap-4 md:flex">
            {desktopDayChunks.map((dayChunk, chunkIndex) => (
              <div
                key={`desktop-chunk-${chunkIndex}`}
                className="overflow-x-auto rounded-[var(--radius-xl)] border border-border/50 shadow-subtle"
              >
                <table className="table-fixed w-full border-collapse text-sm">
                  <thead>
                    <tr>
                      <th className="w-[112px] border-b border-r border-border/50 bg-secondary/60 px-3 py-2.5 text-left" />
                      {dayChunk.map((date) => {
                        const isToday = new Date().toDateString() === date.toDateString()
                        const dayLabel = DAY_LABELS[date.getDay()]
                        const dateLabel = formatDayDate(date)
                        const daySelection = getDaySelectionState(formatDate(date))

                        return (
                          <th
                            key={date.toISOString()}
                            className={cn(
                              "border-b border-r border-border/50 px-2 py-2.5 text-center font-semibold",
                              isToday ? "bg-primary text-primary-foreground" : "bg-secondary/60 text-foreground",
                            )}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="text-left">
                                <div className="text-[9.5px] font-bold uppercase tracking-[0.10em] opacity-60">{dayLabel}</div>
                                <div className="mt-0.5 text-[13px] font-bold">{dateLabel}</div>
                              </div>
                              {cartSelectionMode && daySelection.mealIds.length > 0 && (
                                <PlanningSelectionCheckbox
                                  checked={daySelection.checked}
                                  indeterminate={daySelection.indeterminate}
                                  onChange={(checked) => handleToggleDaySelection(formatDate(date), checked)}
                                  ariaLabel={`Selectionner les recettes du ${dateLabel}`}
                                />
                              )}
                            </div>
                          </th>
                        )
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {MEAL_TYPES.map(({ key, label, color, borderColor }) => (
                      <tr key={`${chunkIndex}-${key}`}>
                        <td className="w-[112px] border-b border-r border-border/50 bg-secondary/60 px-3 py-2 align-middle">
                          <span className="text-[9.5px] font-bold uppercase tracking-[0.10em] text-muted-foreground/60">{label}</span>
                        </td>
                        {dayChunk.map((date) => {
                          const dateStr = formatDate(date)
                          const meals = getMealsForSlot(mealPlans, date, key)
                          const lastMeals = getLastMealsForType(mealPlans, date, key, 3)

                          return (
                            <MealCell
                              key={`${date.toISOString()}-${key}`}
                              meals={meals}
                              lastMeals={lastMeals}
                              onAdd={() => handleAddMeal(dateStr, key)}
                              onDelete={deleteMeal}
                              deletingMealIds={deletingMealIds}
                              onSelectLeftover={(meal) => void handleLeftoverSelect(date, key, meal)}
                              colorClass={cn(color, "border-b border-r", borderColor)}
                              date={dateStr}
                              entryType={key}
                              onDrop={handleDrop}
                              onView={setPreviewSlug}
                              selectionMode={cartSelectionMode}
                              selectedMealIds={selectedVisibleMealIdSet}
                              onToggleMealSelection={handleToggleMealSelection}
                            />
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </>
      )}

      {ghostState && createPortal(
        <div
          className={cn(
            "fixed z-50 max-w-[200px] pointer-events-none",
            "flex items-center gap-2 overflow-hidden rounded-[var(--radius-lg)] border border-primary/50 bg-card p-2 pr-3 shadow-xl opacity-90",
          )}
          style={{
            left: ghostState.x - 100,
            top: ghostState.y - 28,
            transform: "rotate(2deg) scale(1.03)",
          }}
        >
          {ghostState.meal.recipe && (
            <img
              src={recipeImageUrl(ghostState.meal.recipe, "min-original")}
              alt=""
              className="h-10 w-10 shrink-0 rounded-[var(--radius-md)] object-cover"
            />
          )}
          <span className="line-clamp-2 text-[12px] font-medium leading-snug">
            {ghostState.meal.recipe?.name ?? ghostState.meal.title ?? "Repas"}
          </span>
        </div>,
        document.body,
      )}

      {mobileMenuMeal && (() => {
        const menuHeight = 160
        const margin = 8
        const viewportHeight = window.innerHeight
        const showAbove = mobileMenuMeal.y + menuHeight + margin > viewportHeight
        const positionStyle: CSSProperties = showAbove
          ? { bottom: viewportHeight - mobileMenuMeal.y + margin }
          : { top: mobileMenuMeal.y + margin }

        return (
          <div className="fixed inset-0 z-40" onClick={() => setMobileMenuMeal(null)}>
            <div
              className="absolute left-4 right-4 mx-auto max-w-xs overflow-hidden rounded-[var(--radius-xl)] border border-border/50 bg-card shadow-xl"
              style={positionStyle}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="border-b border-border/40 px-4 py-3">
                <p className="line-clamp-1 text-sm font-semibold">
                  {mobileMenuMeal.meal.recipe?.name ?? mobileMenuMeal.meal.title ?? "Repas"}
                </p>
              </div>
              <div className="flex flex-col">
                {mobileMenuMeal.meal.recipe?.slug && (
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewSlug(mobileMenuMeal.meal.recipe!.slug)
                      setMobileMenuMeal(null)
                    }}
                    className="flex items-center gap-3 px-4 py-3.5 text-sm transition-colors hover:bg-secondary"
                  >
                    <Eye className="h-4 w-4 text-muted-foreground" />
                    Voir la recette
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    void deleteMeal(mobileMenuMeal.meal.id)
                    setMobileMenuMeal(null)
                  }}
                  disabled={deletingMealIds.includes(mobileMenuMeal.meal.id)}
                  className="flex items-center gap-3 px-4 py-3.5 text-sm text-destructive transition-colors hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {deletingMealIds.includes(mobileMenuMeal.meal.id) ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  Supprimer du planning
                </button>
                <button
                  type="button"
                  onClick={() => setMobileMenuMeal(null)}
                  className="flex items-center justify-center border-t border-border/40 px-4 py-3 text-sm text-muted-foreground transition-colors hover:bg-secondary"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      <RecipePickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={handlePickerSelect}
      />

      <PlanningAddToCartDialog
        open={cartDialogOpen}
        onOpenChange={setCartDialogOpen}
        recipes={cartRecipes}
        loadingRecipes={loadingCartRecipes}
        submitting={addingToCart}
        onSubmit={addRecipesToCart}
      />

      <RecipeDetailModal slug={previewSlug} onOpenChange={handlePreviewOpenChange} />
    </div>
  )
}
