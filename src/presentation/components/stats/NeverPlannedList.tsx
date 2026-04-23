export function NeverPlannedList({
  recipes,
  onRecipeClick,
}: {
  recipes: { slug: string; name: string }[]
  onRecipeClick: (slug: string) => void
}) {
  if (recipes.length === 0) {
    return (
      <div className="rounded-[var(--radius-2xl)] border border-border/50 bg-card p-5 shadow-subtle">
        <h3 className="mb-1 text-sm font-bold">Recettes jamais planifiées</h3>
        <p className="text-sm text-muted-foreground">
          Toutes les recettes du catalogue ont été planifiées sur cette période.
        </p>
      </div>
    )
  }
  return (
    <div className="rounded-[var(--radius-2xl)] border border-border/50 bg-card p-5 shadow-subtle">
      <h3 className="mb-1 text-sm font-bold">Recettes jamais planifiées</h3>
      <p className="mb-3 text-xs text-muted-foreground">
        {recipes.length} recette{recipes.length > 1 ? "s" : ""} du catalogue absente
        {recipes.length > 1 ? "s" : ""} du planning
        {recipes.length === 50 ? " (50 premières affichées)" : ""}
      </p>
      <ul className="columns-1 gap-x-4 space-y-1 sm:columns-2">
        {recipes.map((recipe) => (
          <li key={recipe.slug} className="break-inside-avoid truncate text-sm text-muted-foreground">
            <button
              type="button"
              onClick={() => onRecipeClick(recipe.slug)}
              className="truncate text-left transition-colors hover:text-primary focus:outline-none focus-visible:text-primary"
            >
              {recipe.name}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}