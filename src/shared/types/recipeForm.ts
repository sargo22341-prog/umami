import type { Season } from "./Season.ts"
import type { MealieNutrition, MealieRecipeOutput } from "./mealie/Recipes.ts"
import type { MealieRecipeCategory } from "./mealie/Category.ts"
import type { MealieRecipeTag } from "./mealie/Tags.ts"
import type { MealieRecipeTool } from "./mealie/Tools.ts"

export interface RecipeFilters {
  search?: string
  categories?: string[]
  foods?: string[]
  tags?: string[]
  tools?: string[]
  seasons?: Season[]
  orderBy?: string
  orderDirection?: string
  paginationSeed?: string
}

export interface RecipeFormIngredient {
  quantity: string
  unit: string
  unitId?: string
  food: string
  foodId?: string
  note: string
  referenceId?: string
}

export interface RecipeFormInstruction {
  text: string
  id?: string
  ingredientReferences?: Array<{
    referenceId: string | null
  }>
}

export interface RecipeFormData {
  name: string
  description: string
  orgURL?: string
  prepTime: string
  performTime: string
  totalTime: string
  recipeServings: string
  nutrition: MealieNutrition
  imageFile?: File
  recipeIngredient: RecipeFormIngredient[]
  recipeInstructions: RecipeFormInstruction[]
  seasons: Season[]
  categories: MealieRecipeCategory[]
  tags: MealieRecipeTag[]
  tools: MealieRecipeTool[]
}

export type EditableRecipe = MealieRecipeOutput
