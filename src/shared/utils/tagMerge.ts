import type { MealieRecipeTag } from "@/shared/types/mealie/Tags.ts"

export interface TagMergeRecommendation {
  key: string
  winnerTag: MealieRecipeTag
  tags: MealieRecipeTag[]
}

function normalizeBasicTagName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
}

function normalizeSingularCandidate(name: string): string {
  const normalized = normalizeBasicTagName(name)
  return normalized
    .split(" ")
    .map(singularizeWord)
    .join(" ")
}

function singularizeWord(word: string): string {
  if (word.length <= 3) return word

  // English irregular/plural-like endings first.
  if (word.endsWith("ies") && word.length > 4) {
    return `${word.slice(0, -3)}y`
  }
  if (word.endsWith("oes") && word.length > 4) {
    return word.slice(0, -2)
  }
  if (word.endsWith("ves") && word.length > 4) {
    const base = word.slice(0, -3)
    return `${base}f`
  }
  if (
    (word.endsWith("ches") ||
      word.endsWith("shes") ||
      word.endsWith("sses") ||
      word.endsWith("xes") ||
      word.endsWith("zes")) &&
    word.length > 4
  ) {
    return word.slice(0, -2)
  }

  // French/regular plural fallback.
  if ((word.endsWith("s") || word.endsWith("x")) && word.length > 3) {
    return word.slice(0, -1)
  }

  return word
}

function isPluralLike(name: string): boolean {
  const normalized = normalizeBasicTagName(name)
  return normalized.endsWith("s") || normalized.endsWith("x")
}

function pickWinnerTag(tags: MealieRecipeTag[]): MealieRecipeTag {
  return [...tags].sort((a, b) => {
    const pluralScoreA = isPluralLike(a.name) ? 1 : 0
    const pluralScoreB = isPluralLike(b.name) ? 1 : 0
    if (pluralScoreA !== pluralScoreB) return pluralScoreB - pluralScoreA
    if (a.name.length !== b.name.length) return b.name.length - a.name.length
    return a.name.localeCompare(b.name, "fr", { sensitivity: "base" })
  })[0]
}

export function buildTagMergeRecommendations(tags: MealieRecipeTag[]): TagMergeRecommendation[] {
  const groups = new Map<string, MealieRecipeTag[]>()

  for (const tag of tags) {
    const key = normalizeSingularCandidate(tag.name)
    if (!key) continue
    const current = groups.get(key) ?? []
    current.push(tag)
    groups.set(key, current)
  }

  return [...groups.entries()]
    .map(([key, groupTags]) => {
      const distinctNames = new Set(groupTags.map((tag) => normalizeBasicTagName(tag.name)))
      if (groupTags.length < 2 || distinctNames.size < 2) return null

      const winnerTag = pickWinnerTag(groupTags)
      return {
        key,
        winnerTag,
        tags: [...groupTags].sort((a, b) => a.name.localeCompare(b.name, "fr", { sensitivity: "base" })),
      }
    })
    .filter((group): group is TagMergeRecommendation => group !== null)
    .sort((a, b) => a.winnerTag.name.localeCompare(b.winnerTag.name, "fr", { sensitivity: "base" }))
}
