import type { RecipeFormIngredient } from "@/shared/types/mealie/Recipes.ts"
import type { MealieIngredientFoodOutput } from "@/shared/types/mealie/food.ts"
import type { MealieIngredientUnitOutput } from "@/shared/types/mealie/Units.ts"
import {
  buildPreferredUnitLabel,
  normalizeMatcherText,
  resolveIngredientFood,
} from "@/shared/utils/ingredientMatching.ts"

const UNICODE_FRACTION_REPLACEMENTS: Record<string, string> = {
  "\u00BC": "1/4",
  "\u00BD": "1/2",
  "\u00BE": "3/4",
  "\u2150": "1/7",
  "\u2151": "1/9",
  "\u2152": "1/10",
  "\u2153": "1/3",
  "\u2154": "2/3",
  "\u2155": "1/5",
  "\u2156": "2/5",
  "\u2157": "3/5",
  "\u2158": "4/5",
  "\u2159": "1/6",
  "\u215A": "5/6",
  "\u215B": "1/8",
  "\u215C": "3/8",
  "\u215D": "5/8",
  "\u215E": "7/8",
}

const NUMBER_WORD_VALUES = new Map<string, number>([
  ["un", 1],
  ["une", 1],
  ["deux", 2],
  ["trois", 3],
  ["quatre", 4],
  ["cinq", 5],
  ["six", 6],
  ["sept", 7],
  ["huit", 8],
  ["neuf", 9],
  ["dix", 10],
  ["demi", 0.5],
  ["demie", 0.5],
  ["quart", 0.25],
  ["quarts", 0.25],
  ["tiers", 1 / 3],
])

function buildEmptyParsedIngredient(food: string): RecipeFormIngredient {
  return {
    quantity: "",
    unit: "",
    food,
    note: "",
  }
}

function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&#149;|&bull;/gi, "*")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
}

function replaceUnicodeFractions(input: string): string {
  return [...input].map((character) => UNICODE_FRACTION_REPLACEMENTS[character] ?? character).join("")
}

function cleanIngredientText(raw: string): string {
  return replaceUnicodeFractions(decodeHtmlEntities(raw))
    .replace(/^\s*(?:\*|&#149;|&bull;)\s*/i, "")
    .replace(/\s+/g, " ")
    .trim()
}

function parseQuantityValue(quantityText: string): number | null {
  const trimmed = quantityText.trim().replace(",", ".")
  if (!trimmed) return null

  const mixedMatch = trimmed.match(/^(\d+)\s+(\d+)\s*\/\s*(\d+)$/)
  if (mixedMatch) {
    const whole = Number(mixedMatch[1])
    const numerator = Number(mixedMatch[2])
    const denominator = Number(mixedMatch[3])
    if (!denominator) return null
    return whole + (numerator / denominator)
  }

  const fractionMatch = trimmed.match(/^(\d+)\s*\/\s*(\d+)$/)
  if (fractionMatch) {
    const numerator = Number(fractionMatch[1])
    const denominator = Number(fractionMatch[2])
    if (!denominator) return null
    return numerator / denominator
  }

  if (/^\d+(?:\.\d+)?$/.test(trimmed)) {
    return Number(trimmed)
  }

  return NUMBER_WORD_VALUES.get(normalizeMatcherText(trimmed)) ?? null
}

function formatQuantityValue(value: number): string {
  if (!Number.isFinite(value)) return ""
  if (Number.isInteger(value)) return String(value)
  return Number(value.toFixed(4)).toString()
}

function extractLeadingQuantity(input: string): { quantity: string; rest: string } | null {
  const quantityMatch = input.match(
    /^(?<quantity>(?:\d+\s+\d+\s*\/\s*\d+)|(?:\d+\s*\/\s*\d+)|(?:\d+(?:[.,]\d+)?)|(?:un|une|deux|trois|quatre|cinq|six|sept|huit|neuf|dix|demi(?:e)?|quart|quarts|tiers))(?=\s|$)/i,
  )
  if (!quantityMatch?.groups?.quantity) return null

  const parsedValue = parseQuantityValue(quantityMatch.groups.quantity)
  if (parsedValue == null) return null

  return {
    quantity: formatQuantityValue(parsedValue),
    rest: input.slice(quantityMatch[0].length).trim(),
  }
}

function buildUnitAliases(unit: MealieIngredientUnitOutput): string[] {
  return [
    unit.name,
    unit.pluralName ?? "",
    unit.abbreviation ?? "",
    unit.pluralAbbreviation ?? "",
    ...(unit.aliases ?? []).map((alias) => alias.name),
  ]
    .map((value) => value.trim())
    .filter(Boolean)
}

function matchMealieUnitByAlias(
  unitText: string,
  availableUnits: MealieIngredientUnitOutput[],
): MealieIngredientUnitOutput | null {
  const normalizedNeedle = normalizeMatcherText(unitText)
  if (!normalizedNeedle) return null

  let bestMatch: MealieIngredientUnitOutput | null = null
  let bestScore = -1

  for (const unit of availableUnits) {
    for (const alias of buildUnitAliases(unit)) {
      const normalizedAlias = normalizeMatcherText(alias)
      if (!normalizedAlias || normalizedAlias !== normalizedNeedle) continue

      const score = normalizedAlias.length
      if (score > bestScore) {
        bestMatch = unit
        bestScore = score
      }
    }
  }

  return bestMatch
}

function matchLeadingMealieUnit(
  rest: string,
  availableUnits: MealieIngredientUnitOutput[],
): { unit: MealieIngredientUnitOutput; consumedLength: number } | null {
  if (!rest.trim()) return null

  let bestMatch: { unit: MealieIngredientUnitOutput; consumedLength: number; score: number } | null = null

  for (const unit of availableUnits) {
    for (const alias of buildUnitAliases(unit)) {
      const trimmedAlias = alias.trim()
      if (!trimmedAlias) continue

      const escapedAlias = trimmedAlias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
      const pattern = new RegExp(`^${escapedAlias}(?=$|\\s|[),;:.])`, "i")
      const match = rest.match(pattern)
      if (!match) continue

      const score = normalizeMatcherText(trimmedAlias).length
      if (!bestMatch || score > bestMatch.score) {
        bestMatch = {
          unit,
          consumedLength: match[0].length,
          score,
        }
      }
    }
  }

  return bestMatch ? { unit: bestMatch.unit, consumedLength: bestMatch.consumedLength } : null
}

function parseKnownLocalUnit(rest: string): { unit: string; rest: string } | null {
  const patterns: Array<{ pattern: RegExp; unit: string }> = [
    { pattern: /^cuill(?:e|é|è)res?\s+(?:a|à)\s+soupes?(?=$|\s|[),;:.])/i, unit: "cuillere a soupe" },
    { pattern: /^cuill(?:e|é|è)res?\s+(?:a|à)\s+caf(?:e|é)s?(?=$|\s|[),;:.])/i, unit: "cuillere a cafe" },
    { pattern: /^c\.?\s*(?:a|à)\.?\s*s(?:oupe)?\.?(?=$|\s|[),;:.])/i, unit: "cuillere a soupe" },
    { pattern: /^c\.?\s*(?:a|à)\.?\s*c(?:af(?:e|é))?\.?(?=$|\s|[),;:.])/i, unit: "cuillere a cafe" },
    { pattern: /^cs(?=$|\s|[),;:.])/i, unit: "cuillere a soupe" },
    { pattern: /^cc(?=$|\s|[),;:.])/i, unit: "cuillere a cafe" },
    { pattern: /^gousses?(?=$|\s|[),;:.])/i, unit: "gousse" },
    { pattern: /^pinc(?:e|é)es?(?=$|\s|[),;:.])/i, unit: "pincee" },
    { pattern: /^(kg|g|mg|l|cl|ml)(?=$|\s|[),;:.])/i, unit: "" },
  ]

  for (const { pattern, unit } of patterns) {
    const match = rest.match(pattern)
    if (!match) continue

    return {
      unit: unit || match[1].toLowerCase(),
      rest: rest.slice(match[0].length).trim(),
    }
  }

  return null
}

