import type { MealieRecipeIngredientOutput } from "@/shared/types/mealie/Recipes.ts"
import type { MealieCreateIngredientUnit, MealieIngredientUnitOutput } from "@/shared/types/mealie/Units.ts"

export interface StandardizedIngredientQuantityResult {
  quantity?: number
  unitId?: string
  unit?: MealieIngredientUnitOutput | MealieCreateIngredientUnit | null
  converted: boolean
}

function normalizeStandardQuantity(value?: number | null): number | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return null
  }

  return value
}

function buildStandardUnitPayload(standardUnit: string): MealieCreateIngredientUnit {
  return {
    name: standardUnit,
  }
}

function buildSourceUnitPayload(
  sourceUnit: MealieIngredientUnitOutput | MealieCreateIngredientUnit,
): MealieCreateIngredientUnit {
  return {
    id: "id" in sourceUnit ? sourceUnit.id ?? undefined : undefined,
    name: sourceUnit.name,
    pluralName: sourceUnit.pluralName,
    description: sourceUnit.description,
    extras: sourceUnit.extras,
    fraction: sourceUnit.fraction,
    abbreviation: sourceUnit.abbreviation,
    pluralAbbreviation: sourceUnit.pluralAbbreviation,
    useAbbreviation: sourceUnit.useAbbreviation,
    aliases: sourceUnit.aliases,
    standardQuantity: sourceUnit.standardQuantity,
    standardUnit: sourceUnit.standardUnit,
  }
}

function getSourceUnitId(
  sourceUnit?: MealieIngredientUnitOutput | MealieCreateIngredientUnit | null,
): string | undefined {
  if (!sourceUnit || !("id" in sourceUnit)) {
    return undefined
  }

  return sourceUnit.id ?? undefined
}

function normalizeComparableUnitValue(value?: string | null): string | null {
  if (typeof value !== "string") {
    return null
  }

  const normalized = value.trim().toLowerCase()
  return normalized.length > 0 ? normalized : null
}

function matchesComparableUnitValue(
  value: string | null,
  target: string | null,
): boolean {
  return Boolean(value && target && value === target)
}

export function findStandardBaseUnit(
  standardUnit: string,
  availableUnits: MealieIngredientUnitOutput[],
): MealieIngredientUnitOutput | null {
  const normalizedStandardUnit = normalizeComparableUnitValue(standardUnit)

  if (!normalizedStandardUnit) {
    return null
  }

  for (const unit of availableUnits) {
    const normalizedUnitStandard = normalizeComparableUnitValue(unit.standardUnit)
    const normalizedUnitStandardQuantity = normalizeStandardQuantity(unit.standardQuantity)

    if (
      normalizedUnitStandardQuantity === 1 &&
      matchesComparableUnitValue(normalizedUnitStandard, normalizedStandardUnit)
    ) {
      return unit
    }
  }

  return null
}

function isAlreadyUsingStandardUnit(
  sourceUnit: MealieIngredientUnitOutput | MealieCreateIngredientUnit,
  standardUnit: string,
): boolean {
  const normalizedStandardUnit = normalizeComparableUnitValue(standardUnit)
  const normalizedSourceStandardUnit = normalizeComparableUnitValue(sourceUnit.standardUnit)
  const normalizedSourceStandardQuantity = normalizeStandardQuantity(sourceUnit.standardQuantity)

  if (!normalizedStandardUnit || normalizedSourceStandardQuantity == null) {
    return false
  }

  return (
    normalizedSourceStandardQuantity === 1 &&
    matchesComparableUnitValue(normalizedSourceStandardUnit, normalizedStandardUnit)
  )
}

export function convertQuantityToStandardUnit(
  sourceUnit: MealieIngredientUnitOutput | MealieCreateIngredientUnit | null | undefined,
  quantity?: number,
  availableUnits: MealieIngredientUnitOutput[] = [],
): StandardizedIngredientQuantityResult {
  if (!sourceUnit || quantity == null || Number.isNaN(quantity)) {
    return {
      quantity,
      unitId: getSourceUnitId(sourceUnit),
      unit: sourceUnit ? buildSourceUnitPayload(sourceUnit) : undefined,
      converted: false,
    }
  }

  const standardUnit = sourceUnit.standardUnit?.trim()
  const standardQuantity = normalizeStandardQuantity(sourceUnit.standardQuantity)

  if (!standardUnit || standardQuantity == null) {
    return {
      quantity,
      unitId: getSourceUnitId(sourceUnit),
      unit: buildSourceUnitPayload(sourceUnit),
      converted: false,
    }
  }

  if (isAlreadyUsingStandardUnit(sourceUnit, standardUnit)) {
    return {
      quantity,
      unitId: getSourceUnitId(sourceUnit),
      unit: buildSourceUnitPayload(sourceUnit),
      converted: false,
    }
  }

  const nextQuantity = quantity * standardQuantity
  const resolvedStandardUnit = findStandardBaseUnit(standardUnit, availableUnits)

  return {
    quantity: nextQuantity,
    unitId: resolvedStandardUnit?.id,
    unit: resolvedStandardUnit ? buildSourceUnitPayload(resolvedStandardUnit) : buildStandardUnitPayload(standardUnit),
    converted: true,
  }
}

export function convertToStandardUnit(
  ingredient: MealieRecipeIngredientOutput,
  quantity?: number,
  availableUnits: MealieIngredientUnitOutput[] = [],
): StandardizedIngredientQuantityResult {
  return convertQuantityToStandardUnit(ingredient.unit, quantity, availableUnits)
}
