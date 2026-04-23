import type { ReactNode } from "react"

export function RecipeDetailSectionHeader({
  icon,
  label,
}: {
  icon: ReactNode
  label: string
}) {
  return (
    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
      {icon}
      <span>{label}</span>
    </div>
  )
}

export function RecipeDetailSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="aspect-video w-full rounded-[var(--radius-xl)] bg-muted" />
      <div className="space-y-3">
        <div className="h-8 w-2/3 rounded-[var(--radius-md)] bg-muted" />
        <div className="flex gap-2">
          <div className="h-6 w-20 rounded-full bg-muted" />
          <div className="h-6 w-20 rounded-full bg-muted" />
        </div>
        <div className="flex gap-4">
          <div className="h-5 w-32 rounded-[var(--radius-sm)] bg-muted" />
          <div className="h-5 w-32 rounded-[var(--radius-sm)] bg-muted" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-6 w-32 rounded-[var(--radius-sm)] bg-muted" />
        <div className="h-4 w-full rounded-[var(--radius-sm)] bg-muted" />
        <div className="h-4 w-5/6 rounded-[var(--radius-sm)] bg-muted" />
        <div className="h-4 w-4/6 rounded-[var(--radius-sm)] bg-muted" />
      </div>
    </div>
  )
}
