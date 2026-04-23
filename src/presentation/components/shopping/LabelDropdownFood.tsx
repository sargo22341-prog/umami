import { useRef, useState } from "react"
import { Check, ChevronDown, Tag } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ShoppingLabel } from "@/domain/shopping/entities/ShoppingItem"

function getLabelColor(label?: ShoppingLabel) {
  return label?.color || "--color-secondary"
}

interface LabelDropdownFoodProps {
  labels: ShoppingLabel[]
  value: string | undefined
  onChange: (labelId: string | undefined) => void
  className?: string
}

export function LabelDropdownFood({ labels, value, onChange, className }: LabelDropdownFoodProps) {
  const [open, setOpen] = useState(false)
  const [openUpward, setOpenUpward] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selectedLabel = labels.find((label) => label.id === value)

  const handleSelect = (id: string | undefined) => {
    onChange(id)
    setOpen(false)
  }

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!open && ref.current) {
      const rect = ref.current.getBoundingClientRect()
      setOpenUpward(rect.bottom + 220 > window.innerHeight)
    }
    setOpen((prev) => !prev)
  }

  const handleBlur = (e: React.FocusEvent) => {
    if (ref.current && !ref.current.contains(e.relatedTarget as Node)) {
      setOpen(false)
    }
  }

  return (
    <div ref={ref} className={cn("relative shrink-0", className)} onBlur={handleBlur}>
      <button
        type="button"
        onClick={handleToggle}
        className="flex h-6 items-center gap-1 rounded-full bg-muted px-2 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
      >
        {selectedLabel ? (
          <>
            <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: getLabelColor(selectedLabel) }} />
            <span className="max-w-[80px] truncate">{selectedLabel.name}</span>
          </>
        ) : (
          <Tag className="h-3 w-3" />
        )}
        <ChevronDown className="h-2.5 w-2.5" />
      </button>

      {open && (
        <div
          className={cn(
            "absolute right-0 z-50 min-w-[130px] max-h-64 overflow-y-auto rounded-[var(--radius-xl)] border border-border/50 bg-card shadow-warm-md",
            openUpward ? "bottom-full mb-1" : "top-full mt-1",
          )}
        >
          <button
            type="button"
            onClick={() => handleSelect(undefined)}
            className="flex w-full items-center gap-2 px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-secondary"
          >
            <span className="h-2 w-2 rounded-full bg-border" />
            Sans etiquette
          </button>
          {labels.map((label) => (
            <button
              key={label.id}
              type="button"
              onClick={() => handleSelect(label.id)}
              className="flex w-full items-center gap-2 border-t border-border/30 px-3 py-2 text-xs transition-colors hover:bg-secondary"
            >
              <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: getLabelColor(label) }} />
              <span className="truncate">{label.name}</span>
              {label.id === value && <Check className="ml-auto h-3 w-3 text-primary" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

interface FormLabelSelectProps {
  labels: ShoppingLabel[]
  value: string
  onChange: (v: string) => void
  disabled?: boolean
}

export function FormLabelSelect({ labels, value, onChange, disabled }: FormLabelSelectProps) {
  const [open, setOpen] = useState(false)
  const [openUpward, setOpenUpward] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selected = labels.find((label) => label.id === value)

  const handleToggle = () => {
    if (disabled) return
    if (!open && ref.current) {
      const rect = ref.current.getBoundingClientRect()
      setOpenUpward(rect.bottom + 220 > window.innerHeight)
    }
    setOpen((prev) => !prev)
  }

  const handleBlur = (e: React.FocusEvent) => {
    if (ref.current && !ref.current.contains(e.relatedTarget as Node)) {
      setOpen(false)
    }
  }

  return (
    <div ref={ref} className="relative shrink-0" onBlur={handleBlur}>
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className="flex h-8 items-center gap-1.5 rounded-[var(--radius-lg)] border border-input bg-card px-2.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-50"
      >
        {selected ? (
          <>
            <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: getLabelColor(selected) }} />
            <span className="max-w-[80px] truncate">{selected.name}</span>
          </>
        ) : (
          <span>Etiquette</span>
        )}
        <ChevronDown className="h-3 w-3" />
      </button>

      {open && (
        <div
          className={cn(
            "absolute right-0 z-50 min-w-[140px] max-h-64 overflow-y-auto rounded-[var(--radius-xl)] border border-border/50 bg-card shadow-warm-md",
            openUpward ? "bottom-full mb-1" : "top-full mt-1",
          )}
        >
          <button
            type="button"
            onClick={() => {
              onChange("")
              setOpen(false)
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-secondary"
          >
            <span className="h-2 w-2 rounded-full bg-border" />
            Etiquette
          </button>
          {labels.map((label) => (
            <button
              key={label.id}
              type="button"
              onClick={() => {
                onChange(label.id)
                setOpen(false)
              }}
              className="flex w-full items-center gap-2 border-t border-border/30 px-3 py-2 text-xs transition-colors hover:bg-secondary"
            >
              <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: getLabelColor(label) }} />
              <span className="truncate">{label.name}</span>
              {label.id === value && <Check className="ml-auto h-3 w-3 text-primary" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
