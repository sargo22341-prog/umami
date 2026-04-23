/**
 * Dependency container — singleton module.
 *
 * All repository and use case instances are created once
 * and shared throughout the application. Hooks import directly
 * from this file instead of instantiating their own dependencies.
 */


//Auth Services
import { AuthService } from "./mealie/auth/AuthService.ts"

// Repositories
import { AuthRepository } from './mealie/auth/AuthRepository.ts'
import { CategoryRepository } from './mealie/categories/CategoryRepository.ts'
import { FoodRepository } from './mealie/foods/FoodRepository.ts'
import { LabelRepository } from './mealie/labels/LabelRepository.ts'
import { PlanningRepository } from './mealie/planning/PlanningRepository.ts'
import { RecipeRepository } from './mealie/recipe/RecipeRepository.ts'
import { RecipeCommentRepository } from "./mealie/recipeComment/RecipeCommentRepository.ts"
import { RecipeImportRepository } from "./mealie/recipeImport/RecipeImportRepository.ts"
import { ShoppingRepository } from './mealie/shopping/ShoppingRepository.ts'
import { TagRepository } from './mealie/tags/TagRepository.ts'
import { ToolRepository } from './mealie/tools/ToolRepository.ts'
import { UnitRepository } from './mealie/units/UnitRepository.ts'
import { UserRepository } from "./mealie/user/UserRepository.ts"
import { UserRecipeRepository } from "./mealie/user/UserRecipeRepository.ts"

// Use cases — auth
import { LoginUseCase } from '@/application/auth/usecases/LoginUseCase.ts'
import { LogoutUseCase } from '@/application/auth/usecases/LogoutUseCase.ts'

// Use cases — recipe
import { GetRecipesUseCase } from '@/application/recipe/usecases/GetRecipesUseCase.ts'
import { GetRecipeUseCase } from '@/application/recipe/usecases/GetRecipeUseCase.ts'
import { GetRecipesByIdsUseCase } from '@/application/recipe/usecases/GetRecipesByIdsUseCase.ts'
import { GetRecipeCommentsUseCase } from '@/application/recipeComment/usecases/GetRecipeCommentsUseCase.ts'
import { CreateRecipeCommentUseCase } from '@/application/recipeComment/usecases/CreateRecipeCommentUseCase.ts'
import { DeleteRecipeCommentUseCase } from '@/application/recipeComment/usecases/DeleteRecipeCommentUseCase.ts'
import { DeleteRecipeUseCase } from '@/application/recipe/usecases/DeleteRecipeUseCase.ts'
import { TestRecipeScrapeUrlUseCase } from '@/application/recipeImport/usecases/TestRecipeScrapeUrlUseCase.ts'
import { GetRecipeScrapePreviewUseCase } from '@/application/recipeImport/usecases/GetRecipeScrapePreviewUseCase.ts'
import { ImportRecipeByUrlUseCase } from '@/application/recipeImport/usecases/ImportRecipeByUrlUseCase.ts'
import { ImportRecipesByUrlBulkUseCase } from '@/application/recipeImport/usecases/ImportRecipesByUrlBulkUseCase.ts'
import { CreateRecipeUseCase } from '@/application/recipe/usecases/CreateRecipeUseCase.ts'
import { UpdateRecipeUseCase } from '@/application/recipe/usecases/UpdateRecipeUseCase.ts'
import { UpdateCategoriesUseCase } from '@/application/recipe/usecases/UpdateCategoriesRecipeUseCase.ts'
import { UpdateSeasonsUseCase } from '@/application/recipe/usecases/UpdateSeasonsUseCase.ts'
import { UpdateCalorieTagUseCase } from '@/application/recipe/usecases/UpdateCalorieTagUseCase.ts'
import { UpdateRecipeTagsUseCase } from '@/application/recipe/usecases/UpdateRecipeTagsUseCase.ts'

// Use cases — user
import { UpdateRatingUseCase } from '@/application/user/usecases/UpdateRatingUseCase.ts'
import { GetFavoritesUseCase } from '@/application/user/usecases/GetFavoritesUseCase.ts'
import { ToggleFavoriteUseCase } from '@/application/user/usecases/ToggleFavoriteUseCase.ts'

