export function CatalogueCoverage({
  unique,
  total,
  pct,
}: {
  unique: number
  total: number
  pct: number
}) {
  return (
    <div className="rounded-[var(--radius-2xl)] border border-border/50 bg-card p-5 shadow-subtle">
      <h3 className="mb-1 text-sm font-bold">Exploration du catalogue</h3>
      <p className="mb-4 text-xs text-muted-foreground">
        {unique} recette{unique > 1 ? "s" : ""} differente{unique > 1 ? "s" : ""} sur {total} au catalogue
      </p>
      <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary transition-all duration-700 ease-out" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-2 text-right text-xs font-semibold text-muted-foreground">{pct}%</p>
    </div>
  )
}
