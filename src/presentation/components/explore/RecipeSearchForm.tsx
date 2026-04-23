import { Loader2, Search } from "lucide-react"

import type { RecipeSourceProviderId } from "@/infrastructure/recipeSources/providers/types.ts"
import { cn } from "@/lib/utils.ts"
import { Button, Combobox, Input } from "components/ui"

interface SearchOption {
  id: string
  label: string
}

interface RecipeSearchFormProps {
  query: string
  sourceInput: string
  sourceOptions: SearchOption[]
  loading: boolean
  onQueryChange: (value: string) => void
  onSourceChange: (sourceId: RecipeSourceProviderId, sourceLabel: string, rawValue: string) => void
  onSearch: (query?: string) => void
}

export function RecipeSearchForm({
  query,
  sourceInput,
  sourceOptions,
  loading,
  onQueryChange,
  onSourceChange,
  onSearch,
}: RecipeSearchFormProps) {
  return (
    <div className="space-y-4 rounded-[var(--radius-2xl)] border border-border/50 bg-card p-5 shadow-subtle">
      <form
        onSubmit={(event) => {
          event.preventDefault()
          void onSearch()
        }}
        className="flex flex-col gap-2 md:flex-row"
      >
        <Combobox
          value={sourceInput}
          onChange={(value, option) => {
            if (!option) {
              onSourceChange(sourceOptions[0]?.id as RecipeSourceProviderId, sourceInput, value)
              return
            }
            onSourceChange(option.id as RecipeSourceProviderId, option.label, value)
          }}
          options={sourceOptions}
          className="md:w-[180px]"
          inputClassName={cn(
            "h-10 rounded-[var(--radius-lg)] border border-border bg-card text-sm font-medium text-foreground shadow-subtle",
          )}
          placeholder="Source"
          showAllOnExactMatch
          aria-label="Source de recherche"
        />
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Rechercher une recette..."
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            className="pl-9"
          />
        </div>
        <Button type="submit" disabled={loading || !query.trim()} className="shrink-0 gap-1.5">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          Rechercher
        </Button>
      </form>
    </div>
  )
}