// Use cases — planning
import { GetWeekPlanningUseCase } from '@/application/planning/usecases/GetWeekPlanningUseCase.ts'
import { GetPlanningRangeUseCase } from '@/application/planning/usecases/GetPlanningRangeUseCase.ts'
import { AddMealUseCase } from '@/application/planning/usecases/AddMealUseCase.ts'
import { DeleteMealUseCase } from '@/application/planning/usecases/DeleteMealUseCase.ts'

// Use cases — shopping
import { GetShoppingItemsUseCase } from '@/application/shopping/usecases/GetShoppingItemsUseCase.ts'
import { AddItemUseCase } from '@/application/shopping/usecases/AddItemUseCase.ts'
import { AddRecipesToListUseCase } from '@/application/shopping/usecases/AddRecipesToListUseCase.ts'
import { ToggleItemUseCase } from '@/application/shopping/usecases/ToggleItemUseCase.ts'
import { DeleteItemUseCase } from '@/application/shopping/usecases/DeleteItemUseCase.ts'
import { ClearListUseCase } from '@/application/shopping/usecases/ClearListUseCase.ts'

// Categories
import { GetCategoriesUseCase } from '@/application/categories/usecases/GetCategoriesUseCase.ts'
import { GetPaginatedCategoriesUseCase } from '@/application/categories/usecases/GetPaginatedCategoriesUseCase.ts'
import { CreateCategoryUseCase } from '@/application/categories/usecases/CreateCategoryUseCase.ts'
import { UpdateCategoryUseCase } from '@/application/categories/usecases/UpdateCategoryUseCase.ts'
import { DeleteCategoryUseCase } from '@/application/categories/usecases/DeleteCategoryUseCase.ts'

// Labels
import { GetLabelsUseCase } from '@/application/labels/usecases/GetLabelsUseCase.ts'
import { GetPaginatedLabelsUseCase } from '@/application/labels/usecases/GetPaginatedLabelsUseCase.ts'
import { CreateLabelUseCase } from '@/application/labels/usecases/CreateLabelUseCase.ts'
import { UpdateLabelUseCase } from '@/application/labels/usecases/UpdateLabelUseCase.ts'
import { DeleteLabelUseCase } from '@/application/labels/usecases/DeleteLabelUseCase.ts'

// Tags
import { GetTagsUseCase } from '@/application/tags/usecases/GetTagsUseCase.ts'
import { GetTagDetailsUseCase } from '@/application/tags/usecases/GetTagDetailsUseCase.ts'
import { GetPaginatedTagsUseCase } from '@/application/tags/usecases/GetPaginatedTagsUseCase.ts'
import { CreateTagUseCase } from '@/application/tags/usecases/CreateTagUseCase.ts'
import { UpdateTagUseCase } from '@/application/tags/usecases/UpdateTagUseCase.ts'
import { DeleteTagUseCase } from '@/application/tags/usecases/DeleteTagUseCase.ts'

// Tools
import { GetToolsUseCase } from '@/application/tools/usecases/GetToolsUseCase.ts'
import { GetPaginatedToolsUseCase } from '@/application/tools/usecases/GetPaginatedToolsUseCase.ts'
import { CreateToolUseCase } from '@/application/tools/usecases/CreateToolUseCase.ts'
import { UpdateToolUseCase } from '@/application/tools/usecases/UpdateToolUseCase.ts'
import { DeleteToolUseCase } from '@/application/tools/usecases/DeleteToolUseCase.ts'

// Food
import { GetFoodsUseCase } from '@/application/foods/usecases/GetFoodsUseCase.ts'
import { GetPaginatedFoodsUseCase } from '@/application/foods/usecases/GetPaginatedFoodsUseCase.ts'
import { CreateFoodUseCase } from '@/application/foods/usecases/CreateFoodUseCase.ts'
import { CreateFoodDetailedUseCase } from '@/application/foods/usecases/CreateFoodDetailedUseCase.ts'
import { UpdateFoodUseCase } from '@/application/foods/usecases/UpdateFoodUseCase.ts'
import { DeleteFoodUseCase } from '@/application/foods/usecases/DeleteFoodUseCase.ts'
import { MergeFoodsUseCase } from '@/application/foods/usecases/MergeFoodsUseCase.ts'

