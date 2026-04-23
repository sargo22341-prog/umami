import { useState, useEffect, useRef, useMemo } from "react"
import { X, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "components/ui"
import { MarkdownContent } from "components/common/MarkdownContent.tsx"
import type { MealieRecipeAsset, MealieRecipeIngredientOutput, MealieRecipeStep } from "@/shared/types/mealie/Recipes.ts"
import {
  findRecipeVideoAssetPair,
  findRecipeStepImageAsset,
  getRecipeAssetMediaUrl,
  parseRecipeVideoManifest,
  type RecipeVideoChapter,
} from "@/shared/utils"

interface CookingModeProps {
  recipeId: string
  recipeName: string
  ingredients: MealieRecipeIngredientOutput[]
  instructions: MealieRecipeStep[]
  assets?: MealieRecipeAsset[] | null
  onClose: () => void
}

type RecipeVideoData = {
  videoUrl: string
  chapters: RecipeVideoChapter[]
}

function findCurrentChapter(
  chapters: RecipeVideoChapter[],
  step: number,
  isIngredients: boolean,
): RecipeVideoChapter | null {
  if (isIngredients) {
    const ingredientsChapter = chapters.find((chapter) => chapter.stepIndex === -1)
    if (ingredientsChapter) return ingredientsChapter

    const firstStepChapter = chapters
      .filter((chapter) => chapter.stepIndex >= 0)
      .sort((left, right) => left.start - right.start)[0]
    if (!firstStepChapter) return null

    return {
      key: "ingredients-fallback",
      label: "Ingredients",
      stepIndex: -1,
      start: 0,
      end: Math.max(0, firstStepChapter.start - 0.3),
    }
  }

  return chapters.find((chapter) => chapter.stepIndex === step) ?? null
}

export function CookingMode({
  recipeId,
  recipeName,
  ingredients,
  instructions,
  assets,
  onClose,
}: CookingModeProps) {
  const [step, setStep] = useState(-1)
  const [videoData, setVideoData] = useState<RecipeVideoData | null>(null)
  const wakeLockRef = useRef<WakeLockSentinel | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)

  const totalSteps = instructions.length
  const isIngredients = step === -1
  const isLast = step === totalSteps - 1

  const matchedAssets = useMemo(() => findRecipeVideoAssetPair(assets ?? []), [assets])

  useEffect(() => {
    let cancelled = false

    if (!matchedAssets) {
      setVideoData(null)
      return
    }

    const loadVideoManifest = async () => {
      try {
        const jsonFileName = matchedAssets.jsonAsset.fileName
        const videoFileName = matchedAssets.videoAsset.fileName
        if (!jsonFileName || !videoFileName) {
          setVideoData(null)
          return
        }

        const response = await fetch(getRecipeAssetMediaUrl(recipeId, jsonFileName))
        if (!response.ok) {
          throw new Error(`Impossible de charger ${jsonFileName}`)
        }

        const payload = parseRecipeVideoManifest(await response.json())
        if (!payload || cancelled) {
          if (!cancelled) setVideoData(null)
          return
        }

        setVideoData({
          videoUrl: getRecipeAssetMediaUrl(recipeId, videoFileName),
          chapters: payload.chapters,
        })
      } catch {
        if (!cancelled) {
          setVideoData(null)
        }
      }
    }

    void loadVideoManifest()

    return () => {
      cancelled = true
    }
  }, [matchedAssets, recipeId])

  const currentChapter = useMemo(() => {
    if (!videoData) return null
    return findCurrentChapter(videoData.chapters, step, isIngredients)
  }, [videoData, isIngredients, step])
  const currentStepImageAsset = useMemo(
    () => findRecipeStepImageAsset(assets ?? [], isIngredients ? 0 : step + 1),
    [assets, isIngredients, step],
  )
  const currentMedia = useMemo(() => {
    if (videoData && currentChapter) {
      return {
        kind: "video" as const,
        url: videoData.videoUrl,
        label: formatChapterLabel(currentChapter, step),
      }
    }

    if (currentStepImageAsset?.fileName) {
      return {
        kind: "image" as const,
        url: getRecipeAssetMediaUrl(recipeId, currentStepImageAsset.fileName),
        label: isIngredients ? "Ingredients" : `Etape ${step + 1}`,
      }
    }

    return null
  }, [currentChapter, currentStepImageAsset, isIngredients, recipeId, step, videoData])
  const hasMediaLayout = Boolean(currentMedia)

  useEffect(() => {
    if ("wakeLock" in navigator) {
      navigator.wakeLock.request("screen").then((lock) => {
        wakeLockRef.current = lock
      }).catch(() => { })
    }

    return () => {
      wakeLockRef.current?.release().catch(() => { })
    }
  }, [])

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        if (!isLast) setStep((currentStep) => currentStep + 1)
      } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        if (step > -1) setStep((currentStep) => currentStep - 1)
      } else if (event.key === "Escape") {
        onClose()
      }
    }

    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [step, isLast, onClose])

  useEffect(() => {
    const video = videoRef.current
    if (!video || currentMedia?.kind !== "video" || !videoData || !currentChapter) return

    const playFromChapterStart = () => {
      video.currentTime = currentChapter.start
      void video.play().catch(() => { })
    }

    const getChapterEnd = () => {
      if (currentChapter.end != null) return currentChapter.end
      if (Number.isFinite(video.duration) && video.duration > 0) {
        return Math.max(currentChapter.start, video.duration - 0.1)
      }
      return null
    }

    const onLoadedMetadata = () => {
      playFromChapterStart()
    }

    const onTimeUpdate = () => {
      const chapterEnd = getChapterEnd()
      if (chapterEnd != null && video.currentTime >= chapterEnd) {
        playFromChapterStart()
      }
    }

    const onEnded = () => {
      playFromChapterStart()
    }

    if (video.readyState >= 1) {
      playFromChapterStart()
    }

    video.addEventListener("loadedmetadata", onLoadedMetadata)
    video.addEventListener("timeupdate", onTimeUpdate)
    video.addEventListener("ended", onEnded)

    return () => {
      video.removeEventListener("loadedmetadata", onLoadedMetadata)
      video.removeEventListener("timeupdate", onTimeUpdate)
      video.removeEventListener("ended", onEnded)
    }
  }, [currentMedia, videoData, currentChapter])

  const currentInstruction = !isIngredients ? instructions[step] : null

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-background" style={{ height: "100dvh" }}>
      <div className="shrink-0 border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="truncate text-sm font-medium text-muted-foreground">{recipeName}</span>
          <div className="ml-3 flex shrink-0 items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {isIngredients ? "Ingredients" : `Etape ${step + 1} / ${totalSteps}`}
            </span>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="h-1 w-full shrink-0 bg-muted">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: isIngredients ? "0%" : `${((step + 1) / totalSteps) * 100}%` }}
        />
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="h-full p-4 md:p-6">
          <div className={hasMediaLayout
            ? "grid h-full grid-rows-[auto_1fr] gap-4 landscape:grid-cols-[minmax(0,1fr)_minmax(320px,1fr)] landscape:grid-rows-1 md:grid-cols-[minmax(0,1.05fr)_minmax(340px,0.95fr)] md:grid-rows-1"
            : "flex h-full flex-col"
          }>
            {hasMediaLayout && (
              <div className="min-h-0">
                <div className="flex h-full flex-col rounded-[var(--radius-2xl)] border border-border bg-muted/20 p-3 md:p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-muted-foreground">
                      {isIngredients ? "Vue ingredients" : `Etape ${step + 1}`}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {currentMedia?.label}
                    </span>
                  </div>

                  {currentMedia?.kind === "video" ? (
                    <video
                      ref={videoRef}
                      src={currentMedia.url}
                      autoPlay
                      playsInline
                      muted
                      preload="metadata"
                      className="aspect-video w-full flex-1 rounded-xl bg-black object-contain"
                    />
                  ) : currentMedia?.kind === "image" ? (
                    <img
                      src={currentMedia.url}
                      alt={currentMedia.label}
                      className="aspect-video w-full flex-1 rounded-xl bg-black/5 object-contain"
                    />
                  ) : null}
                </div>
              </div>
            )}

            <div className="min-h-0 flex-1 rounded-[var(--radius-2xl)] border border-border bg-card">
              <div className="h-full overflow-y-auto px-5 py-5 md:px-6 md:py-6">
                {isIngredients ? (
                  <IngredientsScreen ingredients={ingredients} />
                ) : (
                  <InstructionScreen
                    instruction={currentInstruction!}
                    ingredients={ingredients}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-between gap-3 border-t border-border bg-background/95 px-4 py-4 backdrop-blur-sm md:px-6">
        <Button
          variant="outline"
          onClick={() => setStep((currentStep) => currentStep - 1)}
          disabled={isIngredients}
          className="gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          {step === 0 ? "Ingredients" : "Precedent"}
        </Button>

        {!isLast ? (
          <Button onClick={() => setStep((currentStep) => currentStep + 1)} className="gap-2">
            {isIngredients ? "Commencer" : "Suivant"}
            <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button variant="outline" onClick={onClose} className="gap-2 border-green-200 text-green-700 hover:bg-green-50 dark:hover:bg-green-950">
            Termine !
          </Button>
        )}
      </div>
    </div>
  )
}

