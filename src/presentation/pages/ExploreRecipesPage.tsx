// React
import { useState } from "react"

// Icons (lucide)
import { AlertCircle, ChefHat } from "lucide-react"

// Types
import type { RecipeSourceProviderId } from "@/infrastructure/recipeSources/providers/types.ts"
import type { MealieRecipeScrapeOptions } from "@/shared/types/mealie/RecipeImport.ts"

// Hooks - Explore
import { useExploreRecipes } from "hooks/explore/useExploreRecipes.ts"

// Components - Common
import { UrlImportIngredientReviewDialog } from "components/common/urlImportIngredientReviewDialog/UrlImportIngredientReviewDialog.tsx"

// Components - Explore
import { RecipeSearchForm, RecipeSearchResults, RecipeUrlImportPanel } from "components/explore";

export function ExploreRecipesPage() {
  const [query, setQuery] = useState("")
  const [urlInput, setUrlInput] = useState("")
  const [source, setSource] = useState<RecipeSourceProviderId>("jow")
  const [sourceInput, setSourceInput] = useState("Jow")
  const [includeTags, setIncludeTags] = useState(true)
  const [includeCategories, setIncludeCategories] = useState(true)
  const [autoLinkIngredientsToInstructions, setAutoLinkIngredientsToInstructions] = useState(true)
  const { results, loading, providerLoading, mealieLoading, error, searched, currentPage, hasMore, nextPage, activeQuery, searchProviders,
    searchSourceLabel, urlImportState, urlImportReviewDraft, cardImportStates, 
    duplicateMatchesByKey,
    search, goToPreviousPage, goToNextPage, importFromUrl, startUrlImportFromSearchResult,
    confirmUrlImportReview, closeUrlImportReview, resetUrlImportState,
  } = useExploreRecipes()

  const importOptions: MealieRecipeScrapeOptions = {
    includeTags,
    includeCategories,
    autoLinkIngredientsToInstructions,
  }

  const handleSearch = async (nextQuery?: string) => {
    const term = (nextQuery ?? query).trim()
    if (!term) return
    setQuery(term)
    await search(term, source)
  }

  const handlePreviousPage = async () => {
    await goToPreviousPage()
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleNextPage = async () => {
    await goToNextPage()
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleImportUrl = async () => {
    const trimmedUrl = urlInput.trim()
    if (!trimmedUrl) return
    await importFromUrl(trimmedUrl, importOptions)
  }

  const handleSearchResultImport = (sourceUrl: string) => {
    setUrlInput(sourceUrl)
    resetUrlImportState()
  }

  const sourceOptions = searchProviders.map((provider) => ({
    id: provider.id,
    label: provider.label,
  }))

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="flex items-center gap-2.5 font-heading text-2xl font-bold">
          <ChefHat className="h-6 w-6 text-primary" />
          Explorer des recettes
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Recherchez des recettes depuis une source externe et importez-les proprement dans votre bibliotheque.
        </p>
      </div>

      <RecipeUrlImportPanel
        urlInput={urlInput}
        importState={urlImportState}
        includeTags={includeTags}
        includeCategories={includeCategories}
        autoLinkIngredientsToInstructions={autoLinkIngredientsToInstructions}
        onUrlChange={(value) => {
          setUrlInput(value)
          resetUrlImportState()
        }}
        onIncludeTagsChange={setIncludeTags}
        onIncludeCategoriesChange={setIncludeCategories}
        onAutoLinkIngredientsToInstructionsChange={setAutoLinkIngredientsToInstructions}
        onImport={handleImportUrl}
      />

      <RecipeSearchForm
        query={query}
        sourceInput={sourceInput}
        sourceOptions={sourceOptions}
        loading={loading}
        onQueryChange={setQuery}
        onSourceChange={(sourceId, sourceLabel, rawValue) => {
          setSourceInput(rawValue)
          setSource(sourceId)
          setSourceInput(sourceLabel)
        }}
        onSearch={handleSearch}
      />

      {error && (
        <div className="flex items-start gap-3 rounded-[var(--radius-xl)] border border-destructive/30 bg-destructive/5 p-4">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <RecipeSearchResults
        results={results}
        providerLoading={providerLoading}
        mealieLoading={mealieLoading}
        searched={searched}
        currentPage={currentPage}
        hasMore={hasMore}
        nextPage={nextPage}
        activeQuery={activeQuery}
        searchSourceLabel={searchSourceLabel}
        cardImportStates={cardImportStates}
        duplicateMatchesByKey={duplicateMatchesByKey}
        onPreviousPage={handlePreviousPage}
        onNextPage={handleNextPage}
        onImport={(recipe) => {
          handleSearchResultImport(recipe.sourceUrl)
          void startUrlImportFromSearchResult(recipe, importOptions)
        }}
      />

      <UrlImportIngredientReviewDialog
        open={Boolean(urlImportReviewDraft)}
        draft={urlImportReviewDraft}
        loading={urlImportState.state === "loading"}
        error={urlImportState.state === "error" ? urlImportState.message : null}
        onOpenChange={(open) => {
          if (!open) {
            closeUrlImportReview()
          }
        }}
        onConfirm={confirmUrlImportReview}
      />

    </div>
  )
}
