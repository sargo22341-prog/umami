import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils.ts"

interface RouteFallbackProps {
  className?: string
}

export function RouteFallback({ className }: RouteFallbackProps) {
  return (
    <div
      className={cn(
        "flex min-h-[40vh] items-center justify-center",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Chargement...
      </div>
    </div>
  )
}
