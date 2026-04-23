import { useCallback, useEffect, useMemo, useState } from "react"
import {
  createTagUseCase,
  deleteTagUseCase,
  getRecipeUseCase,
  getRecipesUseCase,
  getPaginatedTagsUseCase,
  getTagsUseCase,
  updateRecipeTagsUseCase,
  updateTagUseCase,
} from "@/infrastructure/container.ts"
import type { MealieRecipeOutput } from "@/shared/types/mealie/Recipes.ts"
import type { MealieRecipeTag } from "@/shared/types/mealie/Tags.ts"
import { isCalorieTag } from "@/shared/utils/calorie.ts"
import { isSeasonTag } from "@/shared/utils/season.ts"
import { fetchAllRecipes } from "@/shared/utils/recipe.ts"

function sortTagsByName(tags: MealieRecipeTag[]) {
  return [...tags].sort((a, b) => a.name.localeCompare(b.name, "fr", { sensitivity: "base" }))
}

type TagSortKey = "name"
type SortDirection = "asc" | "desc"

export function useTagManagement(
  search: string,
  perPage: number,
  _sortKey: TagSortKey,
  sortDirection: SortDirection,
) {
  const [page, setPage] = useState(1)
  const [allTags, setAllTags] = useState<MealieRecipeTag[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const tags = await getTagsUseCase.execute()
      setAllTags(tags)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de charger les tags.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    setPage(1)
  }, [search, perPage])

  const filteredTags = useMemo(() => {
    const visibleTags = allTags.filter((tag) => !isSeasonTag(tag) && !isCalorieTag(tag))
    const query = search.trim().toLowerCase()
    if (!query) return visibleTags
    return visibleTags.filter((tag) => tag.name.toLowerCase().includes(query))
  }, [allTags, search])

  const sortedFilteredTags = useMemo(() => {
    return [...filteredTags].sort((left, right) => {
      const comparison = left.name.localeCompare(right.name, "fr", { sensitivity: "base" })
      return sortDirection === "asc" ? comparison : -comparison
    })
  }, [filteredTags, sortDirection])

  const total = sortedFilteredTags.length
  const totalPages = total > 0 ? Math.ceil(total / perPage) : 0
  const safePage = totalPages > 0 ? Math.min(page, totalPages) : 1
  const startIndex = (safePage - 1) * perPage
  const tags = sortedFilteredTags.slice(startIndex, startIndex + perPage)

  const createTag = useCallback(async (name: string) => {
    setSaving(true)
    setError(null)
    try {
      const created = await createTagUseCase.execute({ name: name.trim() })
      if (created) {
        setAllTags((prev) => sortTagsByName([...prev, created]))
      } else {
        const latest = await getPaginatedTagsUseCase.execute(1, 1, undefined, "created_at", "desc")
        const latestItem = latest.items[0]
        if (latestItem) {
          setAllTags((prev) =>
            sortTagsByName([latestItem, ...prev.filter((entry) => entry.id !== latestItem.id)]),
          )
        } else {
          await load()
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Impossible d'ajouter le tag."
      setError(message)
      throw err instanceof Error ? err : new Error(message)
    } finally {
      setSaving(false)
    }
  }, [load])

  const updateTag = useCallback(async (tag: MealieRecipeTag, name: string) => {
    setSaving(true)
    setError(null)
    try {
      const updated = await updateTagUseCase.execute(tag.id, { name: name.trim() })
      setAllTags((prev) => sortTagsByName(prev.map((entry) => (entry.id === tag.id ? updated : entry))))
    } catch (err) {
      const message = err instanceof Error ? err.message : "Impossible de modifier le tag."
      setError(message)
      throw err instanceof Error ? err : new Error(message)
    } finally {
      setSaving(false)
    }
  }, [])

  const deleteTag = useCallback(async (tagId: string) => {
    setSaving(true)
    setError(null)
    try {
      await deleteTagUseCase.execute(tagId)
      setAllTags((prev) => prev.filter((entry) => entry.id !== tagId))
    } catch (err) {
      const message = err instanceof Error ? err.message : "Impossible de supprimer le tag."
      setError(message)
      throw err instanceof Error ? err : new Error(message)
    } finally {
      setSaving(false)
    }
  }, [])

  const deleteTags = useCallback(async (tagIds: string[]) => {
    setSaving(true)
    setError(null)
    try {
      for (const tagId of tagIds) {
        await deleteTagUseCase.execute(tagId)
      }
      const ids = new Set(tagIds)
      setAllTags((prev) => prev.filter((entry) => !ids.has(entry.id)))
    } catch (err) {
      const message = err instanceof Error ? err.message : "Impossible de supprimer les tags selectionnes."
      setError(message)
      throw err instanceof Error ? err : new Error(message)
    } finally {
      setSaving(false)
    }
  }, [])

  const getTagRecipes = useCallback(async (tagSlug: string): Promise<MealieRecipeOutput[]> => {
    return fetchAllRecipes(
      (page, perPage, filters) => getRecipesUseCase.execute(page, perPage, filters),
      {
        tags: [tagSlug],
        orderBy: "createdAt",
        orderDirection: "desc",
      },
    )
  }, [])

  const removeTagFromRecipes = useCallback(async (tag: MealieRecipeTag, recipeSlugs: string[]) => {
    setSaving(true)
    setError(null)
    try {
      for (const recipeSlug of recipeSlugs) {
        const recipe = await getRecipeUseCase.execute(recipeSlug)
        const nextTags = (recipe.tags ?? []).filter((entry) => entry.id !== tag.id)
        await updateRecipeTagsUseCase.execute(recipeSlug, nextTags)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Impossible de retirer ce tag des recettes selectionnees."
      setError(message)
      throw err instanceof Error ? err : new Error(message)
    } finally {
      setSaving(false)
    }
  }, [])

  const mergeTags = useCallback(async (selectedTags: MealieRecipeTag[], winnerTagId: string) => {
    setSaving(true)
    setError(null)

    try {
      const winnerTag = selectedTags.find((tag) => tag.id === winnerTagId)
      if (!winnerTag) {
        throw new Error("Tag principal introuvable.")
      }

      const losingTags = selectedTags.filter((tag) => tag.id !== winnerTagId)
      const selectedIds = new Set(selectedTags.map((tag) => tag.id))

      const recipeLists = await Promise.all(
        selectedTags.map((tag) => getTagRecipes(tag.slug)),
      )

      const recipeSlugs = [...new Set(recipeLists.flat().map((recipe) => recipe.slug).filter(Boolean))]

      for (const recipeSlug of recipeSlugs) {
        const recipe = await getRecipeUseCase.execute(recipeSlug)
        const remainingTags = (recipe.tags ?? []).filter((tag) => !selectedIds.has(tag.id))
        const nextTags = [...remainingTags, winnerTag]
        await updateRecipeTagsUseCase.execute(recipeSlug, nextTags)
      }

      for (const losingTag of losingTags) {
        await deleteTagUseCase.execute(losingTag.id)
      }

      const losingIds = new Set(losingTags.map((tag) => tag.id))
      setAllTags((prev) => sortTagsByName(prev.filter((tag) => !losingIds.has(tag.id))))
    } catch (err) {
      const message = err instanceof Error ? err.message : "Impossible de fusionner les tags selectionnes."
      setError(message)
      throw err instanceof Error ? err : new Error(message)
    } finally {
      setSaving(false)
    }
  }, [getTagRecipes])

  useEffect(() => {
    if (page > 1 && totalPages > 0 && page > totalPages) {
      setPage(totalPages)
    }
  }, [page, totalPages])

  return {
    tags,
    filteredTags,
    total,
    page: safePage,
    perPage,
    totalPages,
    loading,
    saving,
    error,
    setPage,
    createTag,
    updateTag,
    deleteTag,
    deleteTags,
    getTagRecipes,
    removeTagFromRecipes,
    mergeTags,
  }
}
