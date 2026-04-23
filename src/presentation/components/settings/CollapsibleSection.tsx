import { useState } from "react"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils.ts"

interface CollapsibleSectionProps {
  icon: React.ReactNode
  iconBg: string
  title: string
  subtitle: string | React.ReactNode
  defaultOpen?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
  headerExtra?: React.ReactNode
  children: React.ReactNode
}

export function CollapsibleSection({
  icon,
  iconBg,
  title,
  subtitle,
  defaultOpen = false,
  open: controlledOpen,
  onOpenChange,
  headerExtra,
  children,
}: CollapsibleSectionProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen)
  const open = controlledOpen ?? internalOpen

  const handleOpenChange = (nextOpen: boolean) => {
    if (controlledOpen == null) {
      setInternalOpen(nextOpen)
    }
    onOpenChange?.(nextOpen)
  }

  return (
    <section className="overflow-hidden rounded-[var(--radius-2xl)] border border-border/50 bg-card shadow-subtle">
      <button
        type="button"
        onClick={() => handleOpenChange(!open)}
        className="flex w-full items-center gap-3 p-5 text-left transition-colors hover:bg-secondary/30"
      >
        <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-lg)]", iconBg)}>
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-bold leading-none">{title}</h2>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{subtitle}</p>
        </div>
        {headerExtra && (
          <div className="shrink-0" onClick={(event) => event.stopPropagation()}>
            {headerExtra}
          </div>
        )}
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      <div
        className={cn(
          "grid transition-all duration-200 ease-in-out",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          <div className="space-y-6 border-t border-border/40 px-5 pb-5 pt-5">
            {children}
          </div>
        </div>
      </div>
    </section>
  )
}
