import { useEffect, useId, useMemo, useRef, useState } from "react"

import { cn } from "@/lib/utils.ts"
import { normalizeText } from "@/shared/utils/text.ts"

export interface ComboboxOption {
  id: string
  label: string
}

interface ComboboxProps {
  value: string
  onChange: (value: string, option?: ComboboxOption) => void
  options: ComboboxOption[]
  placeholder?: string
  disabled?: boolean
  className?: string
  inputClassName?: string
  allowCreate?: boolean
  createLabel?: (value: string) => string
  onFocus?: () => void
  emptyMessage?: string
  maxItems?: number
  showAllOnExactMatch?: boolean
  "aria-label"?: string
}

function sortOptions(options: ComboboxOption[], query: string) {
  return [...options].sort((a, b) => {
    const aLabel = normalizeText(a.label)
    const bLabel = normalizeText(b.label)

    const aExact = aLabel === query ? 1 : 0
    const bExact = bLabel === query ? 1 : 0
    if (aExact !== bExact) return bExact - aExact

    const aStarts = aLabel.startsWith(query) ? 1 : 0
    const bStarts = bLabel.startsWith(query) ? 1 : 0
    if (aStarts !== bStarts) return bStarts - aStarts

    return a.label.localeCompare(b.label, "fr")
  })
}

export function Combobox({
  value,
  onChange,
  options,
  placeholder,
  disabled,
  className,
  inputClassName,
  allowCreate = false,
  createLabel = (nextValue) => `Creer "${nextValue}"`,
  onFocus,
  emptyMessage = "Aucun resultat",
  maxItems = 20,
  showAllOnExactMatch = false,
  "aria-label": ariaLabel,
}: ComboboxProps) {
  const [open, setOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const selectingRef = useRef(false)
  const id = useId()

  const normalizedValue = normalizeText(value)

  const visibleItems = useMemo(() => {
    const hasExactMatch = options.some((option) => normalizeText(option.label) === normalizedValue)
    const shouldShowAll = showAllOnExactMatch && hasExactMatch

    const filtered = !shouldShowAll && normalizedValue
      ? options.filter((option) => normalizeText(option.label).includes(normalizedValue))
      : options

    const sorted = sortOptions(filtered, normalizedValue)
    const canCreate = allowCreate && normalizedValue.length > 0 && !hasExactMatch
    const withCreate = canCreate
      ? [...sorted, { id: "__create__", label: createLabel(value.trim()) }]
      : sorted

    return withCreate.slice(0, maxItems)
  }, [allowCreate, createLabel, maxItems, normalizedValue, options, showAllOnExactMatch, value])

  useEffect(() => {
    setHighlighted(-1)
  }, [value])

  useEffect(() => {
    if (highlighted < 0 || !listRef.current) return
    const element = listRef.current.children[highlighted] as HTMLElement | undefined
    element?.scrollIntoView({ block: "nearest" })
  }, [highlighted])

  const selectItem = (item: ComboboxOption) => {
    if (item.id === "__create__") {
      onChange(value.trim())
    } else {
      onChange(item.label, item)
    }

    setOpen(false)
    requestAnimationFrame(() => {
      selectingRef.current = false
      inputRef.current?.focus()
    })
  }

  const handleOptionPointerDown = (
    event: React.PointerEvent<HTMLLIElement> | React.MouseEvent<HTMLLIElement>,
    item: ComboboxOption,
  ) => {
    selectingRef.current = true
    event.preventDefault()
    event.stopPropagation()
    selectItem(item)
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) {
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        setOpen(true)
      }
      return
    }

    if (event.key === "ArrowDown") {
      event.preventDefault()
      setHighlighted((current) => Math.min(current + 1, visibleItems.length - 1))
      return
    }

    if (event.key === "ArrowUp") {
      event.preventDefault()
      setHighlighted((current) => Math.max(current - 1, -1))
      return
    }

    if (event.key === "Enter") {
      event.preventDefault()
      if (highlighted >= 0 && visibleItems[highlighted]) {
        selectItem(visibleItems[highlighted])
      } else {
        setOpen(false)
      }
      return
    }

    if (event.key === "Escape") {
      setOpen(false)
    }
  }

  const dropdown = open ? (
    <ul
      ref={listRef}
      id={`${id}-list`}
      role="listbox"
      data-combobox-dropdown="true"
      data-autocomplete-dropdown="true"
      className={cn(
        "absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-border bg-white text-foreground shadow-md",
        "dark:bg-zinc-900",
      )}
    >
      {visibleItems.length > 0 ? (
        visibleItems.map((item, index) => (
          <li
            key={item.id}
            role="option"
            aria-selected={index === highlighted}
            onPointerDown={(event) => handleOptionPointerDown(event, item)}
            onMouseDown={(event) => handleOptionPointerDown(event, item)}
            onMouseEnter={() => setHighlighted(index)}
            className={cn(
              "cursor-pointer px-3 py-2 text-sm",
              index === highlighted
                ? "bg-accent text-accent-foreground"
                : "hover:bg-accent hover:text-accent-foreground",
              item.id === "__create__" && "italic text-muted-foreground",
            )}
          >
            {item.label}
          </li>
        ))
      ) : (
        <li className="px-3 py-2 text-sm text-muted-foreground">{emptyMessage}</li>
      )}
    </ul>
  ) : null

  return (
    <div className={cn("relative", className)}>
      <input
        ref={inputRef}
        id={id}
        type="text"
        value={value}
        onChange={(event) => {
          onChange(event.target.value)
          setOpen(true)
        }}
        onFocus={() => {
          onFocus?.()
          setOpen(true)
        }}
        onMouseDown={() => {
          if (disabled) return
          if (document.activeElement === inputRef.current && !open) {
            setOpen(true)
          }
        }}
        onBlur={() => {
          if (selectingRef.current) return
          setTimeout(() => setOpen(false), 120)
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={open ? `${id}-list` : undefined}
        autoComplete="off"
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors",
          "placeholder:text-muted-foreground",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          "disabled:cursor-not-allowed disabled:opacity-50",
          inputClassName,
        )}
      />

      {dropdown}
    </div>
  )
}

export type { ComboboxProps }
