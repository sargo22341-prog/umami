import type { RecipeSourceProviderId, RecipeSourceSearchResponse } from "./providers/types.ts"
import { getRecipeSourceProviderById } from "./recipeSourceProviderRegistry.ts"
import { RecipeSourceError } from "./recipeSource.errors.ts"

export const DEFAULT_RECIPE_SEARCH_PROVIDER_ID: RecipeSourceProviderId = "marmiton"

export function getDefaultRecipeSearchProvider() {
  return getRecipeSourceProviderById(DEFAULT_RECIPE_SEARCH_PROVIDER_ID)
}

export async function searchRecipesFromSource(
  query: string,
  providerId: RecipeSourceProviderId = DEFAULT_RECIPE_SEARCH_PROVIDER_ID,
): Promise<RecipeSourceSearchResponse> {
  const provider = getRecipeSourceProviderById(providerId)
  if (!provider) {
    throw new RecipeSourceError("provider_error", "Provider de recherche introuvable.")
  }

  return provider.searchRecipes(query)
}

export async function searchNextRecipesFromSource(
  nextPage: unknown,
  providerId: RecipeSourceProviderId = DEFAULT_RECIPE_SEARCH_PROVIDER_ID,
): Promise<RecipeSourceSearchResponse> {
  const provider = getRecipeSourceProviderById(providerId)
  if (!provider) {
    throw new RecipeSourceError("provider_error", "Provider de recherche introuvable.")
  }

  return provider.searchNextRecipes(nextPage)
}
