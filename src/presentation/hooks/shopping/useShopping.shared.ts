import type { ShoppingItem, ShoppingLabel } from "@/domain/shopping/entities/ShoppingItem.ts"
import type { MealieShoppingListItemUpdateBulk } from "@/shared/types/mealie/Shopping.ts"
import type { MealieIngredientUnitOutput } from "@/shared/types/mealie/Units.ts"

export function itemDisplayName(item: ShoppingItem): string {
  return item.food?.name ?? item.note ?? item.display ?? ""
}

export function buildUpdatePayload(
  listId: string,
  item: ShoppingItem,
  overrides: Partial<MealieShoppingListItemUpdateBulk> = {},
): MealieShoppingListItemUpdateBulk {
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

export function findUnitById(
  units: MealieIngredientUnitOutput[],
  unitId?: string,
): MealieIngredientUnitOutput | null {
  if (!unitId) {
    return null
  }

  return units.find((unit) => unit.id === unitId) ?? null
}

export function updateItemFoodMetadata(
  item: ShoppingItem,
  nextName: string,
  nextLabelId: string | null,
  nextLabel: ShoppingLabel | undefined,
): ShoppingItem {
  if (item.food) {
    return {
      ...item,
      food: {
        ...item.food,
        name: nextName,
        labelId: nextLabelId,
        label: nextLabel ?? null,
      },
      label: nextLabel,
    }
  }

  return item
}
