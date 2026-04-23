import type { ShoppingItem, ShoppingLabel, ShoppingList } from "../entities/ShoppingItem.ts"
import type { MealieShoppingListItemCreate, MealieShoppingListItemUpdateBulk } from "@/shared/types/mealie/Shopping.ts"

export interface ShoppingListsBundle {
  defaultList: ShoppingList
  habituelsList: ShoppingList
  cellierList: ShoppingList
}

export interface IShoppingRepository {
  /** Fetches or creates the system shopping lists used by the app */
  getOrCreateSystemLists(): Promise<ShoppingListsBundle>

  /** Fetches or creates the default shopping list */
  getOrCreateDefaultList(): Promise<ShoppingList>

  /** Fetches or creates the "Habituels" shopping list */
  getOrCreateHabituelsList(): Promise<ShoppingList>

  /** Fetches or creates the "Cellier" shopping list */
  getOrCreateCellierList(): Promise<ShoppingList>

  /** Fetches all items and available labels from a list */
  getItems(listId: string): Promise<{ items: ShoppingItem[]; labels: ShoppingLabel[] }>

  /** Adds a free-text item */
  addItem(listId: string, data: MealieShoppingListItemCreate): Promise<void>

  /** Adds multiple items in a single bulk call */
  addItems(listId: string, items: MealieShoppingListItemCreate[]): Promise<void>

  /** Checks or unchecks an item */
  updateItem(listId: string, item: MealieShoppingListItemUpdateBulk): Promise<ShoppingItem>

  /** Deletes an item */
  deleteItem(listId: string, itemId: string): Promise<void>

  /** Deletes all checked items */
  deleteCheckedItems(listId: string, items: ShoppingItem[]): Promise<void>

  /** Deletes all items */
  deleteAllItems(listId: string, items: ShoppingItem[]): Promise<void>
}
