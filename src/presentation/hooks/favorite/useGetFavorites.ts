import { useState, useCallback } from "react"
import { getFavoritesUseCase } from "@/infrastructure/container.ts"
import type { MealieUserRatingsUserRatingOut } from "@/shared/types/mealie/User.ts"

import {
    getFavoriteCache,
    isFavoriteCacheValid,
    setFavoriteCache,
} from "../../cache/favoriteCache.ts"

export function useGetFavorites() {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const getFavorites = useCallback(async (): Promise<MealieUserRatingsUserRatingOut> => {
        setError(null)

        if (isFavoriteCacheValid()) {
            return getFavoriteCache() as MealieUserRatingsUserRatingOut
        }

        setLoading(true)

        try {
            const data = await getFavoritesUseCase.execute()
            setFavoriteCache(data)

            return data
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Impossible de récupérer les favoris.",
            )

            return { ratings: [] }
        } finally {
            setLoading(false)
        }
    }, [])

    return { getFavorites, loading, error }
}
