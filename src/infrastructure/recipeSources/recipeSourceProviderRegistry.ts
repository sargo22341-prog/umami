import type { RecipeSourceProvider, RecipeSourceProviderId } from "./providers/types.ts"
import { recipe750gSourceProvider } from "./providers/750g/750g.provider.ts"
import { marmitonRecipeSourceProvider } from "./providers/marmiton/marmiton.provider.ts"
import { jowRecipeSourceProvider } from "./providers/jow/jow.provider.ts"

const providers: RecipeSourceProvider[] = [
  marmitonRecipeSourceProvider,
  jowRecipeSourceProvider,
  recipe750gSourceProvider,
]

export function getRecipeSourceProviders(): RecipeSourceProvider[] {
  return providers
}

export function getRecipeSourceProviderById(
  providerId: RecipeSourceProviderId,
): RecipeSourceProvider | null {
  return providers.find((provider) => provider.id === providerId) ?? null
}
