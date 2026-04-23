import { useEffect, useRef, useState } from "react"
import { Search, Loader2, UtensilsCrossed, X, StickyNote } from "lucide-react"
import {
   Input, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "components/ui"
import { useRecipesInfinite } from "hooks/recipes"
import type { MealieRecipeOutput } from "@/shared/types/mealie/Recipes.ts"
import { recipeImageUrl } from "@/shared/utils"

function RecipeList({
  search,
  onSelect,
}: {
  search: string
  onSelect: (recipe: MealieRecipeOutput) => void
}) {
  const { recipes, loading, hasMore, loadMore } = useRecipesInfinite({ search })
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) loadMore()
      },
      { threshold: 0.1 },
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasMore, loading, loadMore])

  if (recipes.length === 0 && !loading) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
        <UtensilsCrossed className="h-8 w-8" />
        <p className="text-sm">Aucune recette trouvée.</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-2 p-1 sm:grid-cols-4 md:grid-cols-5">
        {recipes.map((recipe) => (
          <button
            key={recipe.id}
            type="button"
            onClick={() => onSelect(recipe)}
            className="group flex flex-col gap-1.5 rounded-[var(--radius-lg)] p-1.5 text-left transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <div className="relative aspect-square w-full overflow-hidden rounded-[var(--radius-md)] bg-muted">
              <img
                src={recipeImageUrl(recipe, "min-original")}
                alt={recipe.name}
                className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                loading="lazy"
              />
            </div>
            <span className="line-clamp-2 w-full text-[11px] font-medium leading-tight">{recipe.name}</span>
          </button>
        ))}
      </div>

      <div ref={sentinelRef} className="h-4" />

      {loading && (
        <div className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}
    </>
  )
}

interface RecipePickerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect:
    (selection:
      | { type: "recipe"; recipe: MealieRecipeOutput }
      | { type: "note"; title?: string; text?: string }) => void | Promise<void>
}

export function RecipePickerDialog({
  open,
  onOpenChange,
  onSelect,
}: RecipePickerDialogProps) {
  const [inputValue, setInputValue] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [mode, setMode] = useState<"recipe" | "note">("recipe")
  const [noteTitle, setNoteTitle] = useState("")
  const [noteText, setNoteText] = useState("")

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(inputValue), 300)
    return () => clearTimeout(timer)
  }, [inputValue])

  const handleOpenChange = (value: boolean) => {
    if (!value) {
      setInputValue("")
      setDebouncedSearch("")
      setNoteTitle("")
      setNoteText("")
      setMode("recipe")
    }
    onOpenChange(value)
  }

  const handleSelectRecipe = (recipe: MealieRecipeOutput) => {
    void onSelect({ type: "recipe", recipe })
    handleOpenChange(false)
  }

  const handleSelectNote = () => {
    const trimmedTitle = noteTitle.trim()
    const trimmedText = noteText.trim()
    if (!trimmedTitle && !trimmedText) return
    void onSelect({
      type: "note",
      title: trimmedTitle || undefined,
      text: trimmedText || undefined,
    })
    handleOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[90vh] w-[calc(100vw-1.5rem)] max-w-[calc(100vw-1.5rem)] flex-col sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Ajouter au planning</DialogTitle>
          <DialogDescription>
            Choisissez une recette ou ajoutez simplement une note pour ce créneau.
          </DialogDescription>
        </DialogHeader>

        <div className="grid h-[44px] min-h-[44px] grid-cols-2 gap-1 rounded-[var(--radius-xl)] border border-border/50 bg-secondary/40 p-1">
          <button
            type="button"
            onClick={() => setMode("recipe")}
            className={`flex h-full min-h-[36px] items-center justify-center gap-2 rounded-[var(--radius-lg)] px-3 text-sm font-medium leading-none transition-colors ${
              mode === "recipe" ? "bg-card text-foreground shadow-subtle" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <UtensilsCrossed className="h-4 w-4" />
            Choisir une recette
          </button>
          <button
            type="button"
            onClick={() => setMode("note")}
            className={`flex h-full min-h-[36px] items-center justify-center gap-2 rounded-[var(--radius-lg)] px-3 text-sm font-medium leading-none transition-colors ${
              mode === "note" ? "bg-card text-foreground shadow-subtle" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <StickyNote className="h-4 w-4" />
            Note
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {mode === "recipe" ? (
            <>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Rechercher une recette..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="pl-9 pr-9"
                  autoFocus
                />
                {inputValue && (
                  <button
                    type="button"
                    onClick={() => setInputValue("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <RecipeList search={debouncedSearch} onSelect={handleSelectRecipe} />
            </>
          ) : (
            <div className="flex h-full flex-col gap-4">
              <Input
                value={noteTitle}
                onChange={(event) => setNoteTitle(event.target.value)}
                placeholder="Titre facultatif..."
                className="h-10"
                autoFocus
              />
              <textarea
                value={noteText}
                onChange={(event) => setNoteText(event.target.value)}
                placeholder="Texte facultatif..."
                className="min-h-[180px] w-full resize-none rounded-[var(--radius-xl)] border border-input bg-background px-3 py-3 text-sm outline-none"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleSelectNote}
                  disabled={!noteTitle.trim() && !noteText.trim()}
                  className="rounded-[var(--radius-lg)] bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Ajouter au planning
                </button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
