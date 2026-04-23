export interface MealieRecipeTool {
  id: string
  groupId?: string | null
  name: string
  slug: string
  householdsWithTool?: string[]
}

export interface MealieRecipeToolCreate {
  name: string
  householdsWithTool?: string[]
}

export interface MealieRecipeToolPagination {
  page?: number
  per_page?: number
  perPage?: number
  total?: number
  total_pages?: number
  totalPages?: number
  items: MealieRecipeTool[]
  next?: string | null
  previous?: string | null
}

export type MealieToolInput = MealieRecipeToolCreate

export interface MealiePaginatedTools extends MealieRecipeToolPagination {
  page: number
  perPage: number
  total: number
  totalPages: number
}

export interface MealieRawPaginatedTools extends MealieRecipeToolPagination {
  page: number
  per_page: number
  total: number
  total_pages: number
}
