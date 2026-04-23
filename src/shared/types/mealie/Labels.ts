export interface MealieMultiPurposeLabelCreate {
  name: string
  color?: string
}

export interface MealieMultiPurposeLabelSummary {
  name: string
  color?: string
  groupId: string
  id: string
}

export interface MealieMultiPurposeLabelOut {
  name: string
  color?: string
  groupId: string
  id: string
}

export interface MealieMultiPurposeLabelUpdate {
  name: string
  color?: string
  groupId: string
  id: string
}

export interface MealieMultiPurposeLabelPagination {
  page?: number
  per_page?: number
  perPage?: number
  total?: number
  total_pages?: number
  totalPages?: number
  items: MealieMultiPurposeLabelSummary[]
  next?: string | null
  previous?: string | null
}

export type MealieLabel = MealieMultiPurposeLabelSummary
export type MealieLabelInput = MealieMultiPurposeLabelCreate

export interface MealiePaginatedLabels extends MealieMultiPurposeLabelPagination {
  page: number
  perPage: number
  total: number
  totalPages: number
}

export interface MealieRawPaginatedLabels extends MealieMultiPurposeLabelPagination {
  page: number
  per_page: number
  total: number
  total_pages: number
}
