export { getEnv, isDockerRuntime } from "./env.ts"

// format
export { getCaloriesFromTags, isCalorieTag } from "./calorie.ts"
export { filterAndSortFoodsByRelevance } from "./food"
export { getRecipeSeasonsFromTags, isSeasonTag, SectionLabel } from "./season.ts"
export { formatDurationToNumber, formatDuration, parseDuration } from "./duration.ts"
export { addDays, formatDate, formatDateRange, formatDayDate, formatDayFr, startOfDay, toDateStr, formatCommentDate } from "./date.ts"
export { normalizeText, truncateText } from "./text.ts"
export { recipeImageUrl, userImageCandidates } from "./image.ts"
export { toggleValueInArray, toggleValuesInArray } from "./array.ts"
export { randomHexColor } from "./color.ts"

// mealie
export { getStoredMealieUrl } from "./mealieAuthStorage.ts"
export { getStoredMealieToken, setStoredMealieToken, setStoredMealieUrl } from "./mealieAuthStorage.ts"
export { buildTagMergeRecommendations, type TagMergeRecommendation } from "./tagMerge.ts"
export { renderIngredientText } from "./ingredient.ts"
export {
    findBestFoodMatch, findBestUnitMatch, isIngredientFullyMatched, normalizeFoodAliasValue,
    normalizeMatcherText, buildPreferredUnitLabel, getFoodSuggestions,
} from "./ingredientMatching.ts"
export { getRecipeServingsBase, scaleRecipeIngredientQuantity } from "./recipeServings.ts"


// provider 
export {
    findRecipeVideoAsset, findRecipeVideoAssetPair, getRecipeAssetMediaUrl, parseRecipeVideoManifest, buildRecipeVideoJsonFileName,
    isImageRecipeAsset, isStepImageRecipeAsset, parseStepImageAssetIndex, findRecipeStepImageAsset, getRecipeStepImageAssets,
    type RecipeVideoChapter,
} from "./recipeVideoAssets.ts"
export { 
    buildDraftManifestFromParsed, buildEditableManifestFromStored, buildValidatedManifest, cloneEditableManifest,
    getChapterLabel, getInstructionStepOptions,
    type EditableRecipeVideoManifest,
} from "./recipeVideoManifestEditor.ts"
