export interface MealieIngredientUnitAlias {
  name: string
}

export interface MealieIngredientUnitInput {
  id: string
  name: string
  pluralName?: string | null
  description?: string
  extras?: Record<string, unknown> | null
  fraction?: boolean
  abbreviation?: string
  pluralAbbreviation?: string | null
  useAbbreviation?: boolean
  aliases?: MealieIngredientUnitAlias[]
  standardQuantity?: number | null
  standardUnit?: string | null
  createdAt?: string | null
  update_at?: string | null
}

export interface MealieIngredientUnitOutput {
  id: string
  name: string
  pluralName?: string | null
  description?: string
  extras?: Record<string, unknown> | null
  fraction?: boolean
  abbreviation?: string
  pluralAbbreviation?: string | null
  useAbbreviation?: boolean
  aliases?: MealieIngredientUnitAlias[]
  standardQuantity?: number | null
  standardUnit?: string | null
  createdAt?: string | null
  updatedAt?: string | null
}

export interface MealieCreateIngredientUnit {
  id?: string | null
  name: string
  pluralName?: string | null
  description?: string
  extras?: Record<string, unknown> | null
  fraction?: boolean
  abbreviation?: string
  pluralAbbreviation?: string | null
  useAbbreviation?: boolean
  aliases?: MealieIngredientUnitAlias[]
  standardQuantity?: number | null
  standardUnit?: string | null
}

export interface MealieIngredientUnitPagination {
  page?: number
  per_page?: number
  perPage?: number
  total?: number
  total_pages?: number
  totalPages?: number
  items: MealieIngredientUnitOutput[]
  next?: string | null
  previous?: string | null
}

export interface MealieMergeUnit {
  fromUnit: string
  toUnit: string
}

export type MealieUnit = MealieIngredientUnitOutput
export type MealieUnitInput = MealieCreateIngredientUnit
export type MealieMergeUnitInput = MealieMergeUnit

export interface MealiePaginatedUnits extends MealieIngredientUnitPagination {
  page: number
  perPage: number
  total: number
  totalPages: number
}

export interface MealieRawPaginatedUnits extends MealieIngredientUnitPagination {
  page: number
  per_page: number
  total: number
  total_pages: number
}
