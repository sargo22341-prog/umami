import type { IShoppingRepository } from "@/domain/shopping/repositories/IShoppingRepository.ts"
import type { ShoppingItem } from "@/domain/shopping/entities/ShoppingItem.ts"

export class ToggleItemUseCase {
  private repository: IShoppingRepository

  constructor(repository: IShoppingRepository) {
    this.repository = repository
  }

  async execute(listId: string, item: ShoppingItem): Promise<ShoppingItem> {
    return this.repository.updateItem(listId, {
      id: item.id,
      shoppingListId: listId,
      checked: !item.checked,
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
    })
  }
}
