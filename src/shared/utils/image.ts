import type { MealieRecipeOutput } from "@/shared/types/mealie/Recipes.ts"

/**
 * Construit l'URL d'image d'une recette Mealie.
 * Utilise dateUpdated comme cache-buster : quand Mealie met a jour l'image,
 * dateUpdated change et le navigateur charge la nouvelle image.
 */
export function recipeImageUrl(
  recipe: Pick<MealieRecipeOutput, "id" | "dateUpdated">,
  size: "original" | "min-original" = "min-original",
): string {
  if (!recipe.id) return ""
  const base = `/api/media/recipes/${recipe.id}/images/${size}.webp`
  return recipe.dateUpdated ? `${base}?t=${encodeURIComponent(recipe.dateUpdated)}` : base
}

/**
 * Construit les URLs candidates d'image d'un utilisateur Mealie.
 * Mealie n'expose pas le nom de fichier dans `GET /api/users/self`,
 * donc on tente des chemins stables connus cote app.
 */
export function userImageCandidates(userId: string, cacheBust?: string | number | null): string {
  const url = `/api/media/users/${userId}/profile.webp`
  return cacheBust ? `${url}?t=${encodeURIComponent(String(cacheBust))}` : url
}
