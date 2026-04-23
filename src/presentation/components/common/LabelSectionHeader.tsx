import { ChevronDown, Loader2, Sparkles } from "lucide-react"

import { cn } from "@/lib/utils"

interface LabelSectionHeaderProps {
  label: string
  color?: string
  isFirst?: boolean
  onAiCategorize?: () => void
  aiCategorizeLoading?: boolean
  collapsible?: boolean
  expanded?: boolean
  onToggle?: () => void
  itemCount?: number
}

export function LabelSectionHeader({
  label,
  color,
  isFirst,
  onAiCategorize,
  aiCategorizeLoading,
  collapsible = false,
  expanded = true,
  onToggle,
  itemCount,
}: LabelSectionHeaderProps) {
  const isNone = label === "Sans etiquette"
  const content = (
    <>
      <span
        className="h-[7px] w-[7px] shrink-0 rounded-full"
        style={{ backgroundColor: isNone ? "--color-secondary" : color || "--color-secondary" }}
      />
      <span className="text-[9.5px] font-bold uppercase tracking-[0.10em] text-muted-foreground/60">
        {label}
      </span>
      {typeof itemCount === "number" && (
        <span className="rounded-full bg-background/70 px-1.5 py-0.5 text-[9px] font-semibold text-muted-foreground/70">
          {itemCount}
        </span>
      )}
      {collapsible && (
        <ChevronDown
          className={cn(
            "ml-auto h-3.5 w-3.5 text-muted-foreground/60 transition-transform duration-200",
            !expanded && "-rotate-90",
            onAiCategorize && "ml-1",
          )}
        />
      )}
    </>
  )

  return (
    <div
      className={cn(
        "flex items-center gap-2 bg-secondary/50 px-4 py-1.5",
        isFirst && "rounded-t-[var(--radius-xl)]",
      )}
    >
      {collapsible ? (
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          {content}
        </button>
      ) : (
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {content}
        </div>
      )}
      {onAiCategorize && (
        <button
          type="button"
          onClick={onAiCategorize}
          disabled={aiCategorizeLoading}
          title="Categoriser via IA"
          className="ml-auto flex items-center gap-1 rounded-full px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.10em] text-muted-foreground/60 transition-colors hover:bg-primary/10 hover:text-primary disabled:opacity-50"
        >
          {aiCategorizeLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
          IA
        </button>
      )}
    </div>
  )
}
