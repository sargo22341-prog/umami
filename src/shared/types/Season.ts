export type Season = "printemps" | "ete" | "automne" | "hiver" | "sans"

export const SEASONS: Season[] = ["printemps", "ete", "automne", "hiver", "sans"]

export const SEASON_LABELS: Record<Season, string> = {
  printemps: "Printemps",
  ete: "Été",
  automne: "Automne",
  hiver: "Hiver",
  sans: "Sans Saison",
}