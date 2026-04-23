import { useMemo, useState } from "react"

import type { Season } from "@/shared/types/Season.ts"
import { getCaloriesFromTags } from "@/shared/utils/calorie.ts"
import { formatDurationToNumber } from "@/shared/utils/duration.ts"
import { toggleValueInArray } from "@/shared/utils/array.ts"
import { normalizeText } from "@/shared/utils/text.ts"
import { getRecipeSeasonsFromTags } from "@/shared/utils/season.ts"
import type { MealieRecipeOutput } from "@/shared/types/mealie/Recipes.ts"

export function useRecipesPageFilters(recipes: MealieRecipeOutput[]) {
  const [search, setSearch] = useState("")
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedFoods, setSelectedFoods] = useState<string[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedTools, setSelectedTools] = useState<string[]>([])
  const [maxTotalTime, setMaxTotalTime] = useState<number | undefined>(undefined)
  const [maxCalories, setMaxCalories] = useState<number | undefined>(undefined)
  const [selectedSeasons, setSelectedSeasons] = useState<Season[]>([])
  const [orderBy, setOrderBy] = useState("createdAt")
  const [orderDirection, setOrderDirection] = useState<"asc" | "desc">("desc")
  const [foodSearch, setFoodSearch] = useState("")
  const [tagSearch, setTagSearch] = useState("")
  const [filtersOpen, setFiltersOpen] = useState(false)

  const normalizedSearch = useMemo(() => search.replace(/\s+/g, " ").trim(), [search])

  const toggleCategory = (slug: string) => setSelectedCategories((previous) => toggleValueInArray(previous, slug))
  const toggleTag = (slug: string) => setSelectedTags((previous) => toggleValueInArray(previous, slug))
  const toggleFood = (id: string) => setSelectedFoods((previous) => toggleValueInArray(previous, id))
  const toggleTool = (slug: string) => setSelectedTools((previous) => toggleValueInArray(previous, slug))
  const toggleSeason = (season: Season) => setSelectedSeasons((previous) => toggleValueInArray(previous, season))

  const handleTimeFilter = (value: number | undefined) => {
    setMaxTotalTime((previous) => (previous === value ? undefined : value))
  }

  const handleCaloriesFilter = (value: number | undefined) => {
    setMaxCalories((previous) => (previous === value ? undefined : value))
  }

  const hasActiveFilters =
    search.trim() !== "" ||
    selectedCategories.length > 0 ||
    selectedFoods.length > 0 ||
    selectedTags.length > 0 ||
    selectedTools.length > 0 ||
    maxTotalTime !== undefined ||
    maxCalories !== undefined ||
    selectedSeasons.length > 0

  const resetFilters = () => {
    setSearch("")
    setSelectedCategories([])
    setSelectedFoods([])
    setSelectedTags([])
    setSelectedTools([])
    setMaxTotalTime(undefined)
    setMaxCalories(undefined)
    setSelectedSeasons([])
  }

  const filteredRecipes = useMemo(() => {
    const normalizedQuery = normalizeText(normalizedSearch)
    const searchTerms = normalizedQuery
      .split(" ")
      .map((term) => term.trim())
      .filter((term) => term.length > 1)

    return recipes.filter((recipe) => {
      if (normalizedQuery) {
        const searchableText = normalizeText([
          recipe.name,
          recipe.description ?? "",
          recipe.slug ?? "",
        ].join(" "))
        const phraseMatches = searchableText.includes(normalizedQuery)
        const termsMatch = searchTerms.length > 0 && searchTerms.every((term) => searchableText.includes(term))

        if (!phraseMatches && !termsMatch) {
          return false
        }
      }

      if (selectedSeasons.length > 0) {
        const recipeSeasons = getRecipeSeasonsFromTags(recipe.tags)
        const hasNoSeason = recipeSeasons.length === 0
        const matchSeason = selectedSeasons.some((season) => {
          if (season === "sans") return hasNoSeason
          return recipeSeasons.includes(season)
        })
        if (!matchSeason) return false
      }

      if (selectedTags.length > 0) {
        const recipeTagSlugs = recipe.tags?.map((tag) => tag.slug) ?? []
        const hasTag = selectedTags.some((tag) => recipeTagSlugs.includes(tag))
        if (!hasTag) return false
      }

      if (maxTotalTime !== undefined) {
        const totalMinutes = formatDurationToNumber(recipe.totalTime)
        if (!totalMinutes || totalMinutes > maxTotalTime) return false
      }

      if (maxCalories !== undefined) {
        const calories = getCaloriesFromTags(recipe.tags)
        if (maxCalories === 0) {
          if (calories !== null) return false
        } else if (calories === null || calories > maxCalories) {
          return false
        }
      }

      return true
    })
  }, [
    maxCalories,
    maxTotalTime,
    normalizedSearch,
    recipes,
    selectedSeasons,
    selectedTags,
  ])

  return {
    search,
    setSearch,
    selectedCategories,
    selectedFoods,
    selectedTags,
    selectedTools,
    selectedSeasons,
    maxTotalTime,
    maxCalories,
    orderBy,
    setOrderBy,
    orderDirection,
    setOrderDirection,
    normalizedSearch,
    filteredRecipes,
    filtersOpen,
    setFiltersOpen,
    hasActiveFilters,
    resetFilters,
    toggleCategory,
    toggleFood,
    toggleTag,
    toggleTool,
    toggleSeason,
    handleTimeFilter,
    handleCaloriesFilter,
    foodSearch,
    setFoodSearch,
    tagSearch,
    setTagSearch,
  }
}
