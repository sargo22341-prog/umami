import type { MealieRecipeCategory } from "./Category.ts"
import type { MealieRecipeCommentOutInput, MealieRecipeCommentOutOutput } from "./RecipeComment.ts"
import type { MealieRecipeTag } from "./Tags.ts"
import type { MealieCreateIngredientFood, MealieIngredientFoodInput, MealieIngredientFoodOutput } from "./food.ts"
import type { MealieCreateIngredientUnit, MealieIngredientUnitInput, MealieIngredientUnitOutput } from "./Units.ts"
import type { MealieRecipeTool } from "./Tools.ts"

export interface MealieIngredientReferences {
  referenceId: string | null
}

export interface MealieRecipeStep {
  id?: string | null
  title?: string | null
  summary?: string | null
  text: string
  ingredientReferences?: MealieIngredientReferences[]
}

export interface MealieNutrition {
  calories?: string | null
  carbohydrateContent?: string | null
  cholesterolContent?: string | null
  fatContent?: string | null
  fiberContent?: string | null
  proteinContent?: string | null
  saturatedFatContent?: string | null
  sodiumContent?: string | null
  sugarContent?: string | null
  transFatContent?: string | null
  unsaturatedFatContent?: string | null
}

export interface MealieRecipeAsset {
  name: string
  icon: string
  fileName?: string | null
}

export interface MealieRecipeNote {
  title: string
  text: string
}

export interface MealieRecipeSettings {
  public?: boolean
  showNutrition?: boolean
  showAssets?: boolean
  landscapeView?: boolean
  disableComments?: boolean
  locked?: boolean
}

export interface MealieRecipeIngredientInput {
  quantity?: number | null
  unit?: MealieIngredientUnitInput | MealieCreateIngredientUnit | null
  food?: MealieIngredientFoodInput | MealieCreateIngredientFood | null
  referencedRecipe?: MealieRecipeInput | null
  note?: string | null
  display?: string
  title?: string | null
  originalText?: string | null
  referenceId?: string
}

export interface MealieRecipeIngredientOutput {
  quantity?: number | null
  unit?: MealieIngredientUnitOutput | MealieCreateIngredientUnit | null
  food?: MealieIngredientFoodOutput | MealieCreateIngredientFood | null
  referencedRecipe?: MealieRecipeOutput | null
  note?: string | null
  display?: string
  title?: string | null
  originalText?: string | null
  referenceId?: string
}

export interface MealieRecipeInput {
  id?: string | null
  userId?: string
  householdId?: string
  groupId?: string
  name?: string | null
  slug?: string
  image?: unknown | null
  recipeServings?: number
  recipeYieldQuantity?: number
  recipeYield?: string | null
  totalTime?: string | null
  prepTime?: string | null
  cookTime?: string | null
  performTime?: string | null
  description?: string | null
  recipeCategory?: MealieRecipeCategory[] | null
  tags?: MealieRecipeTag[] | null
  tools?: MealieRecipeTool[]
  rating?: number | null
  orgURL?: string | null
  dateAdded?: string | null
  dateUpdated?: string | null
  createdAt?: string | null
  update_at?: string | null
  lastMade?: string | null
  recipeIngredient?: MealieRecipeIngredientInput[]
  recipeInstructions?: MealieRecipeStep[] | null
  nutrition?: MealieNutrition | null
  settings?: MealieRecipeSettings | null
  assets?: MealieRecipeAsset[] | null
  notes?: MealieRecipeNote[] | null
  extras?: Record<string, unknown> | null
  comments?: MealieRecipeCommentOutInput[] | null
}

export interface MealieRecipeOutput {
  id: string
  userId?: string
  householdId?: string
  groupId?: string
  name: string
  slug: string
  image?: unknown | null
  recipeServings?: number
  recipeYieldQuantity?: number
  recipeYield?: string | null
  totalTime?: string | null
  prepTime?: string | null
  cookTime?: string | null
  performTime?: string | null
  description?: string | null
  recipeCategory?: MealieRecipeCategory[]
  tags?: MealieRecipeTag[]
  tools?: MealieRecipeTool[]
  rating?: number | null
  orgURL?: string | null
  dateAdded?: string | null
  dateUpdated?: string | null
  createdAt?: string | null
  updatedAt?: string | null
  lastMade?: string | null
  recipeIngredient?: MealieRecipeIngredientOutput[]
  recipeInstructions?: MealieRecipeStep[]
  nutrition?: MealieNutrition | null
  settings?: MealieRecipeSettings | null
  assets?: MealieRecipeAsset[]
  notes?: MealieRecipeNote[]
  extras?: Record<string, unknown> | null
  comments?: MealieRecipeCommentOutOutput[]
}

export interface MealieRecipeSummary {
  id: string
  userId?: string
  householdId?: string
  groupId?: string
  name: string
  slug: string
  image?: unknown | null
  recipeServings?: number
  recipeYieldQuantity?: number
  recipeYield?: string | null
  totalTime?: string | null
  prepTime?: string | null
  cookTime?: string | null
  performTime?: string | null
  description?: string | null
  recipeCategory?: MealieRecipeCategory[]
  tags?: MealieRecipeTag[]
  tools?: MealieRecipeTool[]
  rating?: number | null
  orgURL?: string | null
  dateAdded?: string | null
  dateUpdated?: string | null
  createdAt?: string | null
  updatedAt?: string | null
  lastMade?: string | null
}

export interface MealiePaginationBaseRecipeSummary {
  page?: number
  per_page?: number
  perPage?: number
  total?: number
  total_pages?: number
  totalPages?: number
  items: MealieRecipeSummary[]
  next?: string | null
  previous?: string | null
}

export type MealieIngredientReference = MealieIngredientReferences
export type MealieInstruction = MealieRecipeStep
export type MealieIngredient = MealieRecipeIngredientOutput
export type MealieNutritionOutput = MealieNutrition
export type MealieRecipe = MealieRecipeOutput
export type { RecipeFilters, RecipeFormData, RecipeFormIngredient, RecipeFormInstruction } from "../recipeForm.ts"
export type { MealieUserRatingSummary, MealieUserRatingOut } from "./User.ts"

export interface MealieRawPaginatedRecipes extends MealiePaginationBaseRecipeSummary {
  page: number
  per_page: number
  total: number
  total_pages: number
}

export interface MealiePaginatedRecipes extends MealiePaginationBaseRecipeSummary {
  page: number
  perPage: number
  total: number
  totalPages: number
}
