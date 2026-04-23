import type { RecipeSourceProvider } from "../types.ts"
import { searchRemoteRecipes, searchRemoteRecipesNext } from "../shared/remoteRecipeSourceApi.ts"

export const marmitonRecipeSourceProvider: RecipeSourceProvider = {
  id: "marmiton",
  label: "Marmiton",
  searchRecipes(query: string) {
    return searchRemoteRecipes(query, "marmiton", "Marmiton")
  },
  searchNextRecipes(nextPage: unknown) {
    return searchRemoteRecipesNext(nextPage, "marmiton", "Marmiton")
  },
}
