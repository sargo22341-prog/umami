import type { MealieRecipeSummary } from "./Recipes.ts"

export interface MealieTagIn {
  name: string
}

export interface MealieRecipeTag {
  id: string
  groupId?: string | null
  name: string
  slug: string
}

export interface MealieRecipeTagResponse {
  name: string
  id: string
  groupId?: string | null
  slug: string
  recipes?: MealieRecipeSummary[]
}

export interface MealieRecipeTagPagination {
  page?: number
  per_page?: number
  perPage?: number
  total?: number
  total_pages?: number
  totalPages?: number
  items: MealieRecipeTag[]
  next?: string | null
  previous?: string | null
}

export type MealieTag = MealieRecipeTag
export type MealieTagDetails = MealieRecipeTagResponse
export type MealieTagInput = MealieTagIn

export interface MealiePaginatedTags extends MealieRecipeTagPagination {
  page: number
  perPage: number
  total: number
  totalPages: number
}

export interface MealieRawPaginatedTags extends MealieRecipeTagPagination {
  page: number
  per_page: number
  total: number
  total_pages: number
}