function IngredientsScreen({ ingredients }: { ingredients: MealieRecipeIngredientOutput[] }) {
  const filtered = ingredients.filter(
    (ingredient) => ingredient.food?.name || ingredient.note || ingredient.quantity != null,
  )

  return (
    <div className="space-y-6">
      <h2 className="font-heading text-2xl font-bold tracking-tight md:text-3xl">Ingredients</h2>
      <ul className="space-y-4">
        {filtered.map((ingredient, index) => (
          <li key={index} className="flex items-baseline gap-2 text-lg md:text-xl">
            <span className="mt-2.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
            <span>{formatIngredientParts(ingredient)}</span>
            {ingredient.note && <span className="text-base text-muted-foreground"> - {ingredient.note}</span>}
          </li>
        ))}
      </ul>
    </div>
  )
}

function InstructionScreen({
  instruction,
  ingredients,
}: {
  instruction: MealieRecipeStep
  ingredients: MealieRecipeIngredientOutput[]
}) {
  const linkedIngredients = (instruction.ingredientReferences ?? [])
    .map((reference) =>
      ingredients.find((ingredient) => ingredient.referenceId === reference.referenceId),
    )
    .filter(Boolean)

  return (
    <div className="space-y-8">
      {linkedIngredients.length > 0 && (
        <div className="mb-6 space-y-2 border-b border-border/40 pb-4">
          <p className="text-sm font-medium text-muted-foreground">
            Ingredients utilises
          </p>

          <div className="flex flex-wrap gap-2">
            {linkedIngredients.map((ingredient, index) => (
              <span
                key={index}
                className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary"
              >
                {formatLinkedIngredientLabel(ingredient)}
              </span>
            ))}
          </div>
        </div>
      )}

      {(instruction.summary ?? instruction.title) && (
        <h3 className="font-heading text-xl font-semibold md:text-2xl">
          {instruction.summary ?? instruction.title}
        </h3>
      )}

      <MarkdownContent
        content={instruction.text ?? ""}
        className="text-xl leading-relaxed text-foreground md:text-2xl"
      />
    </div>
  )
}

function formatChapterLabel(chapter: RecipeVideoChapter, step: number) {
  if (chapter.stepIndex === -1 || step === -1) {
    return "Ingredients"
  }

  return `Chapitre ${chapter.stepIndex + 1}`
}

function formatLinkedIngredientLabel(ingredient: MealieRecipeIngredientOutput | undefined) {
  if (!ingredient) return ""

  return formatIngredientParts(ingredient)
}

function formatIngredientParts(ingredient: MealieRecipeIngredientOutput) {
  return [
    ingredient.quantity != null ? String(ingredient.quantity) : "",
    ingredient.unit?.name ?? "",
    ingredient.food?.name ?? "",
  ]
    .filter((part) => part.trim().length > 0)
    .join(" ")
}
