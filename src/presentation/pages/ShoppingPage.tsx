// Icons (lucide)
import {
  AlertCircle, Loader2, Minus, PackageOpen, Plus, Tag,
} from "lucide-react"

// Utils
import { cn } from "@/lib/utils.ts"

// Hooks - Organizer
import { useFoods, useUnits } from "hooks/organizer"

// Hooks - Shopping
import { useShoppingPageController, useShopping } from "hooks/shopping"

// Components - Common
import { RecipeDetailModal } from "components/common/recipe/RecipeDetailModal.tsx"

// Components - Shopping
import { ShoppingCellierSection, ShoppingHabituelSection, FormLabelSelect, GroupedMealieFood } from "components/shopping"

// UI Components
import {
  Button, Input,
  Dialog, DialogContent, DialogDescription,
  DialogHeader, DialogTitle,
} from "components/ui"


export function ShoppingPage() {
  const { foods, ensureLoaded: ensureFoodsLoaded } = useFoods({ enabled: false })
  const { units, ensureLoaded: ensureUnitsLoaded } = useUnits({ enabled: false })
  const shopping = useShopping()

  const {
    newItemNote, setNewItemNote, newItemQty, setNewItemQty, newItemLabelId, handleItemLabelChange,
    addingItem, newHabituelNote, setNewHabituelNote, newHabituelLabelId, setNewHabituelLabelId,
    setNewHabituelFoodId, newCellierNote, setNewCellierNote, newCellierQty, setNewCellierQty,
    newCellierUnitId, setNewCellierUnitId, setNewCellierFoodId, addingHabituel, addingSelectedHabituels,
    addingCellier, deductingCellier, deductionSummary, selectedHabituelItems, addHabituelDialogOpen,
    setAddHabituelDialogOpen, confirmationAction, setConfirmationAction, previewSlug, setPreviewSlug,
    newItemInputRef, sortedLabels, checkedCount, totalCount, progressPct, hasCellierAnnotations, habituelFoodOptions,
    selectedExistingHabituelFood, cellierFoodOptions, removeItem, editItemQuantity, editItemNote,
    handleViewRecipe, handleAddItem, handleAddHabituel, handleAddCellier, handleDeductFromCellier,
    handleSelectHabituel, handleAddSelectedHabituels, handleConfirmAction, confirmationCopy, removeHabituel,
    editHabituelNote, removeCellier, editCellierQuantity,
  } = useShoppingPageController(
    {
      foods, labels: shopping.labels, list: shopping.list, items: shopping.items,
      habituelsItems: shopping.habituelsItems, cellierItems: shopping.cellierItems,
      ensureUnitsLoaded, addItem: shopping.addItem, updateItemQuantity: shopping.updateItemQuantity,
      updateItemNote: shopping.updateItemNote, deleteItem: shopping.deleteItem,
      addHabituel: shopping.addHabituel, updateHabituelNote: shopping.updateHabituelNote,
      deleteHabituel: shopping.deleteHabituel, addHabituelSelectionToCart: shopping.addHabituelSelectionToCart,
      addCellierItem: shopping.addCellierItem, updateCellierQuantity: shopping.updateCellierQuantity,
      deleteCellierItem: shopping.deleteCellierItem, clearList: shopping.clearList,
      deleteAllHabituels: shopping.deleteAllHabituels, deleteAllCellier: shopping.deleteAllCellier, reload: shopping.reload,
    })

  return (
    <div className="flex flex-col gap-6 pb-8">
      <Dialog
        open={confirmationAction !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmationAction(null)
        }}
      >
        <DialogContent className="w-[calc(100vw-2rem)] max-w-md sm:w-full">
          <DialogHeader>
            <DialogTitle>{confirmationCopy?.title ?? "Confirmer l'action"}</DialogTitle>
            <DialogDescription>{confirmationCopy?.description ?? ""}</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setConfirmationAction(null)}>
              Annuler
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => void handleConfirmAction()}
              disabled={shopping.clearingList || shopping.clearingHabituels || shopping.clearingCellier}
            >
              {confirmationCopy?.action ?? "Confirmer"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="sticky top-0 z-20 -mx-4 border-b border-border/40 bg-background/95 px-4 pb-3 pt-5 backdrop-blur-md md:-mx-7 md:px-7">
        <div className="flex items-center justify-between gap-3">
          <h1 className="font-heading text-2xl font-bold">Liste de courses</h1>
          <div className="flex items-center gap-2">
            <a
              href="/settings/labels"
              className={cn(
                "flex items-center gap-1.5 rounded-[var(--radius-lg)] border border-border bg-card px-2.5 py-1.5",
                "text-xs font-semibold text-muted-foreground shadow-subtle transition-all duration-150",
                "hover:bg-secondary hover:text-foreground",
              )}
              title="Gerer les etiquettes"
            >
              <Tag className="h-3.5 w-3.5" />
              Etiquettes
            </a>
          </div>
        </div>
      </div>

      {shopping.error && (
        <div className="flex items-center gap-3 rounded-[var(--radius-xl)] border border-destructive/20 bg-destructive/8 p-4 text-destructive">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span className="text-sm">{shopping.error}</span>
        </div>
      )}

      {shopping.loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-7 w-7 animate-spin text-muted-foreground/50" />
        </div>
      )}

      {!shopping.loading && (
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-6">
          <section className="flex flex-col lg:w-[60%]">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold">Prochaines courses</h2>
                {totalCount > 0 && (
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                    {checkedCount}/{totalCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {shopping.cellierItems.length > 0 && shopping.items.length > 0 && (
                  <button
                    type="button"
                    onClick={() => void handleDeductFromCellier()}
                    disabled={deductingCellier || shopping.clearingList}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-primary transition-colors hover:text-[rgba(194,65,12,1)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {deductingCellier ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PackageOpen className="h-3.5 w-3.5" />}
                    {hasCellierAnnotations ? "Annuler la deduction" : "Deduire de la liste"}
                  </button>
                )}
                {checkedCount > 0 && (
                  <button
                    type="button"
                    onClick={() => void shopping.clearList("checked")}
                    disabled={shopping.clearingList}
                    className="text-xs font-medium text-destructive transition-colors hover:text-destructive/80 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Vider coches
                  </button>
                )}
                {shopping.items.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setConfirmationAction("clear-list")}
                    disabled={shopping.clearingList}
                    className="text-xs font-medium text-destructive transition-colors hover:text-destructive/80 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {shopping.clearingList ? "Vidage..." : "Tout vider"}
                  </button>
                )}
              </div>
            </div>

            <div className="relative rounded-[var(--radius-2xl)] border border-border/50 bg-card shadow-subtle">
              {shopping.clearingList && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/45 backdrop-blur-sm">
                  <div className="flex items-center gap-3 rounded-[var(--radius-xl)] border border-border/50 bg-card/95 px-4 py-3 shadow-lg">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <span className="text-sm font-medium text-foreground">Vidage de la liste en cours...</span>
                  </div>
                </div>
              )}

              <div
                className={cn(
                  "transition-all duration-200",
                  shopping.clearingList && "pointer-events-none select-none blur-[3px] saturate-75",
                )}
              >
                {totalCount > 0 && (
                  <div className="px-4 pb-2 pt-3">
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">{progressPct}% complete</span>
                      <span className="text-xs text-muted-foreground">{checkedCount}/{totalCount}</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-500"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>
                )}

                <GroupedMealieFood
                  items={shopping.items}
                  labels={shopping.labels}
                  onToggle={(item) => void shopping.toggleItem(item)}
                  onDelete={(id) => void removeItem(id)}
                  onUpdateQuantity={(item, qty) => void editItemQuantity(item, qty)}
                  onUpdateNote={(item, note) => void editItemNote(item, note)}
                  onViewRecipe={(name) => void handleViewRecipe(name)}
                />

                <div className="rounded-b-[var(--radius-2xl)] border-t border-border/40 bg-secondary/20 p-3">
                  <form onSubmit={(event) => void handleAddItem(event)} className="flex gap-2">
                    <div className="flex shrink-0 items-center overflow-hidden rounded-[var(--radius-lg)] border border-input bg-card">
                      <button
                        type="button"
                        onClick={() => setNewItemQty((quantity) => Math.max(1, quantity - 1))}
                        className="flex h-8 w-7 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                        aria-label="Diminuer"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-6 text-center text-sm font-semibold tabular-nums">{newItemQty}</span>
                      <button
                        type="button"
                        onClick={() => setNewItemQty((quantity) => quantity + 1)}
                        className="flex h-8 w-7 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                        aria-label="Augmenter"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <Input
                      ref={newItemInputRef}
                      value={newItemNote}
                      onChange={(event) => setNewItemNote(event.target.value)}
                      placeholder="Ajouter un article..."
                      className="h-8 min-w-0 flex-1 text-sm"
                      disabled={addingItem}
                    />
                    {shopping.labels.length > 0 && (
                      <FormLabelSelect
                        labels={sortedLabels}
                        value={newItemLabelId}
                        onChange={handleItemLabelChange}
                        disabled={addingItem || !newItemNote.trim()}
                      />
                    )}
                    <Button type="submit" size="sm" className="h-8 shrink-0" disabled={addingItem || !newItemNote.trim()}>
                      {addingItem ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                    </Button>
                  </form>
                </div>
              </div>
            </div>
          </section>

          <section className="flex flex-col lg:w-[40%]">
            <ShoppingHabituelSection
              items={shopping.habituelsItems}
              labels={shopping.labels}
              sortedLabels={sortedLabels}
              selectedIds={new Set(selectedHabituelItems.map((item) => item.id))}
              selectedItems={selectedHabituelItems}
              dialogOpen={addHabituelDialogOpen}
              units={units}
              addInput={newHabituelNote}
              addLabelId={newHabituelLabelId}
              foodOptions={habituelFoodOptions}
              adding={addingHabituel}
              addingSelected={addingSelectedHabituels}
              selectedExistingFoodLabelId={selectedExistingHabituelFood?.labelId}
              onDialogOpenChange={setAddHabituelDialogOpen}
              onInputChange={(value, foodId) => {
                setNewHabituelNote(value)
                setNewHabituelFoodId(foodId)
                const selectedFood =
                  (foodId ? foods.find((food) => food.id === foodId) : foods.find((food) => food.name.toLowerCase() === value.toLowerCase())) ?? null
                setNewHabituelLabelId(selectedFood?.labelId ?? "")
              }}
              onLabelChange={setNewHabituelLabelId}
              onSelect={handleSelectHabituel}
              onDelete={(id) => void removeHabituel(id)}
              onUpdateNote={(item, note) => void editHabituelNote(item, note)}
              onAdd={(event) => void handleAddHabituel(event)}
              onAddSelected={handleAddSelectedHabituels}
              onFocusFoods={() => {
                void ensureFoodsLoaded()
              }}
              onClearAll={() => setConfirmationAction("clear-habituels")}
              clearing={shopping.clearingHabituels}
            />

            <ShoppingCellierSection
              items={shopping.cellierItems}
              labels={shopping.labels}
              units={units}
              addInput={newCellierNote}
              addQuantity={newCellierQty}
              addUnitId={newCellierUnitId}
              foodOptions={cellierFoodOptions}
              adding={addingCellier}
              deductionSummary={deductionSummary}
              clearing={shopping.clearingCellier}
              onInputChange={(value, foodId) => {
                setNewCellierNote(value)
                setNewCellierFoodId(foodId)
              }}
              onQuantityChange={setNewCellierQty}
              onUnitChange={setNewCellierUnitId}
              onAdd={(event) => void handleAddCellier(event)}
              onOpenUnits={() => {
                void ensureUnitsLoaded()
              }}
              onFocusFoods={() => {
                void ensureFoodsLoaded()
              }}
              onUpdateQuantity={(item, qty) => void editCellierQuantity(item, qty)}
              onDelete={(id) => void removeCellier(id)}
              onClearAll={() => setConfirmationAction("clear-cellier")}
            />
          </section>
        </div>
      )}

      <RecipeDetailModal slug={previewSlug} onOpenChange={(open) => { if (!open) setPreviewSlug(null) }} />
    </div>
  )
}
