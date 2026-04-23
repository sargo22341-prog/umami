export interface MealieUserBaseOutput {
  id: string
  username?: string | null
  admin: boolean
  fullName?: string | null
}

export interface MealieRecipeCommentOutInput {
  recipeId: string
  text: string
  id: string
  createdAt: string
  update_at: string
  userId: string
  user: MealieUserBaseOutput
}

export interface MealieRecipeCommentOutOutput {
  recipeId: string
  text: string
  id: string
  createdAt: string
  updatedAt: string
  userId: string
  user: MealieUserBaseOutput
}

export interface MealieRecipeCommentPagination {
  page?: number
  per_page?: number
  total?: number
  total_pages?: number
  items: MealieRecipeCommentOutOutput[]
  next?: string | null
  previous?: string | null
}

export type MealieRecipeCommentUser = MealieUserBaseOutput
export type MealieRecipeComment = MealieRecipeCommentOutOutput
