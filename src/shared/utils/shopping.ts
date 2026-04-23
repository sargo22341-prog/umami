import type { ShoppingItem } from "@/domain/shopping/entities/ShoppingItem.ts"

export function formatQuantity(value: number): string {
  if (!Number.isFinite(value)) return "0"
  return value.toFixed(2).replace(/\.?0+$/, "")
}

export function formatQuantityWithUnit(quantity: number, unitName?: string | null): string {
  const normalizedUnitName = unitName?.trim()
  return normalizedUnitName ? `${formatQuantity(quantity)} ${normalizedUnitName}` : formatQuantity(quantity)
}

export function buildShoppingItemUpdatePayload(
  listId: string,
  item: ShoppingItem,
  overrides: {
    checked?: boolean
    quantity?: number
    note?: string
    display?: string
  } = {},
) {
  return {
    id: item.id,
    shoppingListId: listId,
    checked: item.checked,
    position: item.position,
    note: item.note,
    quantity: item.quantity,
    foodId: item.food?.id,
    unitId: item.unit?.id,
    recipeReferences: item.recipeReferences?.flatMap((reference) => (
      reference.recipeId ? [{ recipeId: reference.recipeId }] : []
    )),
    labelId: item.label?.id,
    display: item.display,
    ...overrides,
  }
}
