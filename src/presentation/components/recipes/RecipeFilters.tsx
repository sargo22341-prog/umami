import { Search, X, RotateCcw } from "lucide-react"

// component Ui
import { Badge, Button, Input } from "components/ui"

// utils
import { cn } from "@/lib/utils"
import { isSeasonTag, isCalorieTag, filterAndSortFoodsByRelevance } from "@/shared/utils"

// types
import { SEASONS, SEASON_LABELS, type Season } from "@/shared/types/Season.ts"
import type { MealieRecipeTool } from "@/shared/types/mealie/Tools.ts"
import type { MealieRecipeTag } from "@/shared/types/mealie/Tags.ts"
import type { MealieIngredientFoodOutput } from "@/shared/types/mealie/food.ts"
import type { MealieRecipeCategory } from "@/shared/types/mealie/Category.ts"

const TIME_OPTIONS = [
  { label: "< 15 min", value: 15 },
  { label: "< 30 min", value: 30 },
  { label: "< 45 min", value: 45 },
  { label: "< 1h", value: 60 },
  { label: "1h+", value: undefined },
] as const

const CALORIES_OPTIONS = [
  { label: "Sans calories", value: 0 },
  { label: "< 200 kcal", value: 200 },
  { label: "< 400 kcal", value: 400 },
  { label: "< 600 kcal", value: 600 },
  { label: "< 800 kcal", value: 800 },
] as const

type Props = {
  search: string
  setSearch: (v: string) => void

  orderBy: string
  setOrderBy: (v: string) => void

  orderDirection: "asc" | "desc"
  setOrderDirection: (v: "asc" | "desc") => void

  filtersOpen: boolean
  setFiltersOpen: (v: boolean) => void

  hasActiveFilters: boolean
  resetFilters: () => void

  categories: MealieRecipeCategory[]
  foods: MealieIngredientFoodOutput[]
  tags: MealieRecipeTag[]
  tools: MealieRecipeTool[]

  selectedCategories: string[]
  toggleCategory: (slug: string) => void

  selectedFoods: string[]
  toggleFood: (id: string) => void

  selectedTags: string[]
  toggleTag: (slug: string) => void

  selectedTools: string[]
  toggleTool: (slug: string) => void

  selectedSeasons: Season[]
  toggleSeason: (season: Season) => void

  maxTotalTime?: number
  handleTimeFilter: (value: number | undefined) => void

  maxCalories?: number
  handleCaloriesFilter: (value: number | undefined) => void

  foodSearch: string
  setFoodSearch: (v: string) => void

  tagSearch: string
  setTagSearch: (v: string) => void
}

