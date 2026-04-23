import type { MealieShoppingItem, MealieShoppingLabel } from "@/shared/types/mealie/Shopping.ts"

export type ShoppingItem = MealieShoppingItem
export type ShoppingLabel = MealieShoppingLabel

export interface ShoppingList {
  id: string
  name: string
  labels: ShoppingLabel[]
}
