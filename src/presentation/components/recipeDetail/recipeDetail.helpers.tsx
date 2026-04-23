import type { ReactNode } from "react"

import { parseDuration } from "@/shared/utils"
import type { MealieRecipeCategory } from "@/shared/types/mealie/Category.ts"
import type { MealieScrapedRecipePreview } from "@/shared/types/mealie/RecipeImport.ts"
import type { MealieRecipeIngredientOutput, RecipeFormData, RecipeFormIngredient } from "@/shared/types/mealie/Recipes.ts"
import type { MealieRecipeTag } from "@/shared/types/mealie/Tags.ts"
import type { ScrapedRecipeCategoryPreview, ScrapedRecipeTagPreview } from "@/shared/types/recipeImport.ts"
import type { RecipeSyncFieldPreview } from "./RecipeSyncDialog.tsx"

export const NUTRITION_FIELDS: Array<{
  key: keyof NonNullable<RecipeFormData["nutrition"]>
  label: string
  unit: string
}> = [
  { key: "calories", label: "Calories", unit: "kcal" },
  { key: "saturatedFatContent", label: "Graisses saturees", unit: "g" },
  { key: "fiberContent", label: "Fibres", unit: "g" },
  { key: "carbohydrateContent", label: "Glucides", unit: "g" },
  { key: "sugarContent", label: "Sucres", unit: "g" },
  { key: "fatContent", label: "Lipides", unit: "g" },
  { key: "proteinContent", label: "Proteines", unit: "g" },
  { key: "cholesterolContent", label: "Cholesterol", unit: "mg" },
  { key: "sodiumContent", label: "Sodium", unit: "mg" },
  { key: "transFatContent", label: "Graisses trans", unit: "g" },
  { key: "unsaturatedFatContent", label: "Graisses insaturees", unit: "g" },
]

export const NUTRITION_LAYOUT: Array<Array<(typeof NUTRITION_FIELDS)[number]>> = [
  NUTRITION_FIELDS.filter(({ key }) =>
    ["proteinContent", "fiberContent", "carbohydrateContent", "sugarContent"].includes(key),
  ),
  NUTRITION_FIELDS.filter(({ key }) =>
    ["saturatedFatContent", "fatContent", "cholesterolContent", "sodiumContent"].includes(key),
  ),
  NUTRITION_FIELDS.filter(({ key }) =>
    ["transFatContent", "unsaturatedFatContent"].includes(key),
  ),
]

export function parseScrapedServings(value?: string[]) {
  const firstMatch = value?.find((entry) => /\d/.test(entry))
  if (!firstMatch) return ""
  const match = firstMatch.match(/[\d.,]+/)
  return match ? match[0].replace(",", ".") : ""
}

export function extractNutritionNumberString(value: unknown) {
  if (value == null) return ""
  const normalized = String(value).trim().replace(",", ".")
  if (!normalized) return ""
  const match = normalized.match(/-?\d+(?:\.\d+)?/)
  return match ? match[0] : ""
}

export function normalizeNutritionValues(
  nutrition?: MealieScrapedRecipePreview["nutrition"] | RecipeFormData["nutrition"],
) {
  if (!nutrition) return {}

  return Object.fromEntries(
    NUTRITION_FIELDS.map(({ key }) => [key, extractNutritionNumberString(nutrition[key])]),
  ) as RecipeFormData["nutrition"]
}

export function normalizeListValue(value: Array<string | undefined | null>) {
  const lines = value
    .map((entry) => entry?.trim())
    .filter((entry): entry is string => Boolean(entry))
  return lines.length > 0 ? lines : ["-"]
}

export function formatRecipeIngredientLine(ingredient: RecipeFormIngredient) {
  return [ingredient.quantity, ingredient.unit, ingredient.food, ingredient.note]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(" ")
}

export function renderIngredientSourceComparison(
  current: RecipeFormIngredient | undefined,
  incoming: RecipeFormIngredient,
  key: string,
): ReactNode {
  const currentQuantity = current?.quantity.trim() ?? ""
  const currentUnit = current?.unit.trim() ?? ""
  const currentFood = current?.food.trim() ?? ""
  const currentNote = current?.note.trim() ?? ""
  const incomingQuantity = incoming.quantity.trim()
  const incomingUnit = incoming.unit.trim()
  const incomingFood = incoming.food.trim()
  const incomingNote = incoming.note.trim()

  const parts: ReactNode[] = []

  const pushPart = (value: string, changed: boolean, suffix = " ") => {
    if (!value) return
    parts.push(
      <span key={`${key}-${parts.length}`}>
        {changed ? <strong>{value}</strong> : value}
        {suffix}
      </span>,
    )
  }

  pushPart(incomingQuantity, incomingQuantity !== currentQuantity)
  pushPart(incomingUnit, incomingUnit !== currentUnit)
  pushPart(incomingFood, incomingFood !== currentFood, incomingNote ? "" : " ")

  if (incomingNote) {
    parts.push(
      <span key={`${key}-note`}>
        {" "}
        (
        {incomingNote !== currentNote ? <strong>{incomingNote}</strong> : incomingNote}
        )
      </span>,
    )
  }

  if (parts.length === 0) return "-"
  return <>{parts}</>
}

export function applyAnalyzedIngredientToFormIngredient(
  ingredient: RecipeFormIngredient,
  analyzed: RecipeFormIngredient,
): RecipeFormIngredient {
  return {
    ...ingredient,
    quantity: analyzed.quantity,
    unit: analyzed.unit,
    unitId: analyzed.unitId,
    food: analyzed.food,
    foodId: analyzed.foodId,
    note: analyzed.note,
  }
}

export function buildNutritionLines(nutrition: RecipeFormData["nutrition"]) {
  return NUTRITION_FIELDS
    .map(({ key, label, unit }) => {
      const value = extractNutritionNumberString(nutrition[key])
      if (!value) return null
      return `${label}: ${value}${unit ? ` ${unit}` : ""}`
    })
    .filter((line): line is string => Boolean(line))
}

export function buildScrapedNutritionLines(nutrition?: MealieScrapedRecipePreview["nutrition"]) {
  if (!nutrition) return []

  return NUTRITION_FIELDS
    .map(({ key, label, unit }) => {
      const value = extractNutritionNumberString(nutrition[key])
      if (!value) return null
      return `${label}: ${value}${unit ? ` ${unit}` : ""}`
    })
    .filter((line): line is string => Boolean(line))
}

export function areLineGroupsEqual(left: string[], right: string[]) {
  return left.join("\n").trim() === right.join("\n").trim()
}

export function normalizeInstructionReferences(referenceIds: Array<string | null | undefined>) {
  const seen = new Set<string>()

  return referenceIds
    .filter((referenceId): referenceId is string => Boolean(referenceId))
    .filter((referenceId) => {
      if (seen.has(referenceId)) return false
      seen.add(referenceId)
      return true
    })
    .map((referenceId) => ({ referenceId }))
}

export function normalizeTaxonomyValue(value: string) {
  return value.trim().toLowerCase()
}

export function buildSortedUniqueTaxonomyNames(
  values: Array<{ name?: string | null } | string | null | undefined>,
): string[] {
  const names = values
    .map((value) => {
      if (typeof value === "string") return value.trim()
      return value?.name?.trim() ?? ""
    })
    .filter(Boolean)

  const uniqueNames = Array.from(new Map(
    names.map((name) => [normalizeTaxonomyValue(name), name]),
  ).values())

  return uniqueNames.sort((left, right) => left.localeCompare(right, "fr", { sensitivity: "base" }))
}

export function areTaxonomyGroupsEqual(
  left: Array<{ name?: string | null } | string | null | undefined>,
  right: Array<{ name?: string | null } | string | null | undefined>,
) {
  return areLineGroupsEqual(
    normalizeListValue(buildSortedUniqueTaxonomyNames(left)),
    normalizeListValue(buildSortedUniqueTaxonomyNames(right)),
  )
}

export function resolveScrapedCategorySelections(
  categories: ScrapedRecipeCategoryPreview[] = [],
  allCategories: MealieRecipeCategory[],
): MealieRecipeCategory[] {
  const seen = new Set<string>()

  return categories.reduce<MealieRecipeCategory[]>((acc, category) => {
    const normalizedName = normalizeTaxonomyValue(category.name)
    const normalizedSlug = normalizeTaxonomyValue(category.slug ?? "")
    const match = allCategories.find((current) =>
      (category.id && current.id === category.id)
      || (normalizedSlug && normalizeTaxonomyValue(current.slug) === normalizedSlug)
      || normalizeTaxonomyValue(current.name) === normalizedName,
    )

    const resolved = match ?? {
      id: category.id ?? category.slug ?? category.name,
      groupId: category.groupId ?? null,
      name: category.name,
      slug: category.slug ?? category.name,
    }
    const key = normalizeTaxonomyValue(resolved.id || resolved.slug || resolved.name)
    if (seen.has(key)) return acc
    seen.add(key)
    acc.push(resolved)
    return acc
  }, [])
}

export function resolveScrapedTagSelections(
  tags: ScrapedRecipeTagPreview[] = [],
  allTags: MealieRecipeTag[],
): MealieRecipeTag[] {
  const seen = new Set<string>()

  return tags.reduce<MealieRecipeTag[]>((acc, tag) => {
    const normalizedName = normalizeTaxonomyValue(tag.name)
    const normalizedSlug = normalizeTaxonomyValue(tag.slug ?? "")
    const match = allTags.find((current) =>
      (tag.id && current.id === tag.id)
      || (normalizedSlug && normalizeTaxonomyValue(current.slug) === normalizedSlug)
      || normalizeTaxonomyValue(current.name) === normalizedName,
    )

    const resolved = match ?? {
      id: tag.id ?? tag.slug ?? tag.name,
      groupId: tag.groupId ?? null,
      name: tag.name,
      slug: tag.slug ?? tag.name,
    }
    const key = normalizeTaxonomyValue(resolved.id || resolved.slug || resolved.name)
    if (seen.has(key)) return acc
    seen.add(key)
    acc.push(resolved)
    return acc
  }, [])
}