export function RecipeFilters({
  search,
  setSearch,
  orderBy,
  setOrderBy,
  orderDirection,
  setOrderDirection,
  filtersOpen,
  setFiltersOpen,
  hasActiveFilters,
  resetFilters,
  categories,
  foods,
  tags,
  tools,
  selectedCategories,
  toggleCategory,
  selectedFoods,
  toggleFood,
  selectedTags,
  toggleTag,
  selectedTools,
  toggleTool,
  selectedSeasons,
  toggleSeason,
  maxTotalTime,
  handleTimeFilter,
  maxCalories,
  handleCaloriesFilter,
  foodSearch,
  setFoodSearch,
  tagSearch,
  setTagSearch,
}: Props) {
  const visibleFoods = filterAndSortFoodsByRelevance(
    foodSearch,
    foods.map((food) => ({ id: food.id, name: food.name })),
  )

  const visibleTags = filterAndSortFoodsByRelevance(
    tagSearch,
    tags
      .filter((tag) => !isSeasonTag(tag))
      .filter((tag) => !isCalorieTag(tag))
      .map((tag) => ({ id: tag.id, name: tag.name })),
  )

  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/60" />
          <Input
            placeholder="Rechercher une recette..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-9"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <select
          value={orderBy}
          onChange={(e) => setOrderBy(e.target.value)}
          className="h-9 rounded-[var(--radius-lg)] border border-border bg-background px-3 text-xs text-foreground outline-none transition-colors hover:bg-secondary"
        >
          <option value="createdAt">Création</option>
          <option value="updatedAt">Modification</option>
          <option value="name">Nom</option>
          <option value="rating">Note</option>
          <option value="totalTime">Temps total</option>
          <option value="prepTime">Préparation</option>
          <option value="performTime">Cuisson</option>
          <option value="random">Aléatoire</option>
        </select>

        <button
          type="button"
          onClick={() => setOrderDirection(orderDirection === "asc" ? "desc" : "asc")}
          className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-lg)] border border-border bg-background transition-colors hover:bg-secondary"
          title={orderDirection === "asc" ? "Ascendant" : "Descendant"}
        >
          <span className="text-xs">{orderDirection === "asc" ? "↑" : "↓"}</span>
        </button>

        <Button
          size="sm"
          type="button"
          onClick={() => setFiltersOpen(!filtersOpen)}
          className="gap-1.5"
          aria-expanded={filtersOpen}
          aria-controls="recipes-filters-panel"
        >
          Filtres
        </Button>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className={cn(
              "shrink-0 flex items-center gap-1",
              "text-xs text-muted-foreground transition-colors hover:text-foreground",
            )}
          >
            <RotateCcw className="h-3 w-3" />
          </button>
        )}
      </div>

      {filtersOpen && (
        <div id="recipes-filters-panel" className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="flex flex-col gap-2">
              <div className="text-xs font-medium text-muted-foreground">Saison</div>
              <div className="flex min-w-0 items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
                {SEASONS.map((season: Season) => {
                  const active = selectedSeasons.includes(season)
                  return (
                    <Badge
                      key={season}
                      variant={active ? "default" : "outline"}
                      className="shrink-0 cursor-pointer whitespace-nowrap"
                      onClick={() => toggleSeason(season)}
                    >
                      {SEASON_LABELS[season]}
                    </Badge>
                  )
                })}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="text-xs font-medium text-muted-foreground">Temps de préparation</div>
              <div className="flex min-w-0 items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
                {TIME_OPTIONS.filter((opt) => opt.value !== undefined).map((opt) => {
                  const active = maxTotalTime === opt.value
                  return (
                    <Badge
                      key={opt.label}
                      variant={active ? "default" : "outline"}
                      className="shrink-0 cursor-pointer whitespace-nowrap"
                      onClick={() => handleTimeFilter(opt.value)}
                    >
                      {opt.label}
                    </Badge>
                  )
                })}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="text-xs font-medium text-muted-foreground">Calories</div>
              <div className="flex min-w-0 items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
                {CALORIES_OPTIONS.map((opt) => {
                  const active = maxCalories === opt.value
                  return (
                    <Badge
                      key={opt.value}
                      variant={active ? "default" : "outline"}
                      className="shrink-0 cursor-pointer whitespace-nowrap"
                      onClick={() => handleCaloriesFilter(opt.value)}
                    >
                      {opt.label}
                    </Badge>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="flex flex-col gap-1">
              <div className="text-xs font-medium text-muted-foreground">Catégories</div>
              <div className="flex min-w-0 items-center gap-2 overflow-x-auto scrollbar-hide px-2 py-1">
                <div className="flex min-w-max items-center gap-2">
                  {categories.map((cat) => {
                    const active = selectedCategories.includes(cat.slug)
                    return (
                      <Badge
                        key={cat.id}
                        variant={active ? "default" : "outline"}
                        className="shrink-0 cursor-pointer whitespace-nowrap"
                        onClick={() => toggleCategory(cat.slug)}
                      >
                        {cat.name}
                      </Badge>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <div className="text-xs font-medium text-muted-foreground">Ustensiles</div>
              <div className="flex min-w-0 items-center gap-2 overflow-x-auto scrollbar-hide px-2 py-1">
                <div className="flex min-w-max items-center gap-2">
                  {tools.map((tool) => {
                    const active = selectedTools.includes(tool.slug)
                    return (
                      <Badge
                        key={tool.id}
                        variant={active ? "default" : "outline"}
                        className="shrink-0 cursor-pointer whitespace-nowrap"
                        onClick={() => toggleTool(tool.slug)}
                      >
                        {tool.name}
                      </Badge>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="text-xs font-medium text-muted-foreground">Ingrédients</div>
            <div className="flex items-start gap-2 px-2 py-1">
              <div className="shrink-0">
                <input
                  value={foodSearch}
                  onChange={(e) => setFoodSearch(e.target.value)}
                  placeholder="Rechercher un ingrédient..."
                  className="h-7 w-[176px] rounded-full border border-border bg-background px-3 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="min-w-0 flex-1 overflow-x-auto scrollbar-hide">
                <div className="flex min-w-max items-center gap-2">
                  {visibleFoods.map((food) => {
                    const active = selectedFoods.includes(food.id)
                    return (
                      <Badge
                        key={food.id}
                        variant={active ? "default" : "outline"}
                        className="shrink-0 cursor-pointer whitespace-nowrap"
                        onClick={() => toggleFood(food.id)}
                      >
                        {food.label}
                      </Badge>
                    )
                  })}

                  {visibleFoods.length === 0 && (
                    <span className="text-xs text-muted-foreground">Aucun ingrédient trouvé</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="text-xs font-medium text-muted-foreground">Tags</div>
            <div className="flex items-start gap-2 px-2 py-1">
              <div className="shrink-0">
                <input
                  value={tagSearch}
                  onChange={(e) => setTagSearch(e.target.value)}
                  placeholder="Rechercher..."
                  className="h-7 w-[156px] rounded-full border border-border bg-background px-3 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="min-w-0 flex-1 overflow-x-auto scrollbar-hide">
                <div className="flex min-w-max items-center gap-2">
                  {visibleTags.map((tag) => {
                    const tagData = tags.find((entry) => entry.id === tag.id)
                    if (!tagData) return null
                    const active = selectedTags.includes(tagData.slug)
                    return (
                      <Badge
                        key={tag.id}
                        variant={active ? "default" : "outline"}
                        className="shrink-0 cursor-pointer whitespace-nowrap"
                        onClick={() => toggleTag(tagData.slug)}
                      >
                        {tag.label}
                      </Badge>
                    )
                  })}

                  {visibleTags.length === 0 && (
                    <span className="text-xs text-muted-foreground">Aucun tag trouvé</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
