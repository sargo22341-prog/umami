export type RecipeSourceProviderId = "marmiton" | "jow" | "750g"

export interface RecipeSourceRecipe {
  id: string
  providerId: RecipeSourceProviderId
  providerLabel: string
  name: string
  imageUrl: string
  sourceUrl: string
}

export interface RecipeSourceSearchResponse {
  results: RecipeSourceRecipe[]
  hasMore: boolean
  nextPage?: unknown
}

export interface RecipeSourceProvider {
  readonly id: RecipeSourceProviderId
  readonly label: string
  searchRecipes(query: string): Promise<RecipeSourceSearchResponse>
  searchNextRecipes(nextPage: unknown): Promise<RecipeSourceSearchResponse>
}
