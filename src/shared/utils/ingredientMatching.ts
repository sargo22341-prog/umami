import type { RecipeFormIngredient } from "@/shared/types/recipeForm.ts"
import type { MealieIngredientFoodAlias, MealieIngredientFoodOutput } from "@/shared/types/mealie/food.ts"
import type { MealieIngredientUnitOutput } from "@/shared/types/mealie/Units.ts"

export interface IngredientMatch<TItem> {
  item: TItem
  via: string
  score: number
  strategy: "id" | "exact" | "singular" | "fuzzy"
}

export function normalizeMatcherText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['’]/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

export function singularizeFoodName(value: string): string {
  const normalized = normalizeMatcherText(value)
  if (!normalized) return ""

  return normalized
    .split(" ")
    .map((token) => {
      if (token.length <= 4) return token
      if (token.endsWith("s") && !token.endsWith("ss")) return token.slice(0, -1)
      return token
    })
    .join(" ")
}

function findExactFoodMatch(
  normalizedNeedle: string,
  foods: MealieIngredientFoodOutput[],
): IngredientMatch<MealieIngredientFoodOutput> | null {
  let bestMatch: IngredientMatch<MealieIngredientFoodOutput> | null = null

  for (const food of foods) {
    for (const candidate of getFoodMatchCandidates(food)) {
      const normalizedCandidate = normalizeMatcherText(candidate.value)
      if (!normalizedCandidate || normalizedCandidate !== normalizedNeedle) continue

      const score = normalizedCandidate.length
      if (!bestMatch || score > bestMatch.score) {
        bestMatch = {
          item: food,
          via: candidate.via,
          score,
          strategy: "exact",
        }
      }
    }
  }

  return bestMatch
}

function findSingularFoodMatch(
  singularNeedle: string,
  foods: MealieIngredientFoodOutput[],
): IngredientMatch<MealieIngredientFoodOutput> | null {
  let bestMatch: IngredientMatch<MealieIngredientFoodOutput> | null = null

  for (const food of foods) {
    for (const candidate of getFoodMatchCandidates(food)) {
      const singularCandidate = singularizeFoodName(candidate.value)
      if (!singularCandidate || singularCandidate !== singularNeedle) continue

      const score = singularCandidate.length
      if (!bestMatch || score > bestMatch.score) {
        bestMatch = {
          item: food,
          via: candidate.via,
          score,
          strategy: "singular",
        }
      }
    }
  }

  return bestMatch
}

export function buildPreferredUnitLabel(unit: MealieIngredientUnitOutput): string {
  if (unit.useAbbreviation && unit.abbreviation?.trim()) return unit.abbreviation.trim()
  return unit.name.trim()
}

export function getUnitMatchCandidates(unit: MealieIngredientUnitOutput) {
  return [
    { value: unit.name, via: "name" },
    { value: unit.pluralName ?? "", via: "pluralName" },
    { value: unit.abbreviation ?? "", via: "abbreviation" },
    { value: unit.pluralAbbreviation ?? "", via: "pluralAbbreviation" },
    ...(unit.aliases ?? []).map((alias) => ({ value: alias.name, via: "alias" })),
  ]
    .map(({ value, via }) => ({ value: value.trim(), via }))
    .filter(({ value }) => Boolean(value))
}

export function findBestUnitMatch(
  unitName: string,
  units: MealieIngredientUnitOutput[],
  preferredUnitId?: string,
): IngredientMatch<MealieIngredientUnitOutput> | null {
  if (preferredUnitId) {
    const preferred = units.find((unit) => unit.id === preferredUnitId)
    if (preferred) {
      return {
        item: preferred,
        via: "id",
        score: Number.MAX_SAFE_INTEGER,
        strategy: "id",
      }
    }
  }

  const normalizedNeedle = normalizeMatcherText(unitName)
  if (!normalizedNeedle) return null

  let bestMatch: IngredientMatch<MealieIngredientUnitOutput> | null = null

  for (const unit of units) {
    for (const candidate of getUnitMatchCandidates(unit)) {
      const normalizedCandidate = normalizeMatcherText(candidate.value)
      if (!normalizedCandidate || normalizedCandidate !== normalizedNeedle) continue

      const score = normalizedCandidate.length
      if (!bestMatch || score > bestMatch.score) {
        bestMatch = {
          item: unit,
          via: candidate.via,
          score,
          strategy: "exact",
        }
      }
    }
  }

  return bestMatch
}

export function getFoodMatchCandidates(food: MealieIngredientFoodOutput) {
  return [
    { value: food.name, via: "name" },
    { value: food.pluralName ?? "", via: "pluralName" },
    ...(food.aliases ?? []).map((alias) => ({ value: alias.name, via: "alias" })),
  ]
    .map(({ value, via }) => ({ value: value.trim(), via }))
    .filter(({ value }) => Boolean(value))
}

export function findBestFoodMatch(
  foodName: string,
  foods: MealieIngredientFoodOutput[],
  preferredFoodId?: string,
): IngredientMatch<MealieIngredientFoodOutput> | null {
  if (preferredFoodId) {
    const preferred = foods.find((food) => food.id === preferredFoodId)
    if (preferred) {
      return {
        item: preferred,
        via: "id",
        score: Number.MAX_SAFE_INTEGER,
        strategy: "id",
      }
    }
  }

  const normalizedNeedle = normalizeMatcherText(foodName)
  if (!normalizedNeedle) return null
  const exactMatch = findExactFoodMatch(normalizedNeedle, foods)
  if (exactMatch) return exactMatch

  const singularNeedle = singularizeFoodName(foodName)
  if (!singularNeedle || singularNeedle === normalizedNeedle) return null
  return findSingularFoodMatch(singularNeedle, foods)
}

function scoreFoodCandidate(needle: string, candidate: string): number {
  if (!needle || !candidate) return -1
  if (needle === candidate) return 1200

  const singularNeedle = singularizeFoodName(needle)
  const singularCandidate = singularizeFoodName(candidate)
  if (singularNeedle && singularNeedle === singularCandidate) return 1100

  const needleTokens = needle.split(" ").filter(Boolean)
  const candidateTokens = candidate.split(" ").filter(Boolean)
  if (needleTokens.length === 0 || candidateTokens.length === 0) return -1

  const candidateSet = new Set(candidateTokens)
  const overlapCount = needleTokens.filter((token) => candidateSet.has(token)).length
  const overlapRatio = overlapCount / Math.max(needleTokens.length, candidateTokens.length)

  let score = overlapCount * 120 + Math.round(overlapRatio * 100)

  if (candidate.startsWith(needle) || needle.startsWith(candidate)) score += 240
  else if (candidate.includes(needle) || needle.includes(candidate)) score += 170

  const compactNeedle = needle.replace(/\s+/g, "")
  const compactCandidate = candidate.replace(/\s+/g, "")
  if (compactCandidate.includes(compactNeedle) || compactNeedle.includes(compactCandidate)) {
    score += 80
  }

  score -= Math.abs(candidate.length - needle.length)
  return score
}

export function getFoodSuggestions(
  foodName: string,
  foods: MealieIngredientFoodOutput[],
  maxSuggestions = 5,
): Array<IngredientMatch<MealieIngredientFoodOutput>> {
  const normalizedNeedle = normalizeMatcherText(foodName)
  if (!normalizedNeedle) return []

  const scoredByFoodId = new Map<string, IngredientMatch<MealieIngredientFoodOutput>>()

  for (const food of foods) {
    for (const candidate of getFoodMatchCandidates(food)) {
      const normalizedCandidate = normalizeMatcherText(candidate.value)
      const score = scoreFoodCandidate(normalizedNeedle, normalizedCandidate)
      if (score < 140) continue

      const current = scoredByFoodId.get(food.id)
      if (!current || score > current.score) {
        scoredByFoodId.set(food.id, {
          item: food,
          via: candidate.via,
          score,
          strategy: "fuzzy",
        })
      }
    }
  }

  return [...scoredByFoodId.values()]
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score
      return left.item.name.localeCompare(right.item.name, "fr", { sensitivity: "base" })
    })
    .slice(0, maxSuggestions)
}

