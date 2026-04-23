import { cn } from "@/lib/utils.ts"

export function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
}: {
  label: string
  value: string | number
  sub?: string
  icon: React.ElementType
  accent: string
}) {
  return (
    <div className="rounded-[var(--radius-2xl)] border border-border/50 bg-card p-5 shadow-subtle transition-shadow duration-200 hover:shadow-warm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[9.5px] font-bold uppercase tracking-[0.10em] text-muted-foreground/50">{label}</p>
          <p className="mt-1.5 font-heading text-4xl font-bold tabular-nums tracking-tight">{value}</p>
          {sub && <p className="mt-1 text-[11px] text-muted-foreground">{sub}</p>}
        </div>
        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-xl)]", accent)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}