import type { MealieRecipeSummary } from "./Recipes.ts"

export type MealiePlanEntryType =
  | "breakfast"
  | "lunch"
  | "dinner"
  | "side"
  | "snack"
  | "drink"
  | "dessert"

export interface MealieCreatePlanEntry {
  date: string
  entryType?: MealiePlanEntryType
  title?: string
  text?: string
  recipeId?: string | null
}

export interface MealieReadPlanEntry {
  date: string
  entryType?: MealiePlanEntryType
  title?: string
  text?: string
  recipeId?: string | null
  id: number
  groupId: string
  userId: string
  householdId: string
  recipe?: MealieRecipeSummary | null
}

export interface MealiePlanEntryPagination {
  page?: number
  per_page?: number
  perPage?: number
  total?: number
  total_pages?: number
  totalPages?: number
  items: MealieReadPlanEntry[]
  next?: string | null
  previous?: string | null
}

export type MealEntryType = MealiePlanEntryType
export type MealieMealPlan = MealieReadPlanEntry
export type MealieRawPaginatedMealPlans = MealiePlanEntryPagination
