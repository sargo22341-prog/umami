import type { IShoppingRepository } from "@/domain/shopping/repositories/IShoppingRepository.ts"

export class DeleteItemUseCase {
  private repository: IShoppingRepository

  constructor(repository: IShoppingRepository) {
    this.repository = repository
  }

  async execute(listId: string, itemId: string): Promise<void> {
    return this.repository.deleteItem(listId, itemId)
  }
}
