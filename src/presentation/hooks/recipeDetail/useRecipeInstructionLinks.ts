import { useCallback, useState } from "react"

import { buildAutoLinkedRecipeFormData } from "@/shared/utils/recipeInstructionIngredientLinks.ts"
import { generateId } from "@/shared/utils/id.ts"
import type { MealieFood } from "@/shared/types/mealie/food.ts"
import type {
  RecipeFormData,
  RecipeFormInstruction,
} from "@/shared/types/mealie/Recipes.ts"
import { normalizeInstructionReferences } from "components/recipeDetail/recipeDetail.helpers.tsx"

interface UseRecipeInstructionLinksParams {
  formData: RecipeFormData
  foods: MealieFood[]
  patch: (partial: Partial<RecipeFormData>) => void
}

export function useRecipeInstructionLinks({
  formData,
  foods,
  patch,
}: UseRecipeInstructionLinksParams) {
  const [instructionIngredientInputs, setInstructionIngredientInputs] = useState<Record<number, string>>({})

  const ensureInstructionIngredientReferences = useCallback((recipeData: RecipeFormData) => {
    const nextIngredients = recipeData.recipeIngredient.map((ingredient) => (
      ingredient.referenceId ? ingredient : { ...ingredient, referenceId: generateId() }
    ))

    const nextInstructions = recipeData.recipeInstructions.map((step) => ({
      ...step,
      ingredientReferences: normalizeInstructionReferences(
        (step.ingredientReferences ?? []).map((reference) => reference.referenceId),
      ),
    }))

    return {
      ...recipeData,
      recipeIngredient: nextIngredients,
      recipeInstructions: nextInstructions,
    }
  }, [])

  const addInstruction = useCallback(() => {
    patch({
      recipeInstructions: [...formData.recipeInstructions, { text: "" }],
    })
  }, [formData.recipeInstructions, patch])

  const removeInstruction = useCallback((index: number) => {
    patch({ recipeInstructions: formData.recipeInstructions.filter((_, currentIndex) => currentIndex !== index) })
  }, [formData.recipeInstructions, patch])

  const updateInstruction = useCallback((index: number, value: string) => {
    patch({
      recipeInstructions: formData.recipeInstructions.map(
        (instruction, currentIndex): RecipeFormInstruction => (
          currentIndex === index ? { ...instruction, text: value } : instruction
        ),
      ),
    })
  }, [formData.recipeInstructions, patch])

  const updateInstructionReferences = useCallback((
    instructionIndex: number,
    updater: (currentReferenceIds: string[]) => string[],
  ) => {
    const normalizedFormData = ensureInstructionIngredientReferences(formData)
    const nextInstructions = normalizedFormData.recipeInstructions.map((step, index) => {
      if (index !== instructionIndex) return step

      const currentReferenceIds = (step.ingredientReferences ?? [])
        .map((reference) => reference.referenceId)
        .filter((referenceId): referenceId is string => Boolean(referenceId))

      return {
        ...step,
        ingredientReferences: normalizeInstructionReferences(updater(currentReferenceIds)),
      }
    })

    patch({
      recipeIngredient: normalizedFormData.recipeIngredient,
      recipeInstructions: nextInstructions,
    })
  }, [ensureInstructionIngredientReferences, formData, patch])

  const handleAutoLinkIngredients = useCallback(() => {
    const normalizedFormData = ensureInstructionIngredientReferences(formData)
    const ingredientFoodById = new Map(foods.map((food) => [food.id, food]))
    const autoLinked = buildAutoLinkedRecipeFormData(normalizedFormData, ingredientFoodById)

    patch({
      recipeIngredient: autoLinked.formData.recipeIngredient,
      recipeInstructions: autoLinked.formData.recipeInstructions,
    })
  }, [ensureInstructionIngredientReferences, foods, formData, patch])

  const resetInstructionLinkInputs = useCallback(() => {
    setInstructionIngredientInputs({})
  }, [])

  return {
    instructionIngredientInputs,
    setInstructionIngredientInputs,
    addInstruction,
    removeInstruction,
    updateInstruction,
    updateInstructionReferences,
    handleAutoLinkIngredients,
    resetInstructionLinkInputs,
  }
}
