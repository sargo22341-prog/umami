import type { IShoppingRepository, ShoppingListsBundle } from "@/domain/shopping/repositories/IShoppingRepository.ts"
import type { ShoppingItem, ShoppingLabel, ShoppingList } from "@/domain/shopping/entities/ShoppingItem.ts"
import type {
  MealieShoppingItemsCollectionOut,
  MealieShoppingListItemCreate,
  MealieShoppingListItemUpdateBulk,
  MealieShoppingList,
  MealieRawPaginatedShoppingLists,
} from "@/shared/types/mealie/Shopping.ts"
import { mealieApiClient } from "../api/index.ts"

const DEFAULT_LIST_NAME = "umami"
const HABITUELS_LIST_NAME = "Habituels"
const CELLIER_LIST_NAME = "Cellier"

export class ShoppingRepository implements IShoppingRepository {
  private async getOrCreateList(name: string, allLists?: MealieRawPaginatedShoppingLists): Promise<ShoppingList> {
    const raw = allLists ?? await mealieApiClient.get<MealieRawPaginatedShoppingLists>(
      "/api/households/shopping/lists?page=1&perPage=-1",
    )
  
    const existing = raw.items.find((l) => l.name === name)

    if (existing) {
      return { id: existing.id, name: existing.name ?? name, labels: [] }
    }

    const created = await mealieApiClient.post<{ id: string; name: string }>(
      "/api/households/shopping/lists",
      { name },
    )
    return { id: created.id, name: created.name, labels: [] }
  }

  async getOrCreateDefaultList(): Promise<ShoppingList> {
    return this.getOrCreateList(DEFAULT_LIST_NAME)
  }

  async getOrCreateHabituelsList(): Promise<ShoppingList> {
    return this.getOrCreateList(HABITUELS_LIST_NAME)
  }

  async getOrCreateCellierList(): Promise<ShoppingList> {
    return this.getOrCreateList(CELLIER_LIST_NAME)
  }

  async getOrCreateSystemLists(): Promise<ShoppingListsBundle> {
    const allLists = await mealieApiClient.get<MealieRawPaginatedShoppingLists>(
      "/api/households/shopping/lists?page=1&perPage=-1",
    )

    const [defaultList, habituelsList, cellierList] = await Promise.all([
      this.getOrCreateList(DEFAULT_LIST_NAME, allLists),
      this.getOrCreateList(HABITUELS_LIST_NAME, allLists),
      this.getOrCreateList(CELLIER_LIST_NAME, allLists),
    ])

    return {
      defaultList,
      habituelsList,
      cellierList,
    }
  }

  async getItems(listId: string): Promise<{ items: ShoppingItem[]; labels: ShoppingLabel[] }> {
    const raw = await mealieApiClient.get<MealieShoppingList>(`/api/households/shopping/lists/${listId}`)
    const labels: ShoppingLabel[] = (raw.labelSettings ?? []).map((setting) => setting.label)
    return {
      items: raw.listItems ?? [],
      labels,
    }
  }

  async addItem(listId: string, data: MealieShoppingListItemCreate): Promise<void> {
    await mealieApiClient.post(
      "/api/households/shopping/items/create-bulk",
      [{ ...data, shoppingListId: listId }],
    )
  }

  async addItems(listId: string, items: MealieShoppingListItemCreate[]): Promise<void> {
    if (items.length === 0) return
    await mealieApiClient.post(
      "/api/households/shopping/items/create-bulk",
      items.map((item) => ({ ...item, shoppingListId: listId })),
    )
  }

  async updateItem(_listId: string, item: MealieShoppingListItemUpdateBulk): Promise<ShoppingItem> {
    const raw = await mealieApiClient.put<MealieShoppingItemsCollectionOut | null>(
      "/api/households/shopping/items",
      [item],
    )
    const updated = raw?.updatedItems?.[0] ?? raw?.createdItems?.[0]
    if (updated) return updated

    const list = await mealieApiClient.get<MealieShoppingList>(`/api/households/shopping/lists/${item.shoppingListId}`)
    const refetched = (list.listItems ?? []).find((entry) => entry.id === item.id)
    if (refetched) return refetched

    throw new Error(`Impossible de retrouver l'article Mealie ${item.id} après mise à jour`)
  }

  async deleteItem(_listId: string, itemId: string): Promise<void> {
    await mealieApiClient.delete(`/api/households/shopping/items?ids=${itemId}`)
  }

  async deleteCheckedItems(_listId: string, items: ShoppingItem[]): Promise<void> {
    const ids = items.filter((i) => i.checked).map((i) => i.id)
    if (!ids.length) return
    const query = ids.map((id) => `ids=${id}`).join("&")
    await mealieApiClient.delete(`/api/households/shopping/items?${query}`)
  }

  async deleteAllItems(_listId: string, items: ShoppingItem[]): Promise<void> {
    const ids = items.map((i) => i.id)
    if (!ids.length) return
    const query = ids.map((id) => `ids=${id}`).join("&")
    await mealieApiClient.delete(`/api/households/shopping/items?${query}`)
  }
}
