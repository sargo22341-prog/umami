import { useEffect, useRef, useState } from "react"

import { Input } from "components/ui"

export function InlineEditCompactNumber({
  label,
  value,
  unit,
  placeholder,
  onChange,
  disabled,
  step = "0.1",
  inputMode = "decimal",
}: {
  label: string
  value: string
  unit?: string
  placeholder?: string
  onChange: (value: string) => void
  disabled?: boolean
  step?: string
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"]
}) {
  const [editing, setEditing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [editing])

  if (editing) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-input bg-background px-2 py-1 text-sm">
        <span className="text-muted-foreground">{label}</span>
        <Input
          ref={inputRef}
          type="number"
          inputMode={inputMode}
          step={step}
          min="0"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={() => setEditing(false)}
          disabled={disabled}
          className="h-6 w-20 border-0 px-1 py-0 shadow-none focus-visible:ring-0"
          placeholder={placeholder}
        />
        {unit ? <span className="text-xs text-muted-foreground">{unit}</span> : null}
      </span>
    )
  }

  return (
    <button
      type="button"
      onClick={() => !disabled && setEditing(true)}
      className="inline-flex items-center gap-1 rounded-md border border-transparent px-2 py-1 text-sm text-muted-foreground transition-colors hover:border-border/60 hover:bg-muted/40"
      title={disabled ? undefined : "Cliquer pour modifier"}
    >
      <span>{label}</span>
      <span className="font-medium text-foreground">
        {value || placeholder || "-"}
        {unit ? ` ${unit}` : ""}
      </span>
    </button>
  )
}
