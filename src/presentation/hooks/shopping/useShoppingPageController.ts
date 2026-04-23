import { useEffect, useMemo, useRef, useState } from "react"

import { getRecipesUseCase, shoppingRepository } from "@/infrastructure/container.ts"
import { foodLabelStore } from "@/infrastructure/shopping/FoodLabelStore.ts"
import { recipeSlugStore } from "@/infrastructure/shopping/RecipeSlugStore.ts"
import type { ShoppingItem, ShoppingLabel, ShoppingList } from "@/domain/shopping/entities/ShoppingItem.ts"
import {
  appendCellierDeductionToNote,
  buildCellierDeductionNote,
  hasCellierDeductionNote,
  resolveCellierRollback,
} from "@/shared/utils/cellierDeduction.ts"
import { extractFoodKey, filterAndSortFoodsByRelevance } from "@/shared/utils/food.ts"
import { equalsNormalizedText, normalizeText } from "@/shared/utils/text.ts"
import { buildShoppingItemUpdatePayload, formatQuantityWithUnit } from "@/shared/utils/shopping.ts"
import { useShoppingAddCellier } from "./cellier/useShoppingAddCellier.ts"
import { useShoppingAddHabituel } from "./habituel/useShoppingAddHabituel.ts"
import { useShoppingAddItem } from "./listeDeCourses/useShoppingAddItem.ts"
import { useShoppingEditCellier } from "./cellier/useShoppingEditCellier.ts"
import { useShoppingEditHabituel } from "./habituel/useShoppingEditHabituel.ts"
import { useShoppingEditItem } from "./listeDeCourses/useShoppingEditItem.ts"
import { useShoppingRemoveCellier } from "./cellier/useShoppingRemoveCellier.ts"
import { useShoppingRemoveHabituel } from "./habituel/useShoppingRemoveHabituel.ts"
import { useShoppingRemoveItem } from "./listeDeCourses/useShoppingRemoveItem.ts"

interface UseShoppingPageControllerParams {
  foods: Array<{ id: string; name: string; labelId?: string | null }>
  labels: ShoppingLabel[]
  list: ShoppingList | null
  items: ShoppingItem[]
  habituelsItems: ShoppingItem[]
  cellierItems: ShoppingItem[]
  ensureUnitsLoaded: () => Promise<unknown>
  addItem: (note: string, quantity?: number, labelId?: string) => Promise<void>
  updateItemQuantity: (item: ShoppingItem, quantity: number) => Promise<void>
  updateItemNote: (item: ShoppingItem, note: string) => Promise<void>
  deleteItem: (itemId: string) => Promise<void>
  addHabituel: (params: { name: string; labelId?: string; foodId?: string }) => Promise<void>
  updateHabituelNote: (item: ShoppingItem, note: string) => Promise<void>
  deleteHabituel: (itemId: string) => Promise<void>
  addHabituelSelectionToCart: (
    selections: Array<{ item: ShoppingItem; quantity: number; unitId?: string; note?: string }>,
  ) => Promise<void>
  addCellierItem: (params: { name: string; quantity: number; unitId?: string; foodId?: string }) => Promise<void>
  updateCellierQuantity: (item: ShoppingItem, quantity: number) => Promise<void>
  deleteCellierItem: (itemId: string) => Promise<void>
  clearList: (mode: "all" | "checked") => Promise<void>
  deleteAllHabituels: () => Promise<void>
  deleteAllCellier: () => Promise<void>
  reload: () => Promise<void>
}

