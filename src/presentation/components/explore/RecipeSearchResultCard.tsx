import { AlertTriangle, ChefHat, ExternalLink, Loader2, Plus } from "lucide-react"
import { Link } from "react-router-dom"

import { buildRecipeImageProxyUrl } from "@/infrastructure/recipeSources/providers/shared/remoteRecipeSourceApi.ts"
import type { RecipeDuplicateMatch } from "@/infrastructure/recipeSources/recipeDuplicateDetectionService.ts"
import type { RecipeSourceRecipe } from "@/infrastructure/recipeSources/providers/types.ts"
import type { ExploreImportState } from "@/shared/types/exploreRecipes/exploreRecipes.ts"
import { Button } from "components/ui/button.tsx"
import { RecipeImportFeedback } from "./RecipeImportFeedback.tsx"

interface RecipeSearchResultCardProps {
  recipe: RecipeSourceRecipe
  duplicateMatch: RecipeDuplicateMatch | null
  importState: ExploreImportState
  onImport: (recipe: RecipeSourceRecipe) => void
}

export function RecipeSearchResultCard({
  recipe,
  duplicateMatch,
  importState,
  onImport,
}: RecipeSearchResultCardProps) {
  return (
    <div className="flex flex-col overflow-hidden rounded-[var(--radius-2xl)] border border-border/50 bg-card shadow-subtle">
      {recipe.imageUrl ? (
        <div className="relative h-44 shrink-0 bg-secondary">
          <img
            src={buildRecipeImageProxyUrl(recipe)}
            alt={recipe.name}
            className="h-full w-full object-cover"
            loading="lazy"
            onError={(event) => {
              event.currentTarget.onerror = null
              event.currentTarget.style.display = "none"
            }}
          />
        </div>
      ) : (
        <div className="flex h-44 shrink-0 items-center justify-center bg-secondary">
          <ChefHat className="h-10 w-10 text-muted-foreground/30" />
        </div>
      )}

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <h3 className="line-clamp-2 text-sm font-bold leading-snug">{recipe.name}</h3>
            <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground/60">
              {recipe.providerLabel}
            </p>
            {duplicateMatch && (
              <div className="space-y-1 pt-1">
                <div className="inline-flex items-center gap-1 rounded-full border border-amber-300/70 bg-amber-100/80 px-2 py-1 text-[11px] font-medium text-amber-900">
                  <AlertTriangle className="h-3 w-3" />
                  Doublon potentiel
                </div>
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  {duplicateMatch.message}
                </p>
                <Link
                  to={`/recipes/${duplicateMatch.existingRecipe.slug}`}
                  className="inline-flex text-[11px] font-medium text-foreground underline-offset-2 hover:underline"
                >
                  Ouvrir la recette existante
                </Link>
              </div>
            )}
          </div>
          {recipe.sourceUrl && (
            <a
              href={recipe.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
              title={`Voir sur ${recipe.providerLabel}`}
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>

        <div className="mt-auto pt-2">
          {importState.state === "idle" && (
            <Button
              type="button"
              size="sm"
              variant={duplicateMatch ? "outline" : "default"}
              className="w-full gap-1.5"
              onClick={() => onImport(recipe)}
            >
              <Plus className="h-3.5 w-3.5" />
              {duplicateMatch ? "Ajouter avec avertissement" : "Ajouter a l'application"}
            </Button>
          )}

          {importState.state === "loading" && (
            <Button type="button" size="sm" className="w-full gap-1.5" disabled>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Import en cours...
            </Button>
          )}

          {(importState.state === "ok" || importState.state === "error") && (
            <RecipeImportFeedback state={importState} />
          )}
        </div>
      </div>
    </div>
  )
}
