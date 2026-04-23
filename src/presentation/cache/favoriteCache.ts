import type { MealieUserRatingsUserRatingOut } from "@/shared/types/mealie/User.ts"

let cache: MealieUserRatingsUserRatingOut | null = null
let lastFetch = 0

const TTL = 15 * 60 * 1000 // 15 minutes

export function getFavoriteCache() {
  return cache
}

export function isFavoriteCacheValid() {
  return cache !== null && Date.now() - lastFetch < TTL
}

export function setFavoriteCache(data: MealieUserRatingsUserRatingOut) {
  cache = data
  lastFetch = Date.now()
}

export function invalidateFavoriteCache() {
  cache = null
  lastFetch = 0
}