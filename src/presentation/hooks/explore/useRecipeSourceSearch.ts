import { useEffect, useMemo, useState } from "react"

import {
  DEFAULT_RECIPE_SEARCH_PROVIDER_ID,
  searchNextRecipesFromSource,
  searchRecipesFromSource,
} from "@/infrastructure/recipeSources/recipeSearchService.ts"
import {
  findExistingRecipesForSearchResults,
  type RecipeDuplicateMatch,
} from "@/infrastructure/recipeSources/recipeDuplicateDetectionService.ts"
import type {
  RecipeSourceProviderId,
  RecipeSourceRecipe,
} from "@/infrastructure/recipeSources/providers/types.ts"
import {
  getRecipeSourceProviderById,
  getRecipeSourceProviders,
} from "@/infrastructure/recipeSources/recipeSourceProviderRegistry.ts"

interface SearchHistoryEntry {
  page: number
  results: RecipeSourceRecipe[]
  nextPage: unknown
  hasMore: boolean
}

export function useRecipeSourceSearch() {
  const searchProviders = useMemo(() => getRecipeSourceProviders(), [])
  const [results, setResults] = useState<RecipeSourceRecipe[]>([])
  const [providerLoading, setProviderLoading] = useState(false)
  const [mealieLoading, setMealieLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searched, setSearched] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [nextPage, setNextPage] = useState<unknown>(null)
  const [activeQuery, setActiveQuery] = useState("")
  const [activeSource, setActiveSource] = useState<RecipeSourceProviderId>(DEFAULT_RECIPE_SEARCH_PROVIDER_ID)
  const [duplicateMatchesByKey, setDuplicateMatchesByKey] = useState<Record<string, RecipeDuplicateMatch | null>>({})
  const [, setPageHistory] = useState<SearchHistoryEntry[]>([])

  const searchSourceLabel = getRecipeSourceProviderById(activeSource)?.label ?? "Source externe"

  useEffect(() => {
    let cancelled = false

    if (results.length === 0) {
      setDuplicateMatchesByKey({})
      setMealieLoading(false)
      return () => {
        cancelled = true
      }
    }

    setMealieLoading(true)

    void findExistingRecipesForSearchResults(results)
      .then((matches) => {
        if (!cancelled) {
          setDuplicateMatchesByKey(matches)
          setMealieLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDuplicateMatchesByKey({})
          setMealieLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [results])

  const search = async (
    query: string,
    providerId: RecipeSourceProviderId = activeSource,
  ) => {
    const trimmedQuery = query.trim()
    if (!trimmedQuery) return

    setProviderLoading(true)
    setMealieLoading(false)
    setError(null)
    setResults([])
    setActiveSource(providerId)
    setCurrentPage(1)
    setHasMore(false)
    setNextPage(null)
    setDuplicateMatchesByKey({})
    setPageHistory([])

    try {
      const response = await searchRecipesFromSource(trimmedQuery, providerId)
      const firstPage: SearchHistoryEntry = {
        page: 1,
        results: response.results,
        nextPage: response.nextPage ?? null,
        hasMore: response.hasMore,
      }

      setResults(response.results)
      setHasMore(response.hasMore)
      setNextPage(response.nextPage ?? null)
      setCurrentPage(firstPage.page)
      setActiveQuery(trimmedQuery)
      setSearched(true)
      setPageHistory([firstPage])

      if (response.results.length === 0) {
        setError("Aucune recette trouvee pour cette recherche.")
      }
    } catch (searchError) {
      setError(searchError instanceof Error ? searchError.message : "Erreur lors de la recherche.")
    } finally {
      setProviderLoading(false)
    }
  }

  const goToPreviousPage = async () => {
    setPageHistory((previousHistory) => {
      if (previousHistory.length <= 1) return previousHistory

      const nextHistory = previousHistory.slice(0, -1)
      const previousEntry = nextHistory[nextHistory.length - 1]

      if (previousEntry) {
        setResults(previousEntry.results)
        setHasMore(previousEntry.hasMore)
        setNextPage(previousEntry.nextPage)
        setCurrentPage(previousEntry.page)
      }

      return nextHistory
    })
  }

  const goToNextPage = async () => {
    if (!nextPage) return

    setProviderLoading(true)
    setMealieLoading(false)
    setError(null)

    try {
      const response = await searchNextRecipesFromSource(nextPage, activeSource)
      const targetPage = currentPage + 1
      const nextHistoryEntry: SearchHistoryEntry = {
        page: targetPage,
        results: response.results,
        nextPage: response.nextPage ?? null,
        hasMore: response.hasMore,
      }

      setResults(response.results)
      setHasMore(response.hasMore)
      setNextPage(response.nextPage ?? null)
      setCurrentPage(targetPage)
      setPageHistory((previousHistory) => [...previousHistory, nextHistoryEntry])

      if (response.results.length === 0) {
        setError("Aucune recette trouvee pour cette recherche.")
      }
    } catch (searchError) {
      setError(searchError instanceof Error ? searchError.message : "Erreur lors de la recherche.")
    } finally {
      setProviderLoading(false)
    }
  }

  return {
    results,
    loading: providerLoading || mealieLoading,
    providerLoading,
    mealieLoading,
    error,
    searched,
    currentPage,
    hasMore,
    nextPage,
    activeQuery,
    activeSource,
    duplicateMatchesByKey,
    searchProviders,
    searchSourceLabel,
    search,
    goToPreviousPage,
    goToNextPage,
  }
}