export function resolveIngredientFood(
  ingredient: RecipeFormIngredient,
  availableFoods: MealieIngredientFoodOutput[],
): RecipeFormIngredient {
  const foodMatch = findBestFoodMatch(ingredient.food, availableFoods, ingredient.foodId)
  if (!foodMatch) {
    return {
      ...ingredient,
      foodId: undefined,
    }
  }

  return {
    ...ingredient,
    food: foodMatch.item.name,
    foodId: foodMatch.item.id,
  }
}

export function isIngredientFullyMatched(params: {
  ingredient: RecipeFormIngredient
  availableFoods: MealieIngredientFoodOutput[]
  availableUnits: MealieIngredientUnitOutput[]
}): boolean {
  const foodMatch = findBestFoodMatch(
    params.ingredient.food,
    params.availableFoods,
    params.ingredient.foodId,
  )
  if (!foodMatch) return false

  if (!params.ingredient.unit.trim()) return true

  return Boolean(
    findBestUnitMatch(params.ingredient.unit, params.availableUnits, params.ingredient.unitId),
  )
}

export function normalizeFoodAliasValue(value: string): string {
  return value.trim().replace(/\s+/g, " ")
}

export function buildFoodAliasesWithAddition(
  food: MealieIngredientFoodOutput,
  aliasToAdd: string,
): MealieIngredientFoodAlias[] {
  const normalizedAlias = normalizeFoodAliasValue(aliasToAdd)
  if (!normalizedAlias) {
    return food.aliases?.map((alias) => ({ name: alias.name })) ?? []
  }

  const existingKeys = new Set(
    [
      food.name,
      food.pluralName ?? "",
      ...(food.aliases ?? []).map((alias) => alias.name),
    ]
      .map((value) => normalizeMatcherText(value))
      .filter(Boolean),
  )

  const aliases = food.aliases?.map((alias) => ({ name: normalizeFoodAliasValue(alias.name) })) ?? []
  if (!existingKeys.has(normalizeMatcherText(normalizedAlias))) {
    aliases.push({ name: normalizedAlias })
  }

  return aliases
}
