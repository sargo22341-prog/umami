export const MEALIE_STANDARD_UNIT_OPTIONS = [
  { value: "fluid_ounce", label: "once liquide" },
  { value: "cup", label: "tasse" },
  { value: "ounce", label: "once" },
  { value: "pound", label: "livre" },
  { value: "milliliter", label: "millilitre" },
  { value: "liter", label: "litre" },
  { value: "gram", label: "gramme" },
  { value: "kilogram", label: "kilogramme" },
] as const

export type MealieStandardUnitValue = (typeof MEALIE_STANDARD_UNIT_OPTIONS)[number]["value"]

export function getMealieStandardUnitLabel(value?: string | null): string {
  if (!value) return "-"
  return MEALIE_STANDARD_UNIT_OPTIONS.find((option) => option.value === value)?.label ?? value
}
