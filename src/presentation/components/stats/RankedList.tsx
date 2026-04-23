import { cn } from "@/lib/utils.ts"

export function RankedList({
  title,
  items,
  maxCount,
}: {
  title: string
  items: { label: string; count: number; sub?: string; slug?: string; onClick?: () => void }[]
  maxCount: number
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-[var(--radius-2xl)] border border-border/50 bg-card p-5 shadow-subtle">
        <h3 className="mb-3 text-sm font-bold">{title}</h3>
        <p className="text-sm text-muted-foreground">Pas encore de données sur cette période.</p>
      </div>
    )
  }

  return (
    <div className="rounded-[var(--radius-2xl)] border border-border/50 bg-card p-5 shadow-subtle">
      <h3 className="mb-4 text-sm font-bold">{title}</h3>
      <ol className="space-y-3">
        {items.map((item, i) => {
          const pct = maxCount > 0 ? Math.round((item.count / maxCount) * 100) : 0
          const interactive = Boolean(item.onClick)
          return (
            <li key={item.slug ?? item.label} className="flex items-center gap-3">
              <span
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                  i === 0
                    ? "bg-primary text-primary-foreground"
                    : i === 1
                      ? "bg-secondary text-secondary-foreground"
                      : "bg-muted text-muted-foreground",
                )}
              >
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center justify-between gap-2">
                  {interactive ? (
                    <button
                      type="button"
                      onClick={item.onClick}
                      className="truncate text-left text-sm font-semibold transition-colors hover:text-primary focus:outline-none focus-visible:text-primary"
                    >
                      {item.label}
                    </button>
                  ) : (
                    <span className="truncate text-sm font-semibold">{item.label}</span>
                  )}
                  <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold text-secondary-foreground">
                    {item.count}x
                  </span>
                </div>
                {item.sub && <p className="mb-1 truncate text-xs text-muted-foreground">{item.sub}</p>}
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary/80">
                  <div className="h-full rounded-full bg-primary transition-all duration-700 ease-out" style={{ width: `${pct}%` }} />
                </div>
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}