import { ChefHat, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"

import type { RecipeSourceRecipe } from "@/infrastructure/recipeSources/providers/types.ts"
import type { RecipeDuplicateMatch } from "@/infrastructure/recipeSources/recipeDuplicateDetectionService.ts"
import type { ExploreImportState } from "@/shared/types/exploreRecipes/exploreRecipes.ts"
import { Button } from "components/ui"
import { RecipeSearchResultCard } from "./RecipeSearchResultCard.tsx"

interface RecipeSearchResultsProps {
  results: RecipeSourceRecipe[]
  providerLoading: boolean
  mealieLoading: boolean
  searched: boolean
  currentPage: number
  hasMore: boolean
  nextPage: unknown
  activeQuery: string
  searchSourceLabel: string
  cardImportStates: Record<string, ExploreImportState>
  duplicateMatchesByKey: Record<string, RecipeDuplicateMatch | null>
  onImport: (recipe: RecipeSourceRecipe) => void
  onPreviousPage: () => void
  onNextPage: () => void
}

export function RecipeSearchResults({
  results,
  providerLoading,
  mealieLoading,
  searched,
  currentPage,
  hasMore,
  nextPage,
  activeQuery,
  searchSourceLabel,
  cardImportStates,
  duplicateMatchesByKey,
  onImport,
  onPreviousPage,
  onNextPage,
}: RecipeSearchResultsProps) {
  if (providerLoading) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="text-sm">Recherche en cours sur {searchSourceLabel}...</p>
      </div>
    )
  }

  if (mealieLoading) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="text-sm">Recettes recuperees sur {searchSourceLabel}, verification en cours dans Mealie...</p>
      </div>
    )
  }

  if (results.length > 0) {
    return (
      <div>
        <p className="mb-4 text-sm text-muted-foreground">
          Page <span className="font-semibold text-foreground">{currentPage}</span> - {results.length} recette
          {results.length > 1 ? "s" : ""} pour <span className="font-semibold text-foreground">"{activeQuery}"</span>
          {" "}sur <span className="font-semibold text-foreground">{searchSourceLabel}</span>
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((recipe) => {
            const importKey = recipe.sourceUrl || recipe.name
            return (
              <RecipeSearchResultCard
                key={importKey}
                recipe={recipe}
                duplicateMatch={duplicateMatchesByKey[importKey] ?? null}
                importState={cardImportStates[importKey] ?? { state: "idle" }}
                onImport={onImport}
              />
            )
          })}
        </div>

        <div className="mt-8 flex items-center justify-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            disabled={currentPage === 1}
            onClick={() => void onPreviousPage()}
          >
            <ChevronLeft className="h-4 w-4" />
            Precedente
          </Button>
          <span className="text-sm text-muted-foreground">Page {currentPage}</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            disabled={!hasMore || !nextPage}
            onClick={() => void onNextPage()}
          >
            Suivante
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  if (!searched) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
        <ChefHat className="h-12 w-12 opacity-20" />
        <p className="text-sm">Lancez une recherche pour decouvrir des recettes externes.</p>
      </div>
    )
  }

  return null
}
