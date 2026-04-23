export function CategoryBars({
  stats,
}: {
  stats: { name: string; count: number; percentage: number }[]
}) {
  if (stats.length === 0) {
    return (
      <div className="rounded-[var(--radius-2xl)] border border-border/50 bg-card p-5 shadow-subtle">
        <h3 className="mb-3 text-sm font-bold">Distribution par catégorie</h3>
        <p className="text-sm text-muted-foreground">Pas encore de données sur cette période.</p>
      </div>
    )
  }
  return (
    <div className="rounded-[var(--radius-2xl)] border border-border/50 bg-card p-5 shadow-subtle">
      <h3 className="mb-4 text-sm font-bold">Distribution par catégorie</h3>
      <ul className="space-y-3">
        {stats.map((cat) => (
          <li key={cat.name}>
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="truncate font-semibold">{cat.name}</span>
              <span className="ml-2 shrink-0 text-xs font-medium text-muted-foreground">
                {cat.count} - {cat.percentage}%
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-secondary/80">
              <div className="h-full rounded-full bg-primary transition-all duration-700 ease-out" style={{ width: `${cat.percentage}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}