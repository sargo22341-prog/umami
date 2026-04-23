import type { MealieIngredientFoodAlias, MealieIngredientFoodOutput } from "@/shared/types/mealie/food.ts"
import type { RecipeFormData, RecipeFormIngredient } from "@/shared/types/mealie/Recipes.ts"
import { generateId } from "./id.ts"

export interface IngredientReferenceLink {
  referenceId: string | null
}

export interface InstructionIngredientLinkInput {
  text: string
  ingredientReferences?: IngredientReferenceLink[]
}

export interface IngredientFoodLinkInput {
  name: string
  pluralName?: string | null
  aliases?: MealieIngredientFoodAlias[]
}

export interface IngredientLinkInput {
  referenceId?: string | null
  food?: IngredientFoodLinkInput | MealieIngredientFoodOutput | null
}

export interface InstructionIngredientLinkAnalysis {
  nextInstructions: InstructionIngredientLinkInput[]
  changed: boolean
  linkedCount: number
}

function normalizeLinkText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/œ/g, "oe")
    .replace(/Œ/g, "oe")
    .replace(/æ/g, "ae")
    .replace(/Æ/g, "ae")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function expandLinkTerm(value: string) {
  const normalized = normalizeLinkText(value)
  if (!normalized) return []

  const variants = new Set<string>([normalized])
  const singularCandidates = [
    normalized.replace(/eufs\b/g, "euf"),
    normalized.replace(/aux\b/g, "al"),
    normalized.replace(/ies\b/g, "ie"),
    normalized.replace(/s\b/g, ""),
    normalized.replace(/x\b/g, ""),
  ]

  singularCandidates
    .map((candidate) => candidate.trim())
    .filter(Boolean)
    .forEach((candidate) => variants.add(candidate))

  return Array.from(variants).filter((candidate) => candidate.length >= 2)
}

function buildIngredientTerms(food?: IngredientFoodLinkInput | MealieIngredientFoodOutput | null) {
  if (!food) return []

  const rawTerms = [
    food.name,
    food.pluralName ?? "",
    ...(food.aliases ?? []).map((alias) => alias.name),
  ]
    .map((value) => value.trim())
    .filter(Boolean)

  const uniqueTerms = new Set<string>()
  rawTerms.forEach((term) => {
    expandLinkTerm(term).forEach((variant) => uniqueTerms.add(variant))
  })

  return Array.from(uniqueTerms)
    .filter((term) => term.length >= 3)
    .sort((left, right) => right.length - left.length)
}

function normalizeReferenceIds(referenceIds: Array<string | null | undefined>) {
  const seen = new Set<string>()

  return referenceIds
    .filter((referenceId): referenceId is string => Boolean(referenceId))
    .filter((referenceId) => {
      if (seen.has(referenceId)) return false
      seen.add(referenceId)
      return true
    })
}

function instructionContainsIngredient(instructionText: string, ingredient: IngredientLinkInput) {
  const normalizedInstruction = ` ${normalizeLinkText(instructionText)} `
  const ingredientTerms = buildIngredientTerms(ingredient.food)

  return ingredientTerms.some((term) => {
    const pattern = new RegExp(`(^|[^a-z0-9])${escapeRegExp(term)}(?=[^a-z0-9]|$)`, "i")
    return pattern.test(normalizedInstruction)
  })
}

function areReferenceGroupsEqual(left: Array<string | null | undefined>, right: Array<string | null | undefined>) {
  const normalizedLeft = normalizeReferenceIds(left)
  const normalizedRight = normalizeReferenceIds(right)

  if (normalizedLeft.length !== normalizedRight.length) return false

  return normalizedLeft.every((referenceId, index) => referenceId === normalizedRight[index])
}

export function normalizeInstructionReferenceLinks(referenceIds: Array<string | null | undefined>) {
  return normalizeReferenceIds(referenceIds).map((referenceId) => ({ referenceId }))
}

export function ensureRecipeIngredientReferenceIds(
  ingredients: RecipeFormIngredient[],
) {
  return ingredients.map((ingredient) => (
    ingredient.referenceId ? ingredient : { ...ingredient, referenceId: generateId() }
  ))
}

export function analyzeInstructionIngredientLinks(
  ingredients: IngredientLinkInput[],
  instructions: InstructionIngredientLinkInput[],
): InstructionIngredientLinkAnalysis {
  const scopedIngredients = ingredients
    .filter((ingredient): ingredient is IngredientLinkInput & { referenceId: string } =>
      Boolean(ingredient.referenceId) && Boolean(ingredient.food?.name.trim()),
    )
    .map((ingredient) => ({
      ...ingredient,
      referenceId: ingredient.referenceId,
    }))

  let linkedCount = 0

  const nextInstructions = instructions.map((instruction) => {
    const detectedReferenceIds = scopedIngredients
      .filter((ingredient) => instructionContainsIngredient(instruction.text, ingredient))
      .map((ingredient) => ingredient.referenceId)

    const currentReferenceIds = normalizeReferenceIds(
      (instruction.ingredientReferences ?? []).map((reference) => reference.referenceId),
    )

    const nextReferenceIds = normalizeReferenceIds([
      ...currentReferenceIds,
      ...detectedReferenceIds,
    ])

    linkedCount += nextReferenceIds.length

    return {
      ...instruction,
      ingredientReferences: nextReferenceIds.map((referenceId) => ({ referenceId })),
    }
  })

  const changed = nextInstructions.some((instruction, index) =>
    !areReferenceGroupsEqual(
      (instructions[index]?.ingredientReferences ?? []).map((reference) => reference.referenceId),
      (instruction.ingredientReferences ?? []).map((reference) => reference.referenceId),
    ))

  return {
    nextInstructions,
    changed,
    linkedCount,
  }
}

export function areInstructionIngredientLinksCurrent(
  instructions: InstructionIngredientLinkInput[],
  nextInstructions: InstructionIngredientLinkInput[],
) {
  if (instructions.length !== nextInstructions.length) return false

  return instructions.every((instruction, index) =>
    areReferenceGroupsEqual(
      (instruction.ingredientReferences ?? []).map((reference) => reference.referenceId),
      (nextInstructions[index]?.ingredientReferences ?? []).map((reference) => reference.referenceId),
    ))
}

export function buildAutoLinkedRecipeFormData(
  formData: RecipeFormData,
  foodsById?: Map<string, MealieIngredientFoodOutput>,
): {
  formData: RecipeFormData
  changed: boolean
  linkedCount: number
} {
  const nextIngredients = ensureRecipeIngredientReferenceIds(formData.recipeIngredient)
  const normalizedInstructions = formData.recipeInstructions.map((instruction) => ({
    ...instruction,
    ingredientReferences: normalizeInstructionReferenceLinks(
      (instruction.ingredientReferences ?? []).map((reference) => reference.referenceId),
    ),
  }))

  const linkAnalysis = analyzeInstructionIngredientLinks(
    nextIngredients.map((ingredient) => ({
      referenceId: ingredient.referenceId,
      food: ingredient.foodId
        ? foodsById?.get(ingredient.foodId) ?? (ingredient.food.trim() ? { name: ingredient.food } : null)
        : ingredient.food.trim()
          ? { name: ingredient.food }
          : null,
    })),
    normalizedInstructions,
  )

  return {
    changed: linkAnalysis.changed,
    linkedCount: linkAnalysis.linkedCount,
    formData: {
      ...formData,
      recipeIngredient: nextIngredients,
      recipeInstructions: linkAnalysis.nextInstructions.map((instruction) => ({
        ...instruction,
        ingredientReferences: normalizeInstructionReferenceLinks(
          (instruction.ingredientReferences ?? []).map((reference) => reference.referenceId),
        ),
      })),
    },
  }
}
