import { useCallback, useEffect, useMemo, useState } from "react"
import {
  createCategoryUseCase,
  deleteCategoryUseCase,
  getRecipeUseCase,
  getRecipesUseCase,
  getCategoriesUseCase,
  getPaginatedCategoriesUseCase,
  updateCategoriesUseCase,
  updateCategoryUseCase,
} from "@/infrastructure/container.ts"
import type { MealieRecipeOutput } from "@/shared/types/mealie/Recipes.ts"
import type { MealieRecipeCategory } from "@/shared/types/mealie/Category.ts"
import { fetchAllRecipes } from "@/shared/utils/recipe.ts"

function sortCategoriesByName(categories: MealieRecipeCategory[]) {
  return [...categories].sort((a, b) => a.name.localeCompare(b.name, "fr", { sensitivity: "base" }))
}

async function updateRecipeCategoriesAfterMerge(
  recipeSlug: string,
  winnerCategory: MealieRecipeCategory,
  loserCategory: MealieRecipeCategory,
) {
  const recipe = await getRecipeUseCase.execute(recipeSlug)
  const remainingCategories = (recipe.recipeCategory ?? []).filter(
    (category) => category.id !== winnerCategory.id && category.id !== loserCategory.id,
  )
  const nextCategories = [...remainingCategories, winnerCategory]
  await updateCategoriesUseCase.execute(recipe.slug, nextCategories)
}

type CategorySortKey = "name"
type SortDirection = "asc" | "desc"

export function useCategoryManagement(
  search: string,
  perPage: number,
  _sortKey: CategorySortKey,
  sortDirection: SortDirection,
) {
  const [page, setPage] = useState(1)
  const [allCategories, setAllCategories] = useState<MealieRecipeCategory[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const categories = await getCategoriesUseCase.execute()
      setAllCategories(categories)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de charger les categories.")
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

  const filteredCategories = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return allCategories
    return allCategories.filter((category) => category.name.toLowerCase().includes(query))
  }, [allCategories, search])

  const sortedFilteredCategories = useMemo(() => {
    return [...filteredCategories].sort((left, right) => {
      const comparison = left.name.localeCompare(right.name, "fr", { sensitivity: "base" })
      return sortDirection === "asc" ? comparison : -comparison
    })
  }, [filteredCategories, sortDirection])

  const total = sortedFilteredCategories.length
  const totalPages = total > 0 ? Math.ceil(total / perPage) : 0
  const safePage = totalPages > 0 ? Math.min(page, totalPages) : 1
  const startIndex = (safePage - 1) * perPage
  const categories = sortedFilteredCategories.slice(startIndex, startIndex + perPage)

  const runCategoryMutation = useCallback(async <T>(
    action: () => Promise<T>,
    fallbackMessage: string,
  ): Promise<T> => {
    setSaving(true)
    setError(null)

    try {
      return await action()
    } catch (err) {
      const message = err instanceof Error ? err.message : fallbackMessage
      setError(message)
      throw err instanceof Error ? err : new Error(message)
    } finally {
      setSaving(false)
    }
  }, [])

  const createCategory = useCallback(async (name: string) => {
    await runCategoryMutation(async () => {
      const created = await createCategoryUseCase.execute({ name: name.trim() })
      if (created) {
        setAllCategories((prev) => sortCategoriesByName([...prev, created]))
      } else {
        const latest = await getPaginatedCategoriesUseCase.execute(1, 1, undefined, "created_at", "desc")
        const latestItem = latest.items[0]
        if (latestItem) {
          setAllCategories((prev) =>
            sortCategoriesByName([latestItem, ...prev.filter((entry) => entry.id !== latestItem.id)]),
          )
        } else {
          await load()
        }
      }
    }, "Impossible d'ajouter la categorie.")
  }, [load, runCategoryMutation])

  const updateCategory = useCallback(async (category: MealieRecipeCategory, name: string) => {
    await runCategoryMutation(async () => {
      const updated = await updateCategoryUseCase.execute(category.id, { name: name.trim() })
      setAllCategories((prev) =>
        sortCategoriesByName(prev.map((entry) => (entry.id === category.id ? updated : entry))),
      )
    }, "Impossible de modifier la categorie.")
  }, [runCategoryMutation])

  const deleteCategory = useCallback(async (categoryId: string) => {
    await runCategoryMutation(async () => {
      await deleteCategoryUseCase.execute(categoryId)
      setAllCategories((prev) => prev.filter((entry) => entry.id !== categoryId))
    }, "Impossible de supprimer la categorie.")
  }, [runCategoryMutation])

  const deleteCategories = useCallback(async (categoryIds: string[]) => {
    await runCategoryMutation(async () => {
      for (const categoryId of categoryIds) {
        await deleteCategoryUseCase.execute(categoryId)
      }
      const ids = new Set(categoryIds)
      setAllCategories((prev) => prev.filter((entry) => !ids.has(entry.id)))
    }, "Impossible de supprimer les categories selectionnees.")
  }, [runCategoryMutation])

  const getCategoryRecipes = useCallback(async (categorySlug: string): Promise<MealieRecipeOutput[]> => {
    return fetchAllRecipes(
      (page, pageSize, filters) => getRecipesUseCase.execute(page, pageSize, filters),
      {
        categories: [categorySlug],
        orderBy: "createdAt",
        orderDirection: "desc",
      },
    )
  }, [])

  const mergeCategories = useCallback(async (winnerCategoryId: string, loserCategoryId: string) => {
    await runCategoryMutation(async () => {
      if (winnerCategoryId === loserCategoryId) {
        throw new Error("Choisis deux categories differentes pour la fusion.")
      }

      const winnerCategory = allCategories.find((category) => category.id === winnerCategoryId)
      const loserCategory = allCategories.find((category) => category.id === loserCategoryId)

      if (!winnerCategory || !loserCategory) {
        throw new Error("Impossible de retrouver les categories a fusionner.")
      }

      const recipes = await getCategoryRecipes(loserCategory.slug)

      for (const recipeSummary of recipes) {
        await updateRecipeCategoriesAfterMerge(recipeSummary.slug, winnerCategory, loserCategory)
      }

      await deleteCategoryUseCase.execute(loserCategory.id)
      setAllCategories((prev) => sortCategoriesByName(prev.filter((category) => category.id !== loserCategory.id)))
    }, "Impossible de fusionner les categories selectionnees.")
  }, [allCategories, getCategoryRecipes, runCategoryMutation])

  const mergeSelectedCategories = useCallback(async (categoryIds: string[], winnerCategoryId: string) => {
    const losingCategoryIds = categoryIds.filter((categoryId) => categoryId !== winnerCategoryId)
    for (const losingCategoryId of losingCategoryIds) {
      await mergeCategories(winnerCategoryId, losingCategoryId)
    }
  }, [mergeCategories])

  useEffect(() => {
    if (page > 1 && totalPages > 0 && page > totalPages) {
      setPage(totalPages)
    }
  }, [page, totalPages])

  return {
    allCategories,
    categories,
    total,
    page: safePage,
    totalPages,
    loading,
    saving,
    error,
    setPage,
    createCategory,
    updateCategory,
    deleteCategory,
    deleteCategories,
    getCategoryRecipes,
    mergeCategories,
    mergeSelectedCategories,
  }
}