export function useShoppingPageController({
  foods,
  labels,
  list,
  items,
  habituelsItems,
  cellierItems,
  ensureUnitsLoaded,
  addItem,
  updateItemQuantity,
  updateItemNote,
  deleteItem,
  addHabituel,
  updateHabituelNote,
  deleteHabituel,
  addHabituelSelectionToCart,
  addCellierItem,
  updateCellierQuantity,
  deleteCellierItem,
  clearList,
  deleteAllHabituels,
  deleteAllCellier,
  reload,
}: UseShoppingPageControllerParams) {
  const [newItemNote, setNewItemNote] = useState("")
  const [newItemQty, setNewItemQty] = useState(1)
  const [newItemLabelId, setNewItemLabelId] = useState<string>("")
  const labelManuallySetRef = useRef(false)
  const [newHabituelNote, setNewHabituelNote] = useState("")
  const [newHabituelLabelId, setNewHabituelLabelId] = useState<string>("")
  const [newHabituelFoodId, setNewHabituelFoodId] = useState<string | undefined>(undefined)
  const [newCellierNote, setNewCellierNote] = useState("")
  const [newCellierFoodId, setNewCellierFoodId] = useState<string | undefined>(undefined)
  const [newCellierQty, setNewCellierQty] = useState(1)
  const [newCellierUnitId, setNewCellierUnitId] = useState<string>("")
  const [deductingCellier, setDeductingCellier] = useState(false)
  const [deductionSummary, setDeductionSummary] = useState<string[]>([])
  const [selectedHabituelIds, setSelectedHabituelIds] = useState<Set<string>>(new Set())
  const [addHabituelDialogOpen, setAddHabituelDialogOpen] = useState(false)
  const [confirmationAction, setConfirmationAction] = useState<"clear-list" | "clear-habituels" | "clear-cellier" | null>(null)
  const [previewSlug, setPreviewSlug] = useState<string | null>(null)
  const newItemInputRef = useRef<HTMLInputElement>(null)
  const addItemActions = useShoppingAddItem(addItem)
  const editItemActions = useShoppingEditItem(updateItemQuantity, updateItemNote)
  const removeItemActions = useShoppingRemoveItem(deleteItem)
  const addHabituelActions = useShoppingAddHabituel(addHabituel)
  const editHabituelActions = useShoppingEditHabituel(updateHabituelNote)
  const removeHabituelActions = useShoppingRemoveHabituel(deleteHabituel, deleteAllHabituels)
  const addCellierActions = useShoppingAddCellier(addCellierItem)
  const editCellierActions = useShoppingEditCellier(updateCellierQuantity)
  const removeCellierActions = useShoppingRemoveCellier(deleteCellierItem, deleteAllCellier)

  useEffect(() => {
    if (labelManuallySetRef.current) return
    const key = extractFoodKey(newItemNote)
    const saved = key ? foodLabelStore.lookup(key) : undefined
    setNewItemLabelId(saved ?? "")
  }, [newItemNote])

  useEffect(() => {
    if (deductionSummary.length === 0) return
    const timeoutId = window.setTimeout(() => {
      setDeductionSummary([])
    }, 5000)
    return () => window.clearTimeout(timeoutId)
  }, [deductionSummary])

  useEffect(() => {
    if (!addHabituelDialogOpen) return
    void ensureUnitsLoaded()
  }, [addHabituelDialogOpen, ensureUnitsLoaded])

  const sortedLabels = useMemo(
    () => [...labels].sort((left, right) => left.name.localeCompare(right.name, "fr")),
    [labels],
  )

  const checkedCount = items.filter((item) => item.checked).length
  const totalCount = items.length
  const progressPct = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0
  const hasCellierAnnotations = useMemo(
    () => items.some((item) => hasCellierDeductionNote(item.note)),
    [items],
  )

  const habituelFoodOptions = useMemo(
    () => filterAndSortFoodsByRelevance(
      newHabituelNote,
      foods.map((food) => ({ id: food.id, name: food.name })),
    ),
    [foods, newHabituelNote],
  )

  const selectedExistingHabituelFood = useMemo(() => {
    if (newHabituelFoodId) {
      return foods.find((food) => food.id === newHabituelFoodId) ?? null
    }

    const normalized = normalizeText(newHabituelNote)
    if (!normalized) return null

    return foods.find((food) => equalsNormalizedText(food.name, normalized)) ?? null
  }, [foods, newHabituelFoodId, newHabituelNote])

  const cellierFoodOptions = useMemo(
    () => filterAndSortFoodsByRelevance(
      newCellierNote,
      foods.map((food) => ({ id: food.id, name: food.name })),
    ),
    [foods, newCellierNote],
  )

  const selectedHabituelItems = useMemo(
    () => habituelsItems.filter((item) => selectedHabituelIds.has(item.id)),
    [habituelsItems, selectedHabituelIds],
  )

  const handleViewRecipe = async (recipeName: string) => {
    let slug = recipeSlugStore.lookup(recipeName)
    if (!slug) {
      const results = await getRecipesUseCase.execute(1, 5, { search: recipeName })
      const match = results.items.find((recipe) => equalsNormalizedText(recipe.name, recipeName))
      if (match) {
        slug = match.slug
        recipeSlugStore.set(recipeName, slug)
      }
    }
    if (slug) setPreviewSlug(slug)
  }

  const handleAddItem = async (event: React.FormEvent) => {
    event.preventDefault()
    const note = newItemNote.trim()
    if (!note) return
    try {
      await addItemActions.submitAddItem(note, newItemQty, newItemLabelId || undefined)
      setNewItemNote("")
      setNewItemQty(1)
      setNewItemLabelId("")
      labelManuallySetRef.current = false
    } finally {
      setTimeout(() => newItemInputRef.current?.focus(), 0)
    }
  }

  const handleItemLabelChange = (labelId: string) => {
    labelManuallySetRef.current = true
    setNewItemLabelId(labelId)
  }

  const handleAddHabituel = async (event: React.FormEvent) => {
    event.preventDefault()
    const note = newHabituelNote.trim()
    if (!note) return

    const exactFood =
      (newHabituelFoodId ? foods.find((food) => food.id === newHabituelFoodId) : undefined) ??
      foods.find((food) => equalsNormalizedText(food.name, note))

    await addHabituelActions.submitAddHabituel({
      name: exactFood?.name ?? note,
      labelId: newHabituelLabelId || undefined,
      foodId: exactFood?.id,
    })

    setNewHabituelNote("")
    setNewHabituelLabelId("")
    setNewHabituelFoodId(undefined)
  }

  const handleAddCellier = async (event: React.FormEvent) => {
    event.preventDefault()
    const note = newCellierNote.trim()
    if (!note) return

    const exactFood =
      (newCellierFoodId ? foods.find((food) => food.id === newCellierFoodId) : undefined) ??
      foods.find((food) => equalsNormalizedText(food.name, note))

    await addCellierActions.submitAddCellier({
      name: exactFood?.name ?? note,
      quantity: newCellierQty,
      unitId: newCellierUnitId || undefined,
      foodId: exactFood?.id,
    })

    setNewCellierNote("")
    setNewCellierFoodId(undefined)
    setNewCellierQty(1)
    setNewCellierUnitId("")
  }

  const handleDeductFromCellier = async () => {
    if (!list) return
    setDeductingCellier(true)
    setDeductionSummary([])
    const summaries: string[] = []

    try {
      if (hasCellierAnnotations) {
        for (const shoppingItem of items) {
          const rollback = resolveCellierRollback(shoppingItem.note)
          if (!rollback) continue

          const nextQuantity = rollback.mode === "partial"
            ? (shoppingItem.quantity ?? 0) + rollback.quantity
            : shoppingItem.quantity

          await shoppingRepository.updateItem(
            list.id,
            buildShoppingItemUpdatePayload(list.id, shoppingItem, {
              checked: rollback.mode === "full" ? false : shoppingItem.checked,
              quantity: nextQuantity,
              note: rollback.noteWithoutDeduction,
              display: shoppingItem.display ?? undefined,
            }),
          )

          const itemName = shoppingItem.food?.name ?? shoppingItem.display ?? shoppingItem.note ?? "Article"
          summaries.push(
            rollback.mode === "full"
              ? `${itemName} : annotation cellier retiree et article decoche`
              : `${itemName} : ${formatQuantityWithUnit(rollback.quantity, rollback.unitName)} re-ajoute a la liste`,
          )
        }

        await reload()
        setDeductionSummary(summaries)
        return
      }

      for (const shoppingItem of items) {
        const shoppingQty = shoppingItem.quantity ?? 0
        if (shoppingQty <= 0) continue

        const pantryMatch = cellierItems.find((cellierItem) => {
          const sameFoodId = shoppingItem.food?.id && cellierItem.food?.id && shoppingItem.food.id === cellierItem.food.id
          const sameKey =
            extractFoodKey(shoppingItem.food?.name ?? shoppingItem.note ?? "") ===
            extractFoodKey(cellierItem.food?.name ?? cellierItem.note ?? "")
          const sameUnitId = (shoppingItem.unit?.id ?? "") === (cellierItem.unit?.id ?? "")
          const sameUnitName =
            shoppingItem.unit?.name && cellierItem.unit?.name
              ? equalsNormalizedText(shoppingItem.unit.name, cellierItem.unit.name)
              : !shoppingItem.unit?.name && !cellierItem.unit?.name

          return (sameFoodId || sameKey) && (sameUnitId || sameUnitName)
        })

        if (!pantryMatch) continue

        const pantryQty = pantryMatch.quantity ?? 0
        if (pantryQty <= 0) continue

        const coveredQuantity = Math.min(shoppingQty, pantryQty)
        const fullyCovered = pantryQty >= shoppingQty
        const unitName = shoppingItem.unit?.name ?? pantryMatch.unit?.name ?? undefined
        const nextQty = fullyCovered ? shoppingQty : shoppingQty - coveredQuantity
        const nextDisplay = shoppingItem.food
          ? (shoppingItem.display ?? undefined)
          : (shoppingItem.display ?? shoppingItem.note ?? undefined)

        await shoppingRepository.updateItem(
          list.id,
          buildShoppingItemUpdatePayload(list.id, shoppingItem, {
            checked: fullyCovered ? true : shoppingItem.checked,
            quantity: nextQty,
            note: appendCellierDeductionToNote(
              shoppingItem.note,
              buildCellierDeductionNote(fullyCovered ? "full" : "partial", coveredQuantity, unitName),
            ),
            display: nextDisplay,
          }),
        )

        const itemName = shoppingItem.food?.name ?? shoppingItem.display ?? shoppingItem.note ?? "Article"
        summaries.push(
          fullyCovered
            ? `${itemName} : quantite reduite de ${shoppingQty} a 0 (stock suffisant)`
            : `${itemName} : quantite reduite de ${shoppingQty} a ${nextQty} (stock partiellement suffisant)`,
        )
      }

      await reload()
      setDeductionSummary(summaries)
    } finally {
      setDeductingCellier(false)
    }
  }

  const handleSelectHabituel = (itemId: string, selected: boolean) => {
    setSelectedHabituelIds((previousIds) => {
      const nextIds = new Set(previousIds)
      if (selected) nextIds.add(itemId)
      else nextIds.delete(itemId)
      return nextIds
    })
  }

  const handleAddSelectedHabituels = async (
    selections: Array<{ item: ShoppingItem; quantity: number; unitId?: string; note?: string }>,
  ) => {
    await addHabituelActions.withSelectedHabituels(async () => {
      await addHabituelSelectionToCart(selections)
    })
    setSelectedHabituelIds(new Set())
    setAddHabituelDialogOpen(false)
  }

  const handleConfirmAction = async () => {
    if (confirmationAction === "clear-list") {
      await clearList("all")
    } else if (confirmationAction === "clear-habituels") {
      await deleteAllHabituels()
    } else if (confirmationAction === "clear-cellier") {
      await deleteAllCellier()
    }

    setConfirmationAction(null)
  }

  const confirmationCopy = confirmationAction === "clear-list"
    ? {
      title: "Vider toute la liste ?",
      description: "Tous les articles de la liste de courses actuelle seront supprimes. Cette action est irreversible.",
      action: "Tout vider",
    }
    : confirmationAction === "clear-habituels"
      ? {
        title: "Supprimer tous les habituels ?",
        description: "Tous les elements de la section Habituels seront supprimes. Cette action est irreversible.",
        action: "Tout supprimer",
      }
      : confirmationAction === "clear-cellier"
        ? {
          title: "Vider tout le cellier ?",
          description: "Tous les elements en stock dans le cellier seront supprimes. Cette action est irreversible.",
          action: "Tout vider",
        }
        : null

  return {
    newItemNote,
    setNewItemNote,
    newItemQty,
    setNewItemQty,
    newItemLabelId,
    setNewItemLabelId,
    handleItemLabelChange,
    newHabituelNote,
    setNewHabituelNote,
    newHabituelLabelId,
    setNewHabituelLabelId,
    newHabituelFoodId,
    setNewHabituelFoodId,
    newCellierNote,
    setNewCellierNote,
    newCellierFoodId,
    setNewCellierFoodId,
    newCellierQty,
    setNewCellierQty,
    newCellierUnitId,
    setNewCellierUnitId,
    addingItem: addItemActions.addingItem,
    addingHabituel: addHabituelActions.addingHabituel,
    addingSelectedHabituels: addHabituelActions.addingSelectedHabituels,
    addingCellier: addCellierActions.addingCellier,
    deductingCellier,
    deductionSummary,
    selectedHabituelItems,
    addHabituelDialogOpen,
    setAddHabituelDialogOpen,
    confirmationAction,
    setConfirmationAction,
    previewSlug,
    setPreviewSlug,
    newItemInputRef,
    sortedLabels,
    checkedCount,
    totalCount,
    progressPct,
    hasCellierAnnotations,
    habituelFoodOptions,
    selectedExistingHabituelFood,
    cellierFoodOptions,
    removeItem: removeItemActions.removeItem,
    editItemQuantity: editItemActions.editItemQuantity,
    editItemNote: editItemActions.editItemNote,
    handleViewRecipe,
    handleAddItem,
    handleAddHabituel,
    handleAddCellier,
    handleDeductFromCellier,
    handleSelectHabituel,
    handleAddSelectedHabituels,
    handleConfirmAction,
    confirmationCopy,
    removeHabituel: removeHabituelActions.removeHabituel,
    editHabituelNote: editHabituelActions.editHabituelNote,
    removeCellier: removeCellierActions.removeCellier,
    editCellierQuantity: editCellierActions.editCellierQuantity,
  }
}
