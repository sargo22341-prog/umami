import type { RecipeSourceProvider } from "../types.ts"
import { searchRemoteRecipes, searchRemoteRecipesNext } from "../shared/remoteRecipeSourceApi.ts"

export const recipe750gSourceProvider: RecipeSourceProvider = {
  id: "750g",
  label: "750g",
  searchRecipes(query: string) {
    return searchRemoteRecipes(query, "750g", "750g")
  },
  searchNextRecipes(nextPage: unknown) {
    return searchRemoteRecipesNext(nextPage, "750g", "750g")
  },
}
