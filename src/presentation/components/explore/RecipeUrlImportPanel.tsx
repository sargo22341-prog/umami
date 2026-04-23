import { Link2, Loader2, Plus } from "lucide-react"

import type { ExploreImportState } from "@/shared/types/exploreRecipes/exploreRecipes.ts"
import { Button, Input, Switch } from "components/ui"
import { RecipeImportFeedback } from "./RecipeImportFeedback.tsx"

interface RecipeUrlImportPanelProps {
  urlInput: string
  importState: ExploreImportState
  includeTags: boolean
  includeCategories: boolean
  autoLinkIngredientsToInstructions: boolean
  onUrlChange: (value: string) => void
  onIncludeTagsChange: (value: boolean) => void
  onIncludeCategoriesChange: (value: boolean) => void
  onAutoLinkIngredientsToInstructionsChange: (value: boolean) => void
  onImport: () => void
}

export function RecipeUrlImportPanel({
  urlInput,
  importState,
  includeTags,
  includeCategories,
  autoLinkIngredientsToInstructions,
  onUrlChange,
  onIncludeTagsChange,
  onIncludeCategoriesChange,
  onAutoLinkIngredientsToInstructionsChange,
  onImport,
}: RecipeUrlImportPanelProps) {
  return (
    <div className="space-y-3 rounded-[var(--radius-2xl)] border border-border/50 bg-card p-5 shadow-subtle">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Link2 className="h-4 w-4 text-primary" />
        Importer depuis une URL
      </div>
      <p className="text-xs text-muted-foreground">
        Le lien est analyse, les ingredients sont verifies dans une popup de review, puis la recette est enregistree avec la version corrigee.
      </p>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Link2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="url"
            placeholder="https://..."
            value={urlInput}
            onChange={(event) => onUrlChange(event.target.value)}
            className="pl-9"
            disabled={importState.state === "loading"}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                void onImport()
              }
            }}
          />
        </div>
        <Button
          type="button"
          disabled={!urlInput.trim() || importState.state === "loading"}
          onClick={() => void onImport()}
          className="shrink-0 gap-1.5"
        >
          {importState.state === "loading" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Import...
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              Importer
            </>
          )}
        </Button>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <label className="flex items-center justify-between gap-3 rounded-[var(--radius-lg)] border border-border/50 bg-secondary/15 px-3 py-2.5 text-sm text-foreground">
          <span>Inclure les tags</span>
          <Switch
            checked={includeTags}
            onCheckedChange={onIncludeTagsChange}
            disabled={importState.state === "loading"}
          />
        </label>

        <label className="flex items-center justify-between gap-3 rounded-[var(--radius-lg)] border border-border/50 bg-secondary/15 px-3 py-2.5 text-sm text-foreground">
          <span>Inclure les catégories</span>
          <Switch
            checked={includeCategories}
            onCheckedChange={onIncludeCategoriesChange}
            disabled={importState.state === "loading"}
          />
        </label>
      </div>

      <div className="grid gap-2">
        <label className="flex items-center justify-between gap-3 rounded-[var(--radius-lg)] border border-border/50 bg-secondary/15 px-3 py-2.5 text-sm text-foreground">
          <span>Lier ingredients et etapes</span>
          <Switch
            checked={autoLinkIngredientsToInstructions}
            onCheckedChange={onAutoLinkIngredientsToInstructionsChange}
            disabled={importState.state === "loading"}
          />
        </label>
      </div>

      {(importState.state === "ok" || importState.state === "error") && (
        <RecipeImportFeedback state={importState} />
      )}
    </div>
  )
}
