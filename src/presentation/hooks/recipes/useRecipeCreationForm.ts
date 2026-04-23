import { useMemo, useRef, useState, type ChangeEvent } from "react"

import type { RecipeFormData, RecipeFormIngredient, RecipeFormInstruction } from "@/shared/types/mealie/Recipes.ts"
import type { Season } from "@/shared/types/Season.ts"
import { isCalorieTag } from "@/shared/utils/calorie.ts"
import { isSeasonTag } from "@/shared/utils/season.ts"

function buildEmptyFormData(): RecipeFormData {
  return {
    name: "",
    description: "",
    prepTime: "",
    performTime: "",
    totalTime: "",
    recipeServings: "",
    nutrition: {},
    recipeIngredient: [
      { quantity: "1", unit: "", unitId: undefined, food: "", foodId: undefined, note: "" },
    ],
    recipeInstructions: [{ text: "" }],
    seasons: [],
    categories: [],
    tags: [],
    tools: [],
  }
}

export function useRecipeCreationForm(
  allTags: Array<{ id: string; name: string; slug: string }>,
) {
  const [formData, setFormData] = useState<RecipeFormData>(buildEmptyFormData)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [tagSearch, setTagSearch] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const patch = (partial: Partial<RecipeFormData>) => {
    setFormData((previousData) => ({ ...previousData, ...partial }))
  }

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    patch({ imageFile: file })
    setImagePreview(URL.createObjectURL(file))
  }

  const handleToggleCategory = (category: { id: string; name: string; slug: string }) => {
    const isActive = formData.categories.some((current) => current.id === category.id)
    patch({
      categories: isActive
        ? formData.categories.filter((current) => current.id !== category.id)
        : [...formData.categories, { id: category.id, name: category.name, slug: category.slug }],
    })
  }

  const handleToggleTool = (tool: { id: string; name: string; slug: string }) => {
    const isActive = formData.tools.some((current) => current.id === tool.id)
    patch({
      tools: isActive
        ? formData.tools.filter((current) => current.id !== tool.id)
        : [...formData.tools, tool],
    })
  }

  const handleRemoveTag = (tagId: string) => {
    patch({ tags: formData.tags.filter((tag) => tag.id !== tagId) })
  }

  const handleAddTag = (tag: { id: string; name: string; slug: string }) => {
    if (formData.tags.some((current) => current.id === tag.id)) return
    patch({ tags: [...formData.tags, tag] })
    setTagSearch("")
  }

  const availableTags = useMemo(() => allTags
    .filter((tag) => !isSeasonTag(tag) && !isCalorieTag(tag))
    .filter((tag) => !formData.tags.some((current) => current.id === tag.id))
    .filter((tag) => tag.name.toLowerCase().includes(tagSearch.toLowerCase().trim())), [allTags, formData.tags, tagSearch])

  const handleToggleSeason = (season: Season) => {
    const isActive = formData.seasons.includes(season)
    patch({
      seasons: isActive
        ? formData.seasons.filter((current) => current !== season)
        : [...formData.seasons, season],
    })
  }

  const addIngredient = () => {
    patch({
      recipeIngredient: [
        ...formData.recipeIngredient,
        { quantity: "1", unit: "", unitId: undefined, food: "", foodId: undefined, note: "" },
      ],
    })
  }

  const removeIngredient = (index: number) => {
    patch({ recipeIngredient: formData.recipeIngredient.filter((_, itemIndex) => itemIndex !== index) })
  }

  const updateIngredientField = (index: number, partial: Partial<RecipeFormIngredient>) => {
    patch({
      recipeIngredient: formData.recipeIngredient.map((ingredient, itemIndex) =>
        itemIndex === index ? { ...ingredient, ...partial } : ingredient),
    })
  }

  const addInstruction = () => {
    patch({
      recipeInstructions: [...formData.recipeInstructions, { text: "" }],
    })
  }

  const removeInstruction = (index: number) => {
    patch({ recipeInstructions: formData.recipeInstructions.filter((_, itemIndex) => itemIndex !== index) })
  }

  const updateInstruction = (index: number, value: string) => {
    patch({
      recipeInstructions: formData.recipeInstructions.map(
        (instruction, itemIndex): RecipeFormInstruction => (itemIndex === index ? { text: value } : instruction),
      ),
    })
  }

  return {
    formData,
    patch,
    imagePreview,
    tagSearch,
    setTagSearch,
    fileInputRef,
    handleImageChange,
    handleToggleCategory,
    handleToggleTool,
    handleRemoveTag,
    handleAddTag,
    availableTags,
    handleToggleSeason,
    addIngredient,
    removeIngredient,
    updateIngredientField,
    addInstruction,
    removeInstruction,
    updateInstruction,
  }
}
