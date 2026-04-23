export interface MealieCategoryIn {
  name: string
}

export interface MealieCategorySummary {
  id: string
  slug: string
  name: string
}

export interface MealieRecipeCategory {
  id: string
  groupId?: string | null
  name: string
  slug: string
}

export interface MealieRecipeCategoryPagination {
  page?: number
  per_page?: number
  perPage?: number
  total?: number
  total_pages?: number
  totalPages?: number
  items: MealieRecipeCategory[]
  next?: string | null
  previous?: string | null
}

export type MealieCategory = MealieRecipeCategory
export type MealieCategoryInput = MealieCategoryIn

export interface MealiePaginatedCategory extends MealieRecipeCategoryPagination {
  page: number
  perPage: number
  total: number
  totalPages: number
}

export interface MealieRawPaginatedCategory extends MealieRecipeCategoryPagination {
  page: number
  per_page: number
  total: number
  total_pages: number
}
