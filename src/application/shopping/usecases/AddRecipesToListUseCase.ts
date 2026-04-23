import type { IShoppingRepository } from "@/domain/shopping/repositories/IShoppingRepository.ts"
import type { IUnitRepository } from "@/domain/units/IUnitRepository.ts"
import type { MealieShoppingListItemCreate } from "@/shared/types/mealie/Shopping.ts"
import type { MealieRecipeOutput } from "@/shared/types/mealie/Recipes.ts"
import { recipeSlugStore } from "@/infrastructure/shopping/RecipeSlugStore.ts"
import { scaleRecipeIngredientQuantity } from "@/shared/utils/recipeServings.ts"
import { convertToStandardUnit } from "@/shared/utils/unitStandardization.ts"

export interface RecipeCartSelection {
  recipe: MealieRecipeOutput
  portions: number
  selectedIngredientIndexes: number[]
}

export class AddRecipesToListUseCase {
  private repository: IShoppingRepository
  private unitRepository: IUnitRepository

  constructor(repository: IShoppingRepository, unitRepository: IUnitRepository) {
    this.repository = repository
    this.unitRepository = unitRepository
  }

  async execute(listId: string, entries: RecipeCartSelection[]): Promise<void> {
    const availableUnits = await this.unitRepository.getAll()

    for (const entry of entries) {
      if (entry.recipe.name && entry.recipe.slug) {
        recipeSlugStore.set(entry.recipe.name, entry.recipe.slug)
      }
    }

    const items = entries
      .flatMap((entry) => {
        const ingredients = entry.recipe.recipeIngredient ?? []

        return entry.selectedIngredientIndexes.flatMap((index) => {
          const ingredient = ingredients[index]
          if (!ingredient) return []

          const scaledQuantity = scaleRecipeIngredientQuantity(
            ingredient.quantity ?? undefined,
            entry.recipe,
            entry.portions,
          )
          const standardized = convertToStandardUnit(ingredient, scaledQuantity, availableUnits)

          const item: MealieShoppingListItemCreate = {
            shoppingListId: listId,
            quantity: standardized.quantity,
            foodId: ingredient.food?.id ?? undefined,
            unitId: standardized.unitId,
            unit: standardized.unit ?? undefined,
            note: ingredient.note || undefined,
            display: ingredient.display || undefined,
            recipeReferences: [
              {
                recipeId: entry.recipe.id ?? "",
                recipeQuantity: entry.portions,
                recipeScale: entry.portions || undefined,
                recipeNote: entry.recipe.name ?? undefined,
              },
            ],
          }

          return item.recipeReferences?.[0]?.recipeId ? [item] : []
        })
      })

    if (items.length === 0) return

    await this.repository.addItems(listId, items)
  }
}
