import { useEffect, useRef } from "react"

import { cn } from "@/lib/utils.ts"

interface PlanningSelectionCheckboxProps {
  checked: boolean
  indeterminate?: boolean
  onChange: (checked: boolean) => void
  ariaLabel: string
}

export function PlanningSelectionCheckbox({
  checked,
  indeterminate = false,
  onChange,
  ariaLabel,
}: PlanningSelectionCheckboxProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!inputRef.current) return
    inputRef.current.indeterminate = indeterminate
  }, [indeterminate])

  return (
    <label className="flex h-6 w-6 items-center justify-center rounded-full border border-border/40 bg-background/95 shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
      <input
        ref={inputRef}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        aria-label={ariaLabel}
        className={cn(
          "h-3.5 w-3.5 appearance-none rounded-full border border-border/60 bg-background transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
          checked && "border-primary bg-primary",
          indeterminate && !checked && "border-primary bg-primary/55",
        )}
      />
    </label>
  )
}
