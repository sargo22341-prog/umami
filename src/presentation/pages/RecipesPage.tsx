// React
import { useEffect, useMemo, useRef, useState } from "react"

// Router
import { useNavigate } from "react-router-dom"

// Icons (lucide)
import {
  Loader2, AlertCircle, UtensilsCrossed, Plus, PenLine,
} from "lucide-react"

// Hooks - Recipes
import { useRecipesInfinite, useRecipesPageFilters } from "hooks/recipes"

// Hooks - Organizer
import { useCategories, useFoods, useTags, useTools } from "hooks/organizer"

// Hooks - UI / Components
import { useGridColumns } from "hooks/common/useGridColumns.ts"
import { useRecipeDrawerState } from "hooks/componentsRecipe/useRecipeDrawerState.ts"

// Utils
import { cn } from "@/lib/utils.ts"

// Shared utils
import { getCaloriesFromTags, getRecipeSeasonsFromTags, formatDurationToNumber, normalizeText } from "@/shared/utils"

// Components - Recipes
import { RecipeFilters, RecipeCard } from "components/recipes"

// Components - Common
import { RecipeDrawer } from "components/common/recipe/RecipeDrawer.tsx"

// UI Components
import { Button } from "components/ui"


export function RecipesPage() {
  const [recipesRefreshSeed] = useState(() => Date.now().toString())
  const { columns, setColumns, min: minColumns, max: maxColumns } = useGridColumns()
  const navigate = useNavigate()
  const { selectedSlug, drawerClosing, closeDrawer, selectSlug } = useRecipeDrawerState()

  const sentinelRef = useRef<HTMLDivElement>(null)
  const recipeAreaTouchRef = useRef<{ x: number; y: number } | null>(null)

  const { categories } = useCategories()
  const { foods } = useFoods()
  const { tags } = useTags()
  const { tools } = useTools()
  const {
    search, setSearch, selectedCategories, selectedFoods, selectedTags, selectedTools, selectedSeasons,
    maxTotalTime, maxCalories, orderBy, setOrderBy, orderDirection, setOrderDirection, filtersOpen,
    setFiltersOpen, hasActiveFilters, resetFilters, toggleCategory, toggleFood, toggleTag, toggleTool,
    toggleSeason, handleTimeFilter, handleCaloriesFilter, foodSearch, setFoodSearch, tagSearch, setTagSearch, normalizedSearch,
  } = useRecipesPageFilters([])

  const { recipes, loading, error, hasMore, loadMore } = useRecipesInfinite(
    {
      search: normalizedSearch, categories: selectedCategories, foods: selectedFoods,
      tags: selectedTags, tools: selectedTools, orderBy, orderDirection, paginationSeed: recipesRefreshSeed,
    })

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
  }, [maxCalories, maxTotalTime, normalizedSearch, recipes, selectedSeasons, selectedTags])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMore()
        }
      },
      { threshold: 0.1 },
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasMore, loading, loadMore])

  const handleRecipeAreaTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    if (!filtersOpen || window.innerWidth >= 768) return
    const touch = event.touches[0]
    recipeAreaTouchRef.current = { x: touch.clientX, y: touch.clientY }
  }

  const handleRecipeAreaTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (!filtersOpen || window.innerWidth >= 768 || !recipeAreaTouchRef.current) {
      recipeAreaTouchRef.current = null
      return
    }

    const touch = event.changedTouches[0]
    const deltaY = touch.clientY - recipeAreaTouchRef.current.y
    const deltaX = touch.clientX - recipeAreaTouchRef.current.x
    const isUpwardSwipe = deltaY < -24 && Math.abs(deltaY) > Math.abs(deltaX)

    if (isUpwardSwipe) {
      setFiltersOpen(false)
    }

    recipeAreaTouchRef.current = null
  }

  return (
    <div className="space-y-5">
      {/* ── En-tête sticky ── */}
      <div
        className={cn(
          "sticky top-0 z-10 -mx-4 -mt-5 md:-mx-7 md:-mt-7",
          "bg-background/95 backdrop-blur-md",
          "px-4 pt-5 md:px-7 md:pt-6 pb-4",
          "border-b border-border/40",
        )}
      >
        {/* Ligne titre */}
        <div className="flex items-center justify-between mb-4 gap-3">
          <div className="flex items-baseline gap-2.5">
            <h1 className="font-heading text-2xl font-bold">Mes recettes </h1>
            {filteredRecipes.length > 0 && (
              <span
                className={cn(
                  "rounded-full px-2 py-0.5",
                  "text-[11px] font-bold text-muted-foreground",
                  "bg-secondary",
                )}
              >
                {filteredRecipes.length}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Slider colonnes */}
            <div
              className={cn(
                "flex items-center gap-2 rounded-[var(--radius-lg)]",
                "border border-border bg-card px-2.5 py-1.5",
                "shadow-subtle",
              )}
            >
              <input
                type="range"
                min={minColumns}
                max={maxColumns}
                step={1}
                value={columns}
                onChange={(e) => setColumns(Number(e.target.value))}
                aria-label="Nombre de colonnes"
                className="w-20 accent-primary cursor-pointer"
              />
              <span className="text-xs font-semibold tabular-nums text-muted-foreground select-none w-3">
                {columns}
              </span>
            </div>

            {/* Importer depuis Mealie */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => navigate("/explore")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-[var(--radius-lg)]",
                "border border-border bg-card px-3 py-1.5",
                "text-sm font-semibold text-muted-foreground",
                "shadow-subtle",
                "hover:bg-secondary hover:text-foreground hover:border-border",
                "transition-all duration-150",
              )}
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Importer</span>
            </Button>

            {/* Nouvelle recette */}
            <Button
              size="sm"
              onClick={() => navigate("/recipes/new")}
              className="gap-1.5"
            >
              <PenLine className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Nouvelle recette</span>
            </Button>
          </div>
        </div>

        {/* Barre de filtres */}

        <RecipeFilters
          search={search}
          setSearch={setSearch}

          orderBy={orderBy}
          setOrderBy={setOrderBy}

          orderDirection={orderDirection}
          setOrderDirection={setOrderDirection}

          filtersOpen={filtersOpen}
          setFiltersOpen={setFiltersOpen}

          hasActiveFilters={hasActiveFilters}
          resetFilters={resetFilters}

          categories={categories}
          foods={foods}
          tags={tags}
          tools={tools}

          selectedCategories={selectedCategories}
          toggleCategory={toggleCategory}

          selectedFoods={selectedFoods}
          toggleFood={toggleFood}

          selectedTags={selectedTags}
          toggleTag={toggleTag}

          selectedTools={selectedTools}
          toggleTool={toggleTool}

          selectedSeasons={selectedSeasons}
          toggleSeason={toggleSeason}

          maxTotalTime={maxTotalTime}
          handleTimeFilter={handleTimeFilter}

          maxCalories={maxCalories}
          handleCaloriesFilter={handleCaloriesFilter}

          foodSearch={foodSearch}
          setFoodSearch={setFoodSearch}

          tagSearch={tagSearch}
          setTagSearch={setTagSearch}
        />
      </div>

      <div onTouchStart={handleRecipeAreaTouchStart} onTouchEnd={handleRecipeAreaTouchEnd}>
        {/* Erreur */}
        {error && (
          <div className="flex items-center gap-3 rounded-[var(--radius-xl)] border border-destructive/20 bg-destructive/8 p-4 text-destructive">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* État vide */}
        {!loading && !error && filteredRecipes.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-24 text-muted-foreground">
            <div className={cn(
              "flex h-16 w-16 items-center justify-center rounded-[var(--radius-2xl)]",
              "bg-secondary",
            )}>
              <UtensilsCrossed className="h-7 w-7 text-muted-foreground/60" />
            </div>
            <p className="text-sm font-semibold">Aucune recette trouvée</p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="mt-1 text-sm text-primary underline underline-offset-2 hover:opacity-80 transition-opacity"
              >
                Effacer les filtres
              </button>
            )}
          </div>
        )}

        {/* Grille */}
        {filteredRecipes.length > 0 && (
          <div
            className="grid gap-3"
            style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
          >
            {filteredRecipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                selected={recipe.slug === selectedSlug}
                onSelect={selectSlug}
              />
            ))}
          </div>
        )}

        <div ref={sentinelRef} className="h-4" />

        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-7 w-7 animate-spin text-muted-foreground/50" />
          </div>
        )}

        {/* Drawer latéral */}
      </div>

      {selectedSlug !== null && (
        <>
          {/* Backdrop */}
          <div
            className={cn(
              "fixed inset-0 z-40 min-h-screen",
              "bg-foreground/15 backdrop-blur-[2px]",
              drawerClosing ? "animate-fade-out" : "animate-fade-in",
            )}
            onClick={closeDrawer}
          />
          <RecipeDrawer
            slug={selectedSlug}
            allCategories={categories}
            closing={drawerClosing}
            onClose={closeDrawer}
          />
        </>
      )}

    </div>
  )
}
