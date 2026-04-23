import { Colorful } from "@uiw/react-color"
import { Dices, Paintbrush } from "lucide-react"
import { Input } from "./input.tsx"
import { Button } from "./button.tsx"
import { cn } from "@/lib/utils.ts"

interface ColorPickerFieldProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  randomizeLabel?: string
  onRandomize?: () => void
  className?: string
}

export function ColorPickerField({
  value,
  onChange,
  disabled = false,
  randomizeLabel = "Aléatoire",
  onRandomize,
  className,
}: ColorPickerFieldProps) {
  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-3">
        <span
          className="h-11 w-11 shrink-0 rounded-full border border-border/60 shadow-sm"
          style={{ backgroundColor: value }}
        />
        <Input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          className="flex-1 font-mono uppercase"
        />
        {onRandomize && (
          <Button
            type="button"
            variant="outline"
            onClick={onRandomize}
            disabled={disabled}
            className="gap-2"
          >
            <Dices className="h-4 w-4" />
            {randomizeLabel}
          </Button>
        )}
      </div>

      <div className="rounded-[var(--radius-xl)] border border-border/50 bg-secondary/20 p-3">
        <div className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
          <Paintbrush className="h-4 w-4 text-muted-foreground" />
          Choisis une couleur
        </div>
        <div className={cn(disabled && "pointer-events-none opacity-60")}>
          <Colorful
            color={value}
            onChange={(color) => onChange(color.hex)}
            style={{ width: "100%", maxWidth: "100%" }}
            disableAlpha
          />
        </div>
      </div>
    </div>
  )
}
