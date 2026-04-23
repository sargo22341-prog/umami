export interface MealieIngredientFoodAlias {
  name: string
}

export interface MealieIngredientFoodInput {
  id: string
  name: string
  pluralName?: string | null
  description?: string
  extras?: Record<string, unknown> | null
  labelId?: string | null
  aliases?: MealieIngredientFoodAlias[]
  householdsWithIngredientFood?: string[]
  label?: MealieMultiPurposeLabelSummary | null
  createdAt?: string | null
  update_at?: string | null
}

export interface MealieIngredientFoodOutput {
  id: string
  name: string
  pluralName?: string | null
  description?: string
  extras?: Record<string, unknown> | null
  labelId?: string | null
  aliases?: MealieIngredientFoodAlias[]
  householdsWithIngredientFood?: string[]
  label?: MealieMultiPurposeLabelSummary | null
  createdAt?: string | null
  updatedAt?: string | null
}

export interface MealieCreateIngredientFood {
  id?: string | null
  name: string
  pluralName?: string | null
  description?: string
  extras?: Record<string, unknown> | null
  labelId?: string | null
  aliases?: MealieIngredientFoodAlias[]
  householdsWithIngredientFood?: string[]
}

export interface MealieIngredientFoodPagination {
  page?: number
  per_page?: number
  perPage?: number
  total?: number
  total_pages?: number
  totalPages?: number
  items: MealieIngredientFoodOutput[]
  next?: string | null
  previous?: string | null
}

export interface MealieMergeFood {
  fromFood: string
  toFood: string
}

import type { MealieMultiPurposeLabelSummary } from "./Labels.ts"

export type MealieFoodAlias = MealieIngredientFoodAlias
export type MealieFood = MealieIngredientFoodOutput
export type MealieFoodInput = MealieCreateIngredientFood
export type MealieMergeFoodInput = MealieMergeFood

export interface MealiePaginatedFoods extends MealieIngredientFoodPagination {
  page: number
  perPage: number
  total: number
  totalPages: number
}

export interface MealieRawPaginatedFoods extends MealieIngredientFoodPagination {
  page: number
  per_page: number
  total: number
  total_pages: number
}
