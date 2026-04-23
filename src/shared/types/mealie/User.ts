export interface MealieUserOut {
  id: string
  username?: string | null
  fullName?: string | null
  email: string
  authMethod?: string
  admin?: boolean
  group: string
  household: string
  advanced?: boolean
  canInvite?: boolean
  canManage?: boolean
  canManageHousehold?: boolean
  canOrganize?: boolean
  groupId: string
  groupSlug: string
  householdId: string
  householdSlug: string
  tokens?: unknown[] | null
  cacheKey: string
}

export interface MealieUserBaseInput {
  id?: string | null
  username?: string | null
  fullName?: string | null
  email: string
  authMethod?: string
  admin?: boolean
  group?: string | null
  household?: string | null
  advanced?: boolean
  canInvite?: boolean
  canManage?: boolean
  canManageHousehold?: boolean
  canOrganize?: boolean
}

export interface MealieUserRatingOut {
  recipeId: string
  rating?: number | null
  isFavorite?: boolean
  userId: string
  id: string
}

export interface MealieUserRatingSummary {
  recipeId: string
  rating?: number | null
  isFavorite?: boolean
}

export interface MealieUserRatingsUserRatingOut {
  ratings: MealieUserRatingOut[]
}

export interface MealieUserRatingsUserRatingSummary {
  ratings: MealieUserRatingSummary[]
}

export type MealieUserProfile = MealieUserOut
export type MealieUserUpdateInput = MealieUserBaseInput
export type MealieFavorite = MealieUserRatingOut
export type MealieFavoritesResponse = MealieUserRatingsUserRatingOut
