import { RecipeSourceError } from "../../recipeSource.errors.ts"
import type {
  RecipeSourceProviderId,
  RecipeSourceRecipe,
  RecipeSourceSearchResponse,
} from "../types.ts"

interface RemoteRecipePayload {
  id?: string
  title?: string
  url?: string
  image?: string
}

interface RemoteSearchResponse {
  results?: RemoteRecipePayload[]
  hasMore?: boolean
  nextPage?: unknown
}

async function readJsonError(response: Response): Promise<string> {
  const payload = await response.json().catch(() => null) as { error?: string } | null
  const message = payload?.error?.trim()
  return message || `Erreur ${response.status}`
}

function mapRemoteRecipe(
  recipe: RemoteRecipePayload,
  providerId: RecipeSourceProviderId,
  providerLabel: string,
): RecipeSourceRecipe {
  return {
    id: recipe.id?.trim() || recipe.url?.trim() || `${providerId}:${recipe.title?.trim() || ""}`,
    providerId,
    providerLabel,
    name: recipe.title?.trim() || "",
    imageUrl: recipe.image?.trim() || "",
    sourceUrl: recipe.url?.trim() || "",
  }
}

export async function searchRemoteRecipes(
  query: string,
  providerId: RecipeSourceProviderId,
  providerLabel: string,
): Promise<RecipeSourceSearchResponse> {
  const response = await fetch(
    `/api/recipes-search/search?q=${encodeURIComponent(query)}&source=${encodeURIComponent(providerId)}`,
  )

  if (!response.ok) {
    throw new RecipeSourceError("provider_error", await readJsonError(response))
  }

  const payload = await response.json() as RemoteSearchResponse
  return {
    results: (payload.results ?? []).map((recipe) => mapRemoteRecipe(recipe, providerId, providerLabel)),
    hasMore: Boolean(payload.hasMore),
    nextPage: payload.nextPage,
  }
}

export async function searchRemoteRecipesNext(
  nextPage: unknown,
  providerId: RecipeSourceProviderId,
  providerLabel: string,
): Promise<RecipeSourceSearchResponse> {
  const response = await fetch("/api/recipes-search/search-next", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      source: providerId,
      nextPage,
    }),
  })

  if (!response.ok) {
    throw new RecipeSourceError("provider_error", await readJsonError(response))
  }

  const payload = await response.json() as RemoteSearchResponse
  return {
    results: (payload.results ?? []).map((recipe) => mapRemoteRecipe(recipe, providerId, providerLabel)),
    hasMore: Boolean(payload.hasMore),
    nextPage: payload.nextPage,
  }
}

export function buildRecipeImageProxyUrl(recipe: RecipeSourceRecipe): string {
  if (!recipe.imageUrl.trim()) return ""
  return `/api/recipes-search/image?source=${encodeURIComponent(recipe.providerId)}&url=${encodeURIComponent(recipe.imageUrl)}`
}

export function buildRemoteAssetProxyUrl(assetUrl: string): string {
  return `/api/recipes-asset?url=${encodeURIComponent(assetUrl)}`
}
