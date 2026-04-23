import { SEASON_LABELS, type Season } from "@/shared/types/Season.ts"
import { cn } from "@/lib/utils.ts"

/* Styles Rgba cohérents avec la palette du design system */
const SEASON_STYLES: Record<Season, { pill: string; dot: string }> = {
  printemps: {
    pill: "bg-[rgba(220,240,210,1)] text-[rgba(60,110,70,1)] dark:bg-[rgba(50,80,60,1)] dark:text-[rgba(170,220,180,1)]",
    dot: "bg-[rgba(70,160,90,1)]",
  },
  ete: {
    pill: "bg-[rgba(255,240,200,1)] text-[rgba(170,120,40,1)] dark:bg-[rgba(90,70,40,1)] dark:text-[rgba(255,210,120,1)]",
    dot: "bg-[rgba(255,180,60,1)]",
  },
  automne: {
    pill: "bg-[rgba(245,230,210,1)] text-[rgba(160,90,50,1)] dark:bg-[rgba(80,50,35,1)] dark:text-[rgba(230,160,100,1)]",
    dot: "bg-[rgba(196,92,58,1)]",
  },
  hiver: {
    pill: "bg-[rgba(220,230,245,1)] text-[rgba(70,90,130,1)] dark:bg-[rgba(40,50,80,1)] dark:text-[rgba(160,180,220,1)]",
    dot: "bg-[rgba(70,120,200,1)]",
  },
  sans: {
    pill: "",
    dot: "",
  },
}

const SEASON_ICONS: Record<Season, string> = {
  printemps: "🌱",
  ete: "☀️",
  automne: "🍂",
  hiver: "❄️",
  sans: ""
}

interface SeasonBadgeProps {
  season: Season
  size?: "sm" | "md"
}

export function SeasonBadge({ season, size = "sm" }: SeasonBadgeProps) {
  const styles = SEASON_STYLES[season]

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-semibold",
        styles.pill,
        size === "sm"
          ? "px-1.5 py-0.5 text-[10px]"
          : "px-2.5 py-1 text-xs",
      )}
    >
      <span role="img" aria-hidden="true" className="text-[11px]">
        {SEASON_ICONS[season]}
      </span>
      {SEASON_LABELS[season]}
    </span>
  )
}
