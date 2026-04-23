/**
 * Persistent map: recipe name → recipe slug.
 * Populated when ingredients are added from the planning.
 * Used to open the recipe detail modal from the shopping list.
 */

const STORAGE_KEY = "umami:recipe_slugs"

function load(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") as Record<string, string>
  } catch {
    return {}
  }
}

export const recipeSlugStore = {
  lookup(recipeName: string): string | undefined {
    return load()[recipeName]
  },

  set(recipeName: string, slug: string): void {
    const map = load()
    map[recipeName] = slug
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
  },
}
