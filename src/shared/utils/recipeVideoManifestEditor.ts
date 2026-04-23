import type { MealieRecipeStep } from "@/shared/types/mealie/Recipes.ts"
import type { RecipeVideoChapter, RecipeVideoManifest } from "./recipeVideoAssets.ts"

export type EditableRecipeVideoChapter = Omit<RecipeVideoChapter, "stepIndex"> & {
  stepIndex: number | null
}

export type EditableRecipeVideoManifest = Omit<RecipeVideoManifest, "chapters"> & {
  chapters: EditableRecipeVideoChapter[]
}

export type RecipeStepOption = {
  id: string
  label: string
  stepIndex: number
}

export function cloneEditableManifest(
  manifest: EditableRecipeVideoManifest,
): EditableRecipeVideoManifest {
  return {
    ...manifest,
    source: manifest.source ? { ...manifest.source } : undefined,
    chapters: manifest.chapters.map((chapter) => ({ ...chapter })),
  }
}

export function getInstructionStepOptions(
  recipeInstructions: MealieRecipeStep[] = [],
): RecipeStepOption[] {
  return recipeInstructions.map((_, index) => ({
    id: `step-${index}`,
    stepIndex: index,
    label: `Etape ${index + 1}`,
  }))
}

export function getChapterLabel(
  stepIndex: number | null,
  stepOptions: RecipeStepOption[],
  fallbackIndex?: number,
): string {
  if (stepIndex === -1) return "Ingredients"
  if (stepIndex == null) return "Non liee"

  return stepOptions.find((option) => option.stepIndex === stepIndex)?.label ?? (
    typeof fallbackIndex === "number" ? `Etape ${fallbackIndex + 1}` : `Etape ${stepIndex + 1}`
  )
}

export function getChapterStepIndexByPosition(
  chapter: EditableRecipeVideoChapter,
): number | null {
  const chapterKeyMatch = chapter.key.match(/^step-(\d+)$/i)
  if (chapterKeyMatch) {
    return Number(chapterKeyMatch[1]) - 1
  }

  if (typeof chapter.stepIndex === "number" && chapter.stepIndex >= 0) {
    return chapter.stepIndex
  }

  return null
}

export function buildDraftManifestFromParsed(
  manifest: RecipeVideoManifest,
  videoFileName: string,
): EditableRecipeVideoManifest {
  return {
    ...manifest,
    videoAsset: videoFileName,
    chapters: manifest.chapters.map((chapter) => ({
      ...chapter,
      stepIndex: chapter.stepIndex,
      label: chapter.stepIndex === -1 ? "Ingredients" : chapter.label,
    })),
  }
}

export function buildEditableManifestFromStored(
  manifest: RecipeVideoManifest,
): EditableRecipeVideoManifest {
  return {
    ...manifest,
    chapters: manifest.chapters.map((chapter) => ({
      ...chapter,
      stepIndex:
        chapter.stepIndex === -1 || chapter.key === "ingredients"
          ? -1
          : getChapterStepIndexByPosition(chapter),
      label: chapter.stepIndex === -1 || chapter.key === "ingredients" ? "Ingredients" : chapter.label,
    })),
  }
}

export function buildValidatedManifest(
  manifest: EditableRecipeVideoManifest,
  recipeInstructions: MealieRecipeStep[] = [],
): RecipeVideoManifest | null {
  const chapters: RecipeVideoChapter[] = []

  for (const chapter of manifest.chapters) {
    let nextStepIndex: number | null

    if (chapter.key === "ingredients" || chapter.stepIndex === -1) {
      nextStepIndex = -1
    } else if (typeof chapter.stepIndex === "number" && chapter.stepIndex >= 0) {
      nextStepIndex = chapter.stepIndex
    } else {
      nextStepIndex = getChapterStepIndexByPosition(chapter)
    }

    if (nextStepIndex == null) return null
    if (nextStepIndex >= recipeInstructions.length) return null

    chapters.push({
      key: chapter.key,
      label: chapter.label,
      stepIndex: nextStepIndex,
      start: chapter.start,
      end: chapter.end,
    })
  }

  return {
    version: manifest.version,
    title: manifest.title,
    source: manifest.source,
    videoAsset: manifest.videoAsset,
    chapters,
  }
}