// Units
import { GetUnitsUseCase } from '@/application/units/usecases/GetUnitsUseCase.ts'
import { GetPaginatedUnitsUseCase } from '@/application/units/usecases/GetPaginatedUnitsUseCase.ts'
import { CreateUnitUseCase } from '@/application/units/usecases/CreateUnitUseCase.ts'
import { UpdateUnitUseCase } from '@/application/units/usecases/UpdateUnitUseCase.ts'
import { DeleteUnitUseCase } from '@/application/units/usecases/DeleteUnitUseCase.ts'
import { MergeUnitsUseCase } from '@/application/units/usecases/MergeUnitsUseCase.ts'


// Auth Services
export const authService = new AuthService()

// --- Singleton repository instances ---

export const recipeRepository = new RecipeRepository()
export const recipeCommentRepository = new RecipeCommentRepository()
export const recipeImportRepository = new RecipeImportRepository()
export const userRecipeRepository = new UserRecipeRepository(authService, recipeRepository)
export const userRepository = new UserRepository()

export const planningRepository = new PlanningRepository()
export const shoppingRepository = new ShoppingRepository()
export const categoryRepository = new CategoryRepository()
export const labelRepository = new LabelRepository()
export const tagRepository = new TagRepository()
export const toolRepository = new ToolRepository()
export const foodRepository = new FoodRepository()
export const unitRepository = new UnitRepository()
export const authRepository = new AuthRepository()

// --- Singleton use case instances — Recipe Coment ---

export const getRecipeCommentsUseCase = new GetRecipeCommentsUseCase(recipeCommentRepository)
export const createRecipeCommentUseCase = new CreateRecipeCommentUseCase(recipeCommentRepository)
export const deleteRecipeCommentUseCase = new DeleteRecipeCommentUseCase(recipeCommentRepository)

// --- Singleton use case instances — Recipe ---

export const getRecipesUseCase = new GetRecipesUseCase(recipeRepository)
export const getRecipeUseCase = new GetRecipeUseCase(recipeRepository)
export const getRecipesByIdsUseCase = new GetRecipesByIdsUseCase(recipeRepository)

export const createRecipeUseCase = new CreateRecipeUseCase(
  recipeRepository,
  foodRepository,
  unitRepository,
)
export const updateRecipeUseCase = new UpdateRecipeUseCase(
  recipeRepository,
  foodRepository,
  unitRepository,
)
export const deleteRecipeUseCase = new DeleteRecipeUseCase(recipeRepository)


export const updateCategoriesUseCase = new UpdateCategoriesUseCase(recipeRepository)
export const updateRecipeTagsUseCase = new UpdateRecipeTagsUseCase(recipeRepository)

// --- Singleton use case instances — Tag personnalise ---

export const updateSeasonsUseCase = new UpdateSeasonsUseCase(recipeRepository)
export const updateCalorieTagUseCase = new UpdateCalorieTagUseCase(recipeRepository)


// --- Singleton use case instances — Recipe Import ---

export const testRecipeScrapeUrlUseCase = new TestRecipeScrapeUrlUseCase(recipeImportRepository)
export const getRecipeScrapePreviewUseCase = new GetRecipeScrapePreviewUseCase(recipeImportRepository)
export const importRecipeByUrlUseCase = new ImportRecipeByUrlUseCase(recipeImportRepository)
export const importRecipesByUrlBulkUseCase = new ImportRecipesByUrlBulkUseCase(recipeImportRepository)

// --- Singleton use case instances — User ---

export const updateRatingUseCase = new UpdateRatingUseCase(userRecipeRepository)
export const getFavoritesUseCase = new GetFavoritesUseCase(userRecipeRepository)
export const toggleFavoriteUseCase = new ToggleFavoriteUseCase(userRecipeRepository)

// --- Singleton use case instances — Planning ---

