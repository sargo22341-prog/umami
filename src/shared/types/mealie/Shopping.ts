import type { MealieMultiPurposeLabelSummary } from "./Labels.ts"
import type { MealieRecipeInput, MealieRecipeOutput, MealieRecipeSummary } from "./Recipes.ts"
import type { MealieCreateIngredientFood, MealieIngredientFoodInput, MealieIngredientFoodOutput } from "./food.ts"
import type { MealieCreateIngredientUnit, MealieIngredientUnitInput, MealieIngredientUnitOutput } from "./Units.ts"

export interface MealieShoppingListItemRecipeRefCreate {
  recipeId: string
  recipeQuantity?: number
  recipeScale?: number | null
  recipeNote?: string | null
}

export interface MealieShoppingListItemRecipeRefUpdate {
  recipeId: string
  recipeQuantity?: number
  recipeScale?: number | null
  recipeNote?: string | null
  id: string
  shoppingListItemId: string
}

export interface MealieShoppingListItemRecipeRefOut {
  recipeId: string
  recipeQuantity?: number
  recipeScale?: number | null
  recipeNote?: string | null
  id: string
  shoppingListItemId: string
}

export interface MealieShoppingListRecipeRefOut {
  id: string
  shoppingListId: string
  recipeId: string
  recipeQuantity: number
  recipe: MealieRecipeSummary
}

export interface MealieShoppingListMultiPurposeLabelOut {
  shoppingListId: string
  labelId: string
  position?: number
  id: string
  label: MealieMultiPurposeLabelSummary
}

export interface MealieShoppingListItemCreate {
  quantity?: number
  unit?: MealieIngredientUnitInput | MealieCreateIngredientUnit | null
  food?: MealieIngredientFoodInput | MealieCreateIngredientFood | null
  referencedRecipe?: MealieRecipeInput | null
  note?: string | null
  display?: string
  shoppingListId: string
  checked?: boolean
  position?: number
  foodId?: string | null
  labelId?: string | null
  unitId?: string | null
  extras?: Record<string, unknown> | null
  id?: string | null
  recipeReferences?: MealieShoppingListItemRecipeRefCreate[]
}

export interface MealieShoppingListItemUpdate {
  quantity?: number
  unit?: MealieIngredientUnitInput | MealieCreateIngredientUnit | null
  food?: MealieIngredientFoodInput | MealieCreateIngredientFood | null
  referencedRecipe?: MealieRecipeInput | null
  note?: string | null
  display?: string
  shoppingListId: string
  checked?: boolean
  position?: number
  foodId?: string | null
  labelId?: string | null
  unitId?: string | null
  extras?: Record<string, unknown> | null
  recipeReferences?: Array<MealieShoppingListItemRecipeRefCreate | MealieShoppingListItemRecipeRefUpdate>
}

export interface MealieShoppingListItemUpdateBulk extends MealieShoppingListItemUpdate {
  id: string
}

export interface MealieShoppingListItemOutOutput {
  quantity?: number
  unit?: MealieIngredientUnitOutput | null
  food?: MealieIngredientFoodOutput | null
  referencedRecipe?: MealieRecipeOutput | null
  note?: string | null
  display?: string
  shoppingListId: string
  checked?: boolean
  position?: number
  foodId?: string | null
  labelId?: string | null
  unitId?: string | null
  extras?: Record<string, unknown> | null
  id: string
  groupId: string
  householdId: string
  label?: MealieMultiPurposeLabelSummary | null
  recipeReferences?: MealieShoppingListItemRecipeRefOut[]
  createdAt?: string | null
  updatedAt?: string | null
}

export interface MealieShoppingListItemsCollectionOut {
  createdItems?: MealieShoppingListItemOutOutput[]
  updatedItems?: MealieShoppingListItemOutOutput[]
  deletedItems?: MealieShoppingListItemOutOutput[]
}

export interface MealieShoppingListSummary {
  name?: string | null
  extras?: Record<string, unknown> | null
  createdAt?: string | null
  updatedAt?: string | null
  groupId: string
  userId: string
  id: string
  householdId: string
  recipeReferences: MealieShoppingListRecipeRefOut[]
  labelSettings: MealieShoppingListMultiPurposeLabelOut[]
}

export interface MealieShoppingListOut {
  name?: string | null
  extras?: Record<string, unknown> | null
  createdAt?: string | null
  updatedAt?: string | null
  groupId: string
  userId: string
  id: string
  listItems?: MealieShoppingListItemOutOutput[]
  householdId: string
  recipeReferences?: MealieShoppingListRecipeRefOut[]
  labelSettings?: MealieShoppingListMultiPurposeLabelOut[]
}

export interface MealieShoppingListPagination {
  page?: number
  per_page?: number
  perPage?: number
  total?: number
  total_pages?: number
  totalPages?: number
  items: MealieShoppingListSummary[]
  next?: string | null
  previous?: string | null
}

export type MealieShoppingLabel = MealieMultiPurposeLabelSummary
export type MealieShoppingItemRecipeRef = MealieShoppingListItemRecipeRefOut
export type MealieShoppingList = MealieShoppingListOut
export type MealieShoppingItem = MealieShoppingListItemOutOutput
export type MealieShoppingItemCreate = MealieShoppingListItemCreate
export type MealieShoppingItemUpdate = MealieShoppingListItemUpdateBulk
export type MealieShoppingItemsCollectionOut = MealieShoppingListItemsCollectionOut

export interface MealieRawPaginatedShoppingLists extends MealieShoppingListPagination {
  page: number
  per_page: number
  total: number
  total_pages: number
}

export interface MealieRawPaginatedShoppingItems extends MealieShoppingListPagination {
  page: number
  per_page: number
  total: number
  total_pages: number
}
