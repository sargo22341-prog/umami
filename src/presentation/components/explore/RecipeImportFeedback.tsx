import { Link } from "react-router-dom"
import { AlertCircle, CheckCircle2 } from "lucide-react"

import { cn } from "@/lib/utils.ts"
import type { ExploreImportState } from "@/shared/types/exploreRecipes/exploreRecipes.ts"

interface RecipeImportFeedbackProps {
  state: ExploreImportState
  className?: string
}

export function RecipeImportFeedback({
  state,
  className,
}: RecipeImportFeedbackProps) {
  if (state.state === "idle" || state.state === "loading") return null

  if (state.state === "error") {
    return (
      <p className={cn("flex items-start gap-1.5 text-xs text-destructive", className)}>
        <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        {state.message}
      </p>
    )
  }

  return (
    <div className={cn("space-y-1.5", className)}>
      {state.slug ? (
        <Link
          to={`/recipes/${state.slug}`}
          className={cn(
            "flex items-center gap-1.5 rounded-[var(--radius-lg)] px-3 py-2 text-xs font-semibold transition-opacity hover:opacity-80",
            "bg-[oklch(0.93_0.06_145)] text-[oklch(0.38_0.14_145)]",
            "dark:bg-[oklch(0.22_0.06_145)] dark:text-[oklch(0.72_0.14_145)]",
          )}
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          Voir la recette
        </Link>
      ) : (
        <p
          className={cn(
            "flex items-start gap-1.5 rounded-[var(--radius-lg)] px-3 py-2 text-xs font-semibold",
            "bg-[oklch(0.93_0.06_145)] text-[oklch(0.38_0.14_145)]",
            "dark:bg-[oklch(0.22_0.06_145)] dark:text-[oklch(0.72_0.14_145)]",
          )}
        >
          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {state.message}
        </p>
      )}
      {state.imageWarning && (
        <p className="flex items-start gap-1.5 text-xs text-amber-700 dark:text-amber-300">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {state.imageWarning}
        </p>
      )}
    </div>
  )
}
