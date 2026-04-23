import type { MealieNutrition } from "./mealie/Recipes.ts"

export interface ScrapedRecipeInstruction {
  text: string
}

export interface ScrapedRecipeCategoryPreview {
  id?: string
  groupId?: string | null
  name: string
  slug?: string
}

export interface ScrapedRecipeTagPreview {
  id?: string
  groupId?: string | null
  name: string
  slug?: string
}

export interface ScrapedRecipePreview {
  name?: string
  description?: string
  prepTime?: string
  cookTime?: string
  totalTime?: string
  recipeYield?: string[]
  recipeIngredient?: string[]
  recipeInstructions?: ScrapedRecipeInstruction[]
  nutrition?: MealieNutrition
  image?: string[]
  recipeCategory?: ScrapedRecipeCategoryPreview[]
  tags?: ScrapedRecipeTagPreview[]
}
