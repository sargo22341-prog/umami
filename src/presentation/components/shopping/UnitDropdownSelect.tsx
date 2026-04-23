import { useEffect, useMemo, useRef, useState } from "react"
import { Check, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils.ts"
import type { MealieIngredientUnitOutput } from "@/shared/types/mealie/Units.ts"
import { Input } from "components/ui"

type UnitValueMode = "id" | "name"

interface UnitDropdownSelectProps {
  units: MealieIngredientUnitOutput[]
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  buttonClassName?: string
  searchable?: boolean
  valueMode?: UnitValueMode
  onOpen?: () => void
}

export function UnitDropdownSelect({
  units,
  value = "",
  onChange,
  placeholder = "Aucune",
  disabled = false,
  className,
  buttonClassName,
  searchable = true,
  valueMode = "id",
  onOpen,
}: UnitDropdownSelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const wrapperRef = useRef<HTMLDivElement>(null)

  const getUnitValue = (unit: MealieIngredientUnitOutput) =>
    valueMode === "name" ? unit.name : unit.id

  const selected = units.find((unit) => getUnitValue(unit) === value)

  const filteredUnits = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return units

    return units.filter((unit) =>
      unit.name.toLowerCase().includes(query),
    )
  }, [search, units])

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (!wrapperRef.current?.contains(target)) {
        setOpen(false)
      }
    }

    document.addEventListener("mousedown", handlePointerDown)
    return () => {
      document.removeEventListener("mousedown", handlePointerDown)
    }
  }, [])

  const handleToggle = () => {
    if (disabled) return
    if (!open) setSearch("")
    if (!open) onOpen?.()
    setOpen((prev) => !prev)
  }

  const applyValue = (nextValue: string) => {
    onChange(nextValue)
    setSearch("")
    setOpen(false)
  }

  return (
    <div ref={wrapperRef} className={cn("relative w-full", className)}>
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={cn(
          "flex h-10 w-full items-center justify-between gap-2 rounded-[var(--radius-lg)] border border-input bg-background px-3 text-sm text-foreground",
          "disabled:cursor-not-allowed disabled:opacity-50",
          buttonClassName,
        )}
      >
        <span className="truncate">{selected?.name ?? placeholder}</span>
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute z-[120] mt-1 w-full overflow-hidden rounded-[var(--radius-xl)] border border-border/50 bg-card shadow-warm-md">
          <div className="flex max-h-80 flex-col py-1">
            {searchable && (
              <div className="border-b border-border/50 px-2 pb-2">
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Rechercher une unité..."
                  className="h-9"
                  autoFocus
                />
              </div>
            )}

            <div className="max-h-60 overflow-y-auto">
              <button
                type="button"
                onClick={() => applyValue("")}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-secondary",
                  value === "" && "text-primary",
                )}
              >
                <span className="truncate">{placeholder}</span>
                {value === "" && (
                  <Check className="ml-auto h-4 w-4 text-primary" />
                )}
              </button>

              {filteredUnits.map((unit) => {
                const unitValue = getUnitValue(unit)

                return (
                  <button
                    key={unit.id}
                    type="button"
                    onClick={() => applyValue(unitValue)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-secondary"
                  >
                    <span className="truncate">{unit.name}</span>
                    {unitValue === value && (
                      <Check className="ml-auto h-4 w-4 text-primary" />
                    )}
                  </button>
                )
              })}

              {filteredUnits.length === 0 && (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  Aucun résultat
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
