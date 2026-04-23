import type { RecipeSourceProvider } from "../types.ts"
import { searchRemoteRecipes, searchRemoteRecipesNext } from "../shared/remoteRecipeSourceApi.ts"

export const jowRecipeSourceProvider: RecipeSourceProvider = {
  id: "jow",
  label: "Jow",
  searchRecipes(query: string) {
    return searchRemoteRecipes(query, "jow", "Jow")
  },
  searchNextRecipes(nextPage: unknown) {
    return searchRemoteRecipesNext(nextPage, "jow", "Jow")
  },
}