export function buildRecipeSyncFields(
  formData: RecipeFormData,
  scrapedPreview: MealieScrapedRecipePreview | null,
  analyzedIncomingIngredients: RecipeFormIngredient[] = [],
): RecipeSyncFieldPreview[] {
  if (!scrapedPreview) return []

  const currentIngredients = normalizeListValue(
    formData.recipeIngredient
      .filter((ingredient) => Boolean(ingredient.food || ingredient.note || ingredient.unit || ingredient.quantity))
      .map(formatRecipeIngredientLine),
  )
  const incomingIngredients = normalizeListValue(
    analyzedIncomingIngredients.length > 0
      ? analyzedIncomingIngredients.map(formatRecipeIngredientLine)
      : (scrapedPreview.recipeIngredient ?? []),
  )
  const incomingIngredientRichValue = analyzedIncomingIngredients.length > 0
    ? analyzedIncomingIngredients.map((ingredient, index) =>
      renderIngredientSourceComparison(formData.recipeIngredient[index], ingredient, `ingredient-${index}`))
    : undefined

  const currentInstructions = normalizeListValue(formData.recipeInstructions.map((step) => step.text))
  const incomingInstructions = normalizeListValue(
    (scrapedPreview.recipeInstructions ?? []).map((step) => step.text),
  )

  const currentNutrition = normalizeListValue(buildNutritionLines(normalizeNutritionValues(formData.nutrition)))
  const incomingNutrition = normalizeListValue(buildScrapedNutritionLines(normalizeNutritionValues(scrapedPreview.nutrition)))
  const currentTags = normalizeListValue(buildSortedUniqueTaxonomyNames(formData.tags))
  const incomingTags = normalizeListValue(buildSortedUniqueTaxonomyNames(scrapedPreview.tags ?? []))
  const currentCategories = normalizeListValue(buildSortedUniqueTaxonomyNames(formData.categories))
  const incomingCategories = normalizeListValue(buildSortedUniqueTaxonomyNames(scrapedPreview.recipeCategory ?? []))

  const fields: RecipeSyncFieldPreview[] = [
    {
      id: "name",
      label: "Titre",
      changed: !areLineGroupsEqual([formData.name || "-"], [scrapedPreview.name?.trim() || "-"]),
      currentValue: [formData.name || "-"],
      incomingValue: [scrapedPreview.name?.trim() || "-"],
    },
    {
      id: "description",
      label: "Description",
      changed: !areLineGroupsEqual([formData.description || "-"], [scrapedPreview.description?.trim() || "-"]),
      currentValue: [formData.description || "-"],
      incomingValue: [scrapedPreview.description?.trim() || "-"],
    },
    {
      id: "prepTime",
      label: "Temps de preparation",
      changed: !areLineGroupsEqual([formData.prepTime || "-"], [String(parseDuration(scrapedPreview.prepTime) || "-")]),
      currentValue: [formData.prepTime || "-"],
      incomingValue: [String(parseDuration(scrapedPreview.prepTime) || "-")],
    },
    {
      id: "performTime",
      label: "Temps de cuisson",
      changed: !areLineGroupsEqual([formData.performTime || "-"], [String(parseDuration(scrapedPreview.cookTime) || "-")]),
      currentValue: [formData.performTime || "-"],
      incomingValue: [String(parseDuration(scrapedPreview.cookTime) || "-")],
    },
    {
      id: "totalTime",
      label: "Temps total",
      changed: !areLineGroupsEqual([formData.totalTime || "-"], [String(parseDuration(scrapedPreview.totalTime) || "-")]),
      currentValue: [formData.totalTime || "-"],
      incomingValue: [String(parseDuration(scrapedPreview.totalTime) || "-")],
    },
    {
      id: "recipeServings",
      label: "Portions",
      changed: !areLineGroupsEqual([formData.recipeServings || "-"], [parseScrapedServings(scrapedPreview.recipeYield) || "-"]),
      currentValue: [formData.recipeServings || "-"],
      incomingValue: [parseScrapedServings(scrapedPreview.recipeYield) || "-"],
    },
    {
      id: "ingredients",
      label: "Ingredients",
      changed: !areLineGroupsEqual(currentIngredients, incomingIngredients),
      currentValue: currentIngredients,
      incomingValue: incomingIngredients,
      incomingRichValue: incomingIngredientRichValue,
    },
    {
      id: "instructions",
      label: "Instructions",
      changed: !areLineGroupsEqual(currentInstructions, incomingInstructions),
      currentValue: currentInstructions,
      incomingValue: incomingInstructions,
    },
    {
      id: "nutrition",
      label: "Nutrition",
      changed: !areLineGroupsEqual(currentNutrition, incomingNutrition),
      currentValue: currentNutrition,
      incomingValue: incomingNutrition,
    },
  ]

  if (scrapedPreview.tags) {
    fields.push({
      id: "tags",
      label: "Tags",
      changed: !areTaxonomyGroupsEqual(formData.tags, scrapedPreview.tags),
      currentValue: currentTags,
      incomingValue: incomingTags,
    })
  }

  if (scrapedPreview.recipeCategory) {
    fields.push({
      id: "categories",
      label: "Categories",
      changed: !areTaxonomyGroupsEqual(formData.categories, scrapedPreview.recipeCategory),
      currentValue: currentCategories,
      incomingValue: incomingCategories,
    })
  }

  return fields
}

export function toIngredientOutputs(notes: string[]): MealieRecipeIngredientOutput[] {
  return notes.map((note) => ({ note }))
}

export function autoResizeTextarea(element: HTMLTextAreaElement, minRows = 3) {
  element.style.height = "auto"
  element.style.height = `${Math.max(element.scrollHeight, 20 * minRows)}px`
}
