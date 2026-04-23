import type {
  MealiePaginatedRecipes,
  MealieRecipeOutput,
  RecipeFilters,
} from "@/shared/types/mealie/Recipes.ts"

type GetRecipesPage = (
  page?: number,
  perPage?: number,
  filters?: RecipeFilters,
) => Promise<MealiePaginatedRecipes>

export async function fetchAllRecipes(
  getRecipesPage: GetRecipesPage,
  filters?: RecipeFilters,
  perPage = 100,
): Promise<MealieRecipeOutput[]> {
  const firstPage = await getRecipesPage(1, perPage, filters)
  const recipes = [...firstPage.items]

  for (let page = 2; page <= firstPage.totalPages; page += 1) {
    const pageData = await getRecipesPage(page, perPage, filters)
    recipes.push(...pageData.items)
  }

  return recipes
}
