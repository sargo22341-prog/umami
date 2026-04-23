import { useCallback, useMemo, useState, type ChangeEvent } from "react"

import type { Season } from "@/shared/types/Season.ts"
import type { MealieRecipeCategory } from "@/shared/types/mealie/Category.ts"
import type {
  MealieRecipeOutput,
  RecipeFormData,
  RecipeFormIngredient,
} from "@/shared/types/mealie/Recipes.ts"
import { recipeImageUrl } from "@/shared/utils/image.ts"
import { buildFormData } from "components/recipeDetail/buildFormData.tsx"
import { NUTRITION_FIELDS } from "components/recipeDetail/recipeDetail.helpers.tsx"
import { generateId } from "@/shared/utils/id.ts"

interface UseRecipeDetailEditingParams {
  recipe: MealieRecipeOutput
  persistRecipeForm: (nextFormData: RecipeFormData) => Promise<MealieRecipeOutput | null>
  setRecipe: React.Dispatch<React.SetStateAction<MealieRecipeOutput | null>>
}

export function useRecipeDetailEditing({
  recipe,
  persistRecipeForm,
  setRecipe,
}: UseRecipeDetailEditingParams) {
  const [formData, setFormData] = useState<RecipeFormData>(() => buildFormData(recipe))
  const [imagePreview, setImagePreview] = useState<string | null>(() => recipeImageUrl(recipe, "original"))
  const [isDirty, setIsDirty] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [isEditingTags, setIsEditingTags] = useState(false)
  const [tagSearch, setTagSearch] = useState("")

  const patch = useCallback((partial: Partial<RecipeFormData>) => {
    setFormData((current) => ({ ...current, ...partial }))
    setIsDirty(true)
  }, [])

  const resetFormFromRecipe = useCallback((nextRecipe: MealieRecipeOutput) => {
    setRecipe(nextRecipe)
    setFormData(buildFormData(nextRecipe))
    setImagePreview(recipeImageUrl(nextRecipe, "original"))
    setIsDirty(false)
  }, [setRecipe])

  const handleImageChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    patch({ imageFile: file })
    setImagePreview(URL.createObjectURL(file))
    setIsDirty(true)
  }, [patch])

  const handleToggleCategory = useCallback((category: MealieRecipeCategory) => {
    if (!isEditMode) return

    const isActive = formData.categories.some((current) => current.id === category.id)
    const nextCategories = isActive
      ? formData.categories.filter((current) => current.id !== category.id)
      : [...formData.categories, {
        id: category.id,
        name: category.name,
        slug: category.slug,
        groupId: category.groupId,
      }]

    setFormData((current) => ({ ...current, categories: nextCategories }))
    setIsDirty(true)
  }, [formData.categories, isEditMode])

  const handleToggleTool = useCallback((tool: { id: string; name: string; slug: string }) => {
    if (!isEditMode) return

    const active = formData.tools.some((current) => current.id === tool.id)
    const nextTools = active
      ? formData.tools.filter((current) => current.id !== tool.id)
      : [...formData.tools, tool]

    setFormData((current) => ({ ...current, tools: nextTools }))
    setIsDirty(true)
  }, [formData.tools, isEditMode])

  const handleToggleSeason = useCallback((season: Season) => {
    if (!isEditMode) return

    const nextSeasons = formData.seasons.includes(season)
      ? formData.seasons.filter((current) => current !== season)
      : [...formData.seasons, season]

    setFormData((current) => ({ ...current, seasons: nextSeasons }))
    setIsDirty(true)
  }, [formData.seasons, isEditMode])

  const addIngredient = useCallback(() => {
    patch({
      recipeIngredient: [
        ...formData.recipeIngredient,
        {
          quantity: "",
          unit: "",
          unitId: undefined,
          food: "",
          foodId: undefined,
          note: "",
          referenceId: generateId(),
        },
      ],
    })
  }, [formData.recipeIngredient, patch])

  const removeIngredient = useCallback((index: number) => {
    const removedReferenceId = formData.recipeIngredient[index]?.referenceId

    patch({
      recipeIngredient: formData.recipeIngredient.filter((_, currentIndex) => currentIndex !== index),
      recipeInstructions: formData.recipeInstructions.map((step) => ({
        ...step,
        ingredientReferences: removedReferenceId
          ? (step.ingredientReferences ?? []).filter((reference) => reference.referenceId !== removedReferenceId)
          : step.ingredientReferences,
      })),
    })
  }, [formData.recipeIngredient, formData.recipeInstructions, patch])

  const updateIngredientField = useCallback((index: number, partial: Partial<RecipeFormIngredient>) => {
    patch({
      recipeIngredient: formData.recipeIngredient.map((ingredient, currentIndex) =>
        currentIndex === index ? { ...ingredient, ...partial } : ingredient),
    })
  }, [formData.recipeIngredient, patch])

  const handleRemoveTag = useCallback((tagId: string) => {
    patch({
      tags: formData.tags.filter((tag) => tag.id !== tagId),
    })
  }, [formData.tags, patch])

  const moveInstruction = useCallback((fromIndex: number, toIndex: number) => {
    if (!isEditMode || fromIndex === toIndex) return
    if (fromIndex < 0 || toIndex < 0) return
    if (fromIndex >= formData.recipeInstructions.length || toIndex >= formData.recipeInstructions.length) return

    const nextInstructions = [...formData.recipeInstructions]
    const [movedInstruction] = nextInstructions.splice(fromIndex, 1)
    nextInstructions.splice(toIndex, 0, movedInstruction)

    patch({
      recipeInstructions: nextInstructions,
    })
  }, [formData.recipeInstructions, isEditMode, patch])

  const handleAddTag = useCallback((tag: { id: string; name: string; slug: string }) => {
    patch({
      tags: [...formData.tags, tag],
    })
    setTagSearch("")
  }, [formData.tags, patch])

  const handleToggleTagEditing = useCallback(() => {
    setIsEditingTags((current) => !current)
  }, [])

  const handleCancelEditing = useCallback(() => {
    resetFormFromRecipe(recipe)
    setIsEditMode(false)
    setIsEditingTags(false)
    setTagSearch("")
  }, [recipe, resetFormFromRecipe])

  const handleSave = useCallback(async () => {
    const updated = await persistRecipeForm(formData)
    if (!updated) return null

    setRecipe(updated)
    setFormData(buildFormData(updated))
    setImagePreview(recipeImageUrl(updated, "original"))
    setIsDirty(false)
    setIsEditMode(false)
    setIsEditingTags(false)
    setTagSearch("")

    return updated
  }, [formData, persistRecipeForm, setRecipe])

  const handleToggleEditMode = useCallback(async () => {
    if (!isEditMode) {
      setIsEditMode(true)
      return
    }

    if (isDirty) {
      const updated = await handleSave()
      if (!updated) return
    }

    setIsEditMode(false)
    setIsEditingTags(false)
    setTagSearch("")
  }, [handleSave, isDirty, isEditMode])

  const visibleNutritionEntries = useMemo(
    () => NUTRITION_FIELDS.filter(({ key }) =>
      isEditMode || Boolean(String(formData.nutrition[key] ?? "").trim())),
    [formData.nutrition, isEditMode],
  )

  const visibleIngredients = useMemo(
    () => formData.recipeIngredient.filter((ingredient) =>
      isEditMode || Boolean(ingredient.quantity || ingredient.unit || ingredient.food || ingredient.note)),
    [formData.recipeIngredient, isEditMode],
  )

  const analyzableIngredientIndexes = useMemo(
    () => formData.recipeIngredient
      .map((ingredient, index) => (
        ingredient.note.trim() && !ingredient.food.trim() && !ingredient.unit.trim() ? index : -1
      ))
      .filter((index) => index >= 0),
    [formData.recipeIngredient],
  )

  const visibleInstructions = useMemo(
    () => formData.recipeInstructions.filter((step) => isEditMode || Boolean(step.text?.trim())),
    [formData.recipeInstructions, isEditMode],
  )

  return {
    formData,
    imagePreview,
    isDirty,
    isEditMode,
    isEditingTags,
    tagSearch,
    setTagSearch,
    patch,
    resetFormFromRecipe,
    handleImageChange,
    handleToggleCategory,
    handleToggleTool,
    handleToggleSeason,
    addIngredient,
    removeIngredient,
    updateIngredientField,
    handleRemoveTag,
    handleAddTag,
    moveInstruction,
    handleToggleTagEditing,
    handleCancelEditing,
    handleSave,
    handleToggleEditMode,
    visibleNutritionEntries,
    visibleIngredients,
    analyzableIngredientIndexes,
    visibleInstructions,
  }
}