function stripIngredientArticles(rest: string): string {
  return rest
    .replace(/^(?:de|du|des|la|le)\s+/i, "")
    .replace(/^d['’]\s*/i, "")
    .replace(/^l['’]\s*/i, "")
    .trim()
}

function parseIngredientRegex(raw: string, availableUnits: MealieIngredientUnitOutput[] = []): RecipeFormIngredient {
  const cleaned = cleanIngredientText(raw)
  if (!cleaned) return buildEmptyParsedIngredient("")

  const quantityResult = extractLeadingQuantity(cleaned)
  if (!quantityResult) {
    return buildEmptyParsedIngredient(cleaned)
  }

  const { quantity, rest: quantityRest } = quantityResult
  let rest = quantityRest
  rest = rest.replace(/^(?:de\s+|d['’]\s*)/i, "")

  let unit = ""
  let unitId: string | undefined

  const localUnit = parseKnownLocalUnit(rest)
  if (localUnit) {
    unit = localUnit.unit
    rest = localUnit.rest
  }

  if (unit && availableUnits.length > 0) {
    const matchedUnit = matchMealieUnitByAlias(unit, availableUnits)
    if (matchedUnit) {
      unit = buildPreferredUnitLabel(matchedUnit)
      unitId = matchedUnit.id
    }
  }

  if (!unit && availableUnits.length > 0) {
    const leadingMatch = matchLeadingMealieUnit(rest, availableUnits)
    if (leadingMatch) {
      unit = buildPreferredUnitLabel(leadingMatch.unit)
      unitId = leadingMatch.unit.id
      rest = rest.slice(leadingMatch.consumedLength).trim()
    }
  }

  const food = stripIngredientArticles(rest) || cleaned

  return {
    quantity,
    unit,
    unitId,
    food,
    note: "",
  }
}

export async function parseSourceIngredients(
  ingredients: string[],
  availableUnits: MealieIngredientUnitOutput[] = [],
  availableFoods: MealieIngredientFoodOutput[] = [],
): Promise<RecipeFormIngredient[]> {
  return ingredients.map((ingredient) =>
    resolveIngredientFood(parseIngredientRegex(ingredient, availableUnits), availableFoods),
  )
}
