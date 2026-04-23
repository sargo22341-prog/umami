import { useRecipeSourceSearch } from "./useRecipeSourceSearch.ts"
import { useUrlRecipeImport } from "./useUrlRecipeImport.ts"

export function useExploreRecipes() {
  const searchState = useRecipeSourceSearch()
  const importState = useUrlRecipeImport()

  return {
    ...searchState,
    ...importState,
  }
}