export const getWeekPlanningUseCase = new GetWeekPlanningUseCase(planningRepository)
export const getPlanningRangeUseCase = new GetPlanningRangeUseCase(planningRepository)
export const addMealUseCase = new AddMealUseCase(planningRepository)
export const deleteMealUseCase = new DeleteMealUseCase(planningRepository)

// --- Singleton use case instances — Shopping ---

export const getShoppingItemsUseCase = new GetShoppingItemsUseCase(shoppingRepository)
export const addItemUseCase = new AddItemUseCase(shoppingRepository)
export const addRecipesToListUseCase = new AddRecipesToListUseCase(shoppingRepository, unitRepository)
export const toggleItemUseCase = new ToggleItemUseCase(shoppingRepository)
export const deleteItemUseCase = new DeleteItemUseCase(shoppingRepository)
export const clearListUseCase = new ClearListUseCase(shoppingRepository)

// --- Singleton use case instances — Label ---

export const getLabelsUseCase = new GetLabelsUseCase(labelRepository)
export const getPaginatedLabelsUseCase = new GetPaginatedLabelsUseCase(labelRepository)
export const createLabelUseCase = new CreateLabelUseCase(labelRepository)
export const updateLabelUseCase = new UpdateLabelUseCase(labelRepository)
export const deleteLabelUseCase = new DeleteLabelUseCase(labelRepository)

// --- Singleton use case instances — Category ---

export const getCategoriesUseCase = new GetCategoriesUseCase(categoryRepository)
export const getPaginatedCategoriesUseCase = new GetPaginatedCategoriesUseCase(categoryRepository)
export const createCategoryUseCase = new CreateCategoryUseCase(categoryRepository)
export const updateCategoryUseCase = new UpdateCategoryUseCase(categoryRepository)
export const deleteCategoryUseCase = new DeleteCategoryUseCase(categoryRepository)


// --- Singleton use case instances — Tags ---

export const getTagsUseCase = new GetTagsUseCase(tagRepository)
export const getTagDetailsUseCase = new GetTagDetailsUseCase(tagRepository)
export const getPaginatedTagsUseCase = new GetPaginatedTagsUseCase(tagRepository)
export const createTagUseCase = new CreateTagUseCase(tagRepository)
export const updateTagUseCase = new UpdateTagUseCase(tagRepository)
export const deleteTagUseCase = new DeleteTagUseCase(tagRepository)

// --- Singleton use case instances — Tools ---

export const getToolsUseCase = new GetToolsUseCase(toolRepository)
export const getPaginatedToolsUseCase = new GetPaginatedToolsUseCase(toolRepository)
export const createToolUseCase = new CreateToolUseCase(toolRepository)
export const updateToolUseCase = new UpdateToolUseCase(toolRepository)
export const deleteToolUseCase = new DeleteToolUseCase(toolRepository)

// --- Singleton use case instances — Food ---

export const getFoodsUseCase = new GetFoodsUseCase(foodRepository)
export const getPaginatedFoodsUseCase = new GetPaginatedFoodsUseCase(foodRepository)
export const createFoodUseCase = new CreateFoodUseCase(foodRepository)
export const createFoodDetailedUseCase = new CreateFoodDetailedUseCase(foodRepository)
export const updateFoodUseCase = new UpdateFoodUseCase(foodRepository)
export const deleteFoodUseCase = new DeleteFoodUseCase(foodRepository)
export const mergeFoodsUseCase = new MergeFoodsUseCase(foodRepository)

// --- Singleton use case instances — Units ---

export const getUnitsUseCase = new GetUnitsUseCase(unitRepository)
export const getPaginatedUnitsUseCase = new GetPaginatedUnitsUseCase(unitRepository)
export const createUnitUseCase = new CreateUnitUseCase(unitRepository)
export const updateUnitUseCase = new UpdateUnitUseCase(unitRepository)
export const deleteUnitUseCase = new DeleteUnitUseCase(unitRepository)
export const mergeUnitsUseCase = new MergeUnitsUseCase(unitRepository)

// --- Singleton use case instances — auth ---

export const loginUseCase = new LoginUseCase(authRepository)
export const logoutUseCase = new LogoutUseCase(authRepository)
