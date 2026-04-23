// Router
import { useNavigate } from "react-router-dom"

// Icons (lucide)
import {
  Search, X, Loader2, AlertCircle, Heart, PenLine,
  Plus, UtensilsCrossed,
} from "lucide-react"

// Hooks - Organizer
import { useCategories } from "hooks/organizer"

// Hooks - Favorite
import { useFavoriteRecipesPage } from "hooks/favorite/useFavoriteRecipesPage.ts"

// Hooks - UI / Components
import { useGridColumns } from "hooks/common/useGridColumns.ts"
import { useRecipeDrawerState } from "hooks/componentsRecipe/useRecipeDrawerState.ts"

// Utils
import { cn } from "@/lib/utils.ts"

// Shared utils
import { getEnv } from "@/shared/utils"

// Components - Recipes
import { RecipeCard } from "components/recipes"

// Components - Common
import { RecipeDrawer } from "components/common/recipe/RecipeDrawer.tsx"

// UI Components
import { Button, Input } from "components/ui"

export function FavoritesPage() {
  const navigate = useNavigate()
  const { categories } = useCategories()
  const { columns, setColumns, min: minColumns, max: maxColumns } = useGridColumns()
  const { search, setSearch, recipes, filteredRecipes, loading, error } = useFavoriteRecipesPage()
  const { selectedSlug, drawerClosing, closeDrawer, selectSlug } = useRecipeDrawerState()

  return (
    <div className="space-y-5">
      <div
        className={cn(
          "sticky top-0 z-10 -mx-4 -mt-5 md:-mx-7 md:-mt-7",
          "bg-background/95 backdrop-blur-md",
          "border-b border-border/40",
          "px-4 pb-4 pt-5 md:px-7 md:pt-6",
        )}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-baseline gap-2.5">
            <h1 className="font-heading text-2xl font-bold">Favoris</h1>
            {filteredRecipes.length > 0 && (
              <span
                className={cn(
                  "rounded-full bg-secondary px-2 py-0.5",
                  "text-[11px] font-bold text-muted-foreground",
                )}
              >
                {filteredRecipes.length}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div
              className={cn(
                "flex items-center gap-2 rounded-[var(--radius-lg)]",
                "border border-border bg-card px-2.5 py-1.5 shadow-subtle",
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
                className="w-20 cursor-pointer accent-primary"
              />
              <span className="w-3 select-none text-xs font-semibold tabular-nums text-muted-foreground">
                {columns}
              </span>
            </div>

            <a
              href={`${getEnv("VITE_MEALIE_URL").replace(/\/+$/, "")}/g/home/r/create/url`}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "inline-flex items-center gap-1.5 rounded-[var(--radius-lg)]",
                "border border-border bg-card px-3 py-1.5",
                "text-sm font-semibold text-muted-foreground shadow-subtle",
                "transition-all duration-150 hover:border-border hover:bg-secondary hover:text-foreground",
              )}
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Importer</span>
            </a>

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

        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/60" />
          <Input
            placeholder="Rechercher dans les favoris..."
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
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-[var(--radius-xl)] border border-destructive/20 bg-destructive/8 p-4 text-destructive">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {!loading && !error && filteredRecipes.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-24 text-muted-foreground">
          <div
            className={cn(
              "flex h-16 w-16 items-center justify-center rounded-[var(--radius-2xl)]",
              "bg-secondary",
            )}
          >
            {recipes.length === 0 ? (
              <Heart className="h-7 w-7 text-muted-foreground/60" />
            ) : (
              <UtensilsCrossed className="h-7 w-7 text-muted-foreground/60" />
            )}
          </div>
          <p className="text-sm font-semibold">
            {recipes.length === 0 ? "Aucune recette favorite" : "Aucun favori ne correspond à la recherche"}
          </p>
        </div>
      )}

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

      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-7 w-7 animate-spin text-muted-foreground/50" />
        </div>
      )}

      {selectedSlug !== null && (
        <>
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
