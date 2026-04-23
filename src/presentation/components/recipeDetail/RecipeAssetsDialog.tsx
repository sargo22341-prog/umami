import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  ChevronLeft, ChevronRight, CircleHelp, ExternalLink, Film, ImagePlus, Loader2, Save, Sparkles, Upload,
} from "lucide-react"

import {
  Button, Input, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "components/ui"

import { cn } from "@/lib/utils.ts"
import { useRecipeAssets } from "hooks/recipes"
import type {
  MealieRecipeAsset,
  MealieRecipeOutput,
} from "@/shared/types/mealie/Recipes.ts"
import {
  buildRecipeVideoJsonFileName,
  findRecipeVideoAsset,
  findRecipeVideoAssetPair,
  getRecipeAssetMediaUrl,
  parseRecipeVideoManifest,
  buildDraftManifestFromParsed,
  buildEditableManifestFromStored,
  buildValidatedManifest,
  cloneEditableManifest,
  getChapterLabel,
  getInstructionStepOptions,
  type EditableRecipeVideoManifest,
  getRecipeStepImageAssets,
  isImageRecipeAsset,
} from "@/shared/utils"

import {
  buildJowVideoImportPayload,
  fetchJowVideoImportDraft,
} from "@/infrastructure/recipeSources/providers/jow/jow.videoImportWorkflow.ts"
import { exportImageStep } from "@/infrastructure/recipeSources/exportImageStep.ts"
import { isJowRecipeUrl } from "@/infrastructure/recipeSources/providers/jow/jow.videoImport.ts"

interface RecipeAssetsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  recipe: MealieRecipeOutput
  onRecipeUpdated: (recipe: MealieRecipeOutput) => void
  mealieRecipeUrl?: string | null
}

interface PendingStepImage {
  id: string
  sourceFile: File
  previewUrl: string
  stepIndex: number | null
}

type AssetsTab = "images" | "video"

function getAssetExtension(asset: MealieRecipeAsset): string {
  const source = asset.fileName ?? asset.name
  const extension = source.split(".").pop()?.trim().toLowerCase()
  return extension && extension !== source.toLowerCase() ? extension : "-"
}

function formatChapterTime(value: number | null): string {
  if (value == null) return "fin video"
  return `${value.toFixed(1)} s`
}

function buildStepOptionLabel(stepIndex: number) {
  return stepIndex === 0 ? "Ingredients (step-0)" : `Etape ${stepIndex} (step-${stepIndex})`
}

function buildStepImageFileName(stepIndex: number) {
  return `step-${stepIndex}.jpg`
}

function toAssetStepIndex(videoStepIndex: number | null) {
  if (videoStepIndex == null) return null
  return videoStepIndex === -1 ? 0 : videoStepIndex + 1
}

async function convertImageFileToJpeg(file: File, targetFileName: string): Promise<File> {
  const objectUrl = URL.createObjectURL(file)

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image()
      element.onload = () => resolve(element)
      element.onerror = () => reject(new Error(`Impossible de preparer l'image ${file.name}.`))
      element.src = objectUrl
    })

    const canvas = document.createElement("canvas")
    canvas.width = image.naturalWidth || image.width
    canvas.height = image.naturalHeight || image.height

    const context = canvas.getContext("2d")
    if (!context) {
      throw new Error("Impossible de preparer le canvas de conversion.")
    }

    context.fillStyle = "#ffffff"
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.drawImage(image, 0, 0)

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((nextBlob) => {
        if (!nextBlob) {
          reject(new Error(`Impossible de convertir ${file.name} en JPEG.`))
          return
        }

        resolve(nextBlob)
      }, "image/jpeg", 0.92)
    })

    return new File([blob], targetFileName, {
      type: "image/jpeg",
      lastModified: Date.now(),
    })
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

export function RecipeAssetsDialog({
  open,
  onOpenChange,
  recipe,
  onRecipeUpdated,
  mealieRecipeUrl = null,
}: RecipeAssetsDialogProps) {
  const [activeTab, setActiveTab] = useState<AssetsTab>("images")
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [infoMessage, setInfoMessage] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const [previewManifest, setPreviewManifest] = useState<EditableRecipeVideoManifest | null>(null)
  const [editedManifest, setEditedManifest] = useState<EditableRecipeVideoManifest | null>(null)
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [activeChapterIndex, setActiveChapterIndex] = useState(0)
  const [jsonFileName, setJsonFileName] = useState<string | null>(null)
  const [pendingImages, setPendingImages] = useState<PendingStepImage[]>([])
  const [validationError, setValidationError] = useState<string | null>(null)
  const [extractingImages, setExtractingImages] = useState(false)
  const [blockedDismissFeedback, setBlockedDismissFeedback] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const blockedDismissTimeoutRef = useRef<number | null>(null)
  const {
    assets,
    loading,
    uploading,
    savingJson,
    error,
    loadAssets,
    uploadAssets,
    saveJsonAsset,
  } = useRecipeAssets(recipe.slug, recipe.assets ?? [])

  const isJowSource = isJowRecipeUrl(recipe.orgURL?.trim() ?? "")
  const existingPair = useMemo(() => findRecipeVideoAssetPair(assets), [assets])
  const existingVideoAsset = useMemo(
    () => existingPair?.videoAsset ?? findRecipeVideoAsset(assets),
    [assets, existingPair],
  )
  const hasImportedVideoAsset = Boolean(existingVideoAsset?.fileName)
  const hasVideoTab = isJowSource
  const stepOptions = useMemo(
    () => Array.from({ length: (recipe.recipeInstructions?.length ?? 0) + 1 }).map((_, index) => ({
      id: `asset-step-${index}`,
      value: index,
      label: buildStepOptionLabel(index),
    })),
    [recipe.recipeInstructions],
  )
  const videoStepOptions = useMemo(
    () => getInstructionStepOptions(recipe.recipeInstructions ?? []),
    [recipe.recipeInstructions],
  )
  const hasStoredJsonAsset = Boolean(existingPair?.jsonAsset.fileName)
  const activeManifest = editedManifest ?? previewManifest
  const activeChapter = activeManifest?.chapters[activeChapterIndex] ?? null
  const assetRows = useMemo(() => assets, [assets])
  const existingImageAssets = useMemo(
    () => getRecipeStepImageAssets(assets.filter(isImageRecipeAsset))
      .sort((left, right) => {
        const leftStep = left.stepIndex ?? Number.MAX_SAFE_INTEGER
        const rightStep = right.stepIndex ?? Number.MAX_SAFE_INTEGER
        if (leftStep !== rightStep) return leftStep - rightStep

        const leftFileName = left.asset.fileName ?? left.asset.name
        const rightFileName = right.asset.fileName ?? right.asset.name
        return leftFileName.localeCompare(rightFileName, "fr")
      }),
    [assets],
  )
  const occupiedExistingImageStepIndexes = useMemo(
    () => new Set(
      existingImageAssets
        .map(({ stepIndex }) => stepIndex)
        .filter((stepIndex): stepIndex is number => stepIndex != null),
    ),
    [existingImageAssets],
  )
  const occupiedVideoStepIndexes = useMemo(() => new Set(
    (activeManifest?.chapters ?? [])
      .map((chapter) => toAssetStepIndex(chapter.stepIndex))
      .filter((stepIndex): stepIndex is number => stepIndex != null),
  ), [activeManifest])

  const pendingAssignedStepIndexes = useCallback((currentImageId?: string) => new Set(
    pendingImages
      .filter((item) => item.id !== currentImageId)
      .map((item) => item.stepIndex)
      .filter((stepIndex): stepIndex is number => stepIndex != null),
  ), [pendingImages])

  const canCloseDialog = pendingImages.length === 0 && !uploading && !extractingImages

  const validateAndPersistJson = useCallback(async () => {
    if (!editedManifest || !jsonFileName) return true

    const finalManifest = buildValidatedManifest(editedManifest, recipe.recipeInstructions ?? [])
    if (!finalManifest) {
      setStatusMessage(null)
      setInfoMessage(null)
      setPreviewError("Le JSON des chapitres est invalide. Associe chaque chapitre a une etape avant de fermer.")
      setActiveTab("video")
      return false
    }

    setStatusMessage(null)
    setInfoMessage(null)
    setPreviewError(null)

    const nextRecipe = await saveJsonAsset(jsonFileName, finalManifest)
    if (!nextRecipe) return false

    onRecipeUpdated(nextRecipe)
    setStatusMessage("Le JSON des chapitres a ete enregistre dans Mealie.")
    return true
  }, [editedManifest, jsonFileName, onRecipeUpdated, recipe.recipeInstructions, saveJsonAsset])

  const triggerBlockedDismissFeedback = useCallback(() => {
    setBlockedDismissFeedback(true)
    if (blockedDismissTimeoutRef.current != null) {
      window.clearTimeout(blockedDismissTimeoutRef.current)
    }

    blockedDismissTimeoutRef.current = window.setTimeout(() => {
      setBlockedDismissFeedback(false)
      blockedDismissTimeoutRef.current = null
    }, 550)
  }, [])

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setStatusMessage(null)
      setInfoMessage(null)
      setPreviewError(null)
      setValidationError(null)
      setActiveTab("images")
    }

    onOpenChange(nextOpen)
  }

  useEffect(() => {
    if (!open) return

    void loadAssets().then((nextRecipe) => {
      if (nextRecipe) onRecipeUpdated(nextRecipe)
    })
  }, [loadAssets, onRecipeUpdated, open])

  useEffect(() => {
    let cancelled = false

    if (!open) return

    const loadPreview = async () => {
      const videoFileName = existingVideoAsset?.fileName
      if (!videoFileName) {
        if (!cancelled) {
          setPreviewManifest(null)
          setEditedManifest(null)
          setPreviewVideoUrl(null)
          setJsonFileName(null)
          setPreviewError(null)
          setActiveChapterIndex(0)
        }
        return
      }

      setPreviewVideoUrl(getRecipeAssetMediaUrl(recipe.id, videoFileName))

      if (existingPair?.jsonAsset.fileName) {
        try {
          const response = await fetch(getRecipeAssetMediaUrl(recipe.id, existingPair.jsonAsset.fileName))
          if (!response.ok) {
            throw new Error("Impossible de charger le manifeste video.")
          }

          const manifest = parseRecipeVideoManifest(await response.json())
          if (!manifest) {
            throw new Error("Le JSON des chapitres est invalide.")
          }

          if (!cancelled) {
            const editableManifest = buildEditableManifestFromStored(manifest)
            setPreviewManifest(editableManifest)
            setEditedManifest(cloneEditableManifest(editableManifest))
            setJsonFileName(existingPair.jsonAsset.fileName)
            setPreviewError(null)
            setActiveChapterIndex(0)
          }
        } catch (err) {
          if (!cancelled) {
            setPreviewManifest(null)
            setEditedManifest(null)
            setJsonFileName(existingPair.jsonAsset.fileName)
            setPreviewError(
              err instanceof Error ? err.message : "Impossible de preparer la previsualisation video.",
            )
            setActiveChapterIndex(0)
          }
        }
        return
      }

      if (!isJowSource) {
        if (!cancelled) {
          setPreviewManifest(null)
          setEditedManifest(null)
          setJsonFileName(buildRecipeVideoJsonFileName(videoFileName))
          setPreviewError(null)
          setActiveChapterIndex(0)
        }
        return
      }

      try {
        const draft = await fetchJowVideoImportDraft(recipe)
        if (draft.status !== "success") {
          if (!cancelled) {
            setPreviewManifest(null)
            setEditedManifest(null)
            setJsonFileName(buildRecipeVideoJsonFileName(videoFileName))
            setPreviewError(null)
            setInfoMessage(draft.message)
            setActiveChapterIndex(0)
          }
          return
        }

        if (!cancelled) {
          const editableManifest = buildDraftManifestFromParsed(draft.data.manifest, videoFileName)
          setPreviewManifest(editableManifest)
          setEditedManifest(cloneEditableManifest(editableManifest))
          setJsonFileName(draft.data.chaptersFileName)
          setPreviewError(null)
          setActiveChapterIndex(0)
        }
      } catch (err) {
        if (!cancelled) {
          setPreviewManifest(null)
          setEditedManifest(null)
          setJsonFileName(buildRecipeVideoJsonFileName(videoFileName))
          setPreviewError(
            err instanceof Error ? err.message : "Impossible de preparer les chapitres video.",
          )
          setActiveChapterIndex(0)
        }
      }
    }

    void loadPreview()

    return () => {
      cancelled = true
    }
  }, [existingPair, existingVideoAsset, isJowSource, open, recipe.id, onRecipeUpdated, recipe])

  useEffect(() => {
    const video = videoRef.current
    if (!video || !activeChapter) return

    const playFromChapterStart = () => {
      video.currentTime = activeChapter.start
      void video.play().catch(() => { })
    }

    const getChapterEnd = () => {
      if (activeChapter.end != null) return activeChapter.end
      if (Number.isFinite(video.duration) && video.duration > 0) {
        return Math.max(activeChapter.start, video.duration - 0.3)
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
  }, [activeChapter])

  useEffect(() => {
    if (open) return

    setPendingImages((current) => {
      current.forEach((item) => URL.revokeObjectURL(item.previewUrl))
      return []
    })
    setStatusMessage(null)
    setValidationError(null)
  }, [open])

  useEffect(() => () => {
    if (blockedDismissTimeoutRef.current != null) {
      window.clearTimeout(blockedDismissTimeoutRef.current)
    }
  }, [])

  const handleImport = useCallback(async () => {
    if (hasImportedVideoAsset) return

    setStatusMessage(null)
    setInfoMessage(null)
    setPreviewError(null)
    setImporting(true)

    try {
      const result = await buildJowVideoImportPayload(recipe)
      if (result.status !== "success") {
        setInfoMessage(result.message)
        return
      }

      const nextRecipe = await uploadAssets({
        videoFile: result.videoFile,
      })
      if (!nextRecipe) return

      const uploadedVideoAsset = findRecipeVideoAsset(nextRecipe.assets ?? [])
      const uploadedVideoFileName = uploadedVideoAsset?.fileName ?? result.videoFile.name
      const editableManifest = buildDraftManifestFromParsed(
        result.manifest,
        uploadedVideoFileName,
      )

      onRecipeUpdated(nextRecipe)
      setPreviewManifest(editableManifest)
      setEditedManifest(cloneEditableManifest(editableManifest))
      setPreviewVideoUrl(getRecipeAssetMediaUrl(nextRecipe.id, uploadedVideoFileName))
      setJsonFileName(result.chaptersFileName)
      setActiveChapterIndex(0)
      setStatusMessage("Video importee.")
    } catch (err) {
      setPreviewError(err instanceof Error ? err.message : "Impossible d'importer la video.")
    } finally {
      setImporting(false)
    }
  }, [hasImportedVideoAsset, onRecipeUpdated, recipe, uploadAssets])

  function updateChapterValue(
    index: number,
    field: "start" | "end",
    rawValue: string,
  ) {
    if (hasStoredJsonAsset) return

    setEditedManifest((current) => {
      if (!current) return current

      const chapters = current.chapters.map((chapter, chapterIndex) => {
        if (chapterIndex !== index) return chapter

        if (field === "end" && rawValue.trim() === "") {
          return { ...chapter, end: null }
        }

        const nextValue = Number(rawValue)
        if (!Number.isFinite(nextValue)) return chapter

        return {
          ...chapter,
          [field]: nextValue,
        }
      })

      return {
        ...current,
        chapters,
      }
    })
  }

  function updateChapterStep(index: number, nextValue: string) {
    if (hasStoredJsonAsset) return

    const nextAssetStepIndex = nextValue === "__none__" ? null : Number(nextValue)
    const nextStepIndex = nextAssetStepIndex == null
      ? null
      : nextAssetStepIndex === 0
        ? -1
        : nextAssetStepIndex - 1

    setEditedManifest((current) => {
      if (!current) return current

      const nextChapters = current.chapters.map((chapter, chapterIndex) => {
        if (chapterIndex === index) {
          return {
            ...chapter,
            stepIndex: nextStepIndex,
          }
        }

        if (nextStepIndex != null && chapter.stepIndex === nextStepIndex) {
          return {
            ...chapter,
            stepIndex: null,
          }
        }

        return chapter
      })

      return {
        ...current,
        chapters: nextChapters,
      }
    })
  }

  async function handleSaveJson() {
    const saved = await validateAndPersistJson()
    if (!saved) {
      setPreviewError("Le JSON des chapitres est invalide. Associe chaque chapitre a une etape avant de valider.")
      setActiveTab("video")
    }
  }

  const handlePendingFilesAdded = useCallback((fileList: FileList | null) => {
    if (!fileList?.length) return

    const nextImages = Array.from(fileList)
      .filter((file) => file.type.startsWith("image/"))
      .map((file, index) => ({
        id: `${file.name}-${file.lastModified}-${index}`,
        sourceFile: file,
        previewUrl: URL.createObjectURL(file),
        stepIndex: null,
      }))

    if (nextImages.length === 0) {
      setValidationError("Selectionne uniquement des fichiers image.")
      setActiveTab("images")
      return
    }

    setPendingImages((current) => [...current, ...nextImages])
    setStatusMessage(null)
    setValidationError(null)
    setActiveTab("images")
  }, [])

  const handlePendingStepChange = useCallback((id: string, nextStepValue: string) => {
    const nextStepIndex = nextStepValue === "__none__" ? null : Number(nextStepValue)

    setPendingImages((current) => current.map((item) =>
      item.id === id ? { ...item, stepIndex: Number.isFinite(nextStepIndex) ? nextStepIndex : null } : item))
    setValidationError(null)
  }, [])

  const handleRemovePendingImage = useCallback((id: string) => {
    setPendingImages((current) => {
      const target = current.find((item) => item.id === id)
      if (target) {
        URL.revokeObjectURL(target.previewUrl)
      }

      return current.filter((item) => item.id !== id)
    })
  }, [])

  const handleUploadPendingImages = useCallback(async () => {
    if (pendingImages.length === 0) {
      setValidationError("Ajoute au moins une image avant l'envoi.")
      setActiveTab("images")
      return
    }

    const unassignedImage = pendingImages.find((item) => item.stepIndex == null)
    if (unassignedImage) {
      setValidationError("Associe chaque image a une etape avant l'envoi.")
      setActiveTab("images")
      return
    }

    const assignedStepIndexes = pendingImages
      .map((item) => item.stepIndex)
      .filter((stepIndex): stepIndex is number => stepIndex != null)
    const assignedStepSet = new Set<number>()
    for (const stepIndex of assignedStepIndexes) {
      if (assignedStepSet.has(stepIndex)) {
        setValidationError(`Une seule image est autorisee pour ${buildStepOptionLabel(stepIndex)}.`)
        setActiveTab("images")
        return
      }
      assignedStepSet.add(stepIndex)
    }

    const conflictingExistingStep = assignedStepIndexes.find((stepIndex) => occupiedExistingImageStepIndexes.has(stepIndex))
    if (conflictingExistingStep != null) {
      setValidationError(
        `${buildStepOptionLabel(conflictingExistingStep)} a deja une image dans Mealie. Supprime-la d'abord dans Mealie avant d'en envoyer une nouvelle.`,
      )
      setActiveTab("images")
      return
    }

    const conflictingVideoStep = assignedStepIndexes.find((stepIndex) => occupiedVideoStepIndexes.has(stepIndex))
    if (conflictingVideoStep != null) {
      setValidationError(
        `${buildStepOptionLabel(conflictingVideoStep)} est deja reservee par une video. Retire d'abord cette association dans l'onglet Video.`,
      )
      setActiveTab("images")
      return
    }

    setValidationError(null)
    setStatusMessage(null)

    try {
      const imageFiles = await Promise.all(
        pendingImages.map((item) =>
          convertImageFileToJpeg(item.sourceFile, buildStepImageFileName(item.stepIndex!))),
      )

      const nextRecipe = await uploadAssets({ imageFiles })
      if (!nextRecipe) return

      onRecipeUpdated(nextRecipe)
      setStatusMessage(`${imageFiles.length} image${imageFiles.length > 1 ? "s" : ""} envoyee${imageFiles.length > 1 ? "s" : ""}.`)
      setPendingImages((current) => {
        current.forEach((item) => URL.revokeObjectURL(item.previewUrl))
        return []
      })
    } catch (uploadError) {
      setValidationError(
        uploadError instanceof Error ? uploadError.message : "Impossible de preparer les images avant l'envoi.",
      )
      setActiveTab("images")
    }
  }, [occupiedExistingImageStepIndexes, occupiedVideoStepIndexes, onRecipeUpdated, pendingImages, uploadAssets])

  const handleExtractSourceImages = useCallback(async () => {
    const sourceUrl = recipe.orgURL?.trim() ?? ""
    if (!sourceUrl) {
      setValidationError("Aucune URL source n'est renseignee sur cette recette.")
      setActiveTab("images")
      return
    }

    setExtractingImages(true)
    setValidationError(null)
    setStatusMessage(null)

    try {
      const extracted = await exportImageStep(sourceUrl)
      if (extracted.items.length === 0) {
        setStatusMessage("Aucune image d'etape exploitable n'a ete trouvee dans le schema source.")
        setActiveTab("images")
        return
      }

      const maxStepIndex = stepOptions.length - 1
      const currentPendingSteps = pendingAssignedStepIndexes()
      const importableItems = extracted.items.filter((item) =>
        item.stepIndex >= 0
        && item.stepIndex <= maxStepIndex
        && !occupiedExistingImageStepIndexes.has(item.stepIndex)
        && !occupiedVideoStepIndexes.has(item.stepIndex)
        && !currentPendingSteps.has(item.stepIndex))

      if (importableItems.length === 0) {
        setValidationError("Aucune image extraite n'est importable : les etapes correspondantes ont deja un asset ou une video.")
        setActiveTab("images")
        return
      }

      setPendingImages((current) => [
        ...current,
        ...importableItems.map((item, index) => ({
          id: `${item.id}-${index}`,
          sourceFile: item.file,
          previewUrl: URL.createObjectURL(item.file),
          stepIndex: item.stepIndex,
        })),
      ])

      const skippedCount = extracted.items.length - importableItems.length
      setStatusMessage(
        skippedCount > 0
          ? `${importableItems.length} image${importableItems.length > 1 ? "s" : ""} extraite${importableItems.length > 1 ? "s" : ""}, ${skippedCount} ignoree${skippedCount > 1 ? "s" : ""} car deja associee${skippedCount > 1 ? "s" : ""} ou hors plage.`
          : `${importableItems.length} image${importableItems.length > 1 ? "s" : ""} extraite${importableItems.length > 1 ? "s" : ""} depuis la source.`,
      )
      setActiveTab("images")
    } catch (extractError) {
      setValidationError(
        extractError instanceof Error ? extractError.message : "Impossible d'extraire les images de la source.",
      )
      setActiveTab("images")
    } finally {
      setExtractingImages(false)
    }
  }, [occupiedExistingImageStepIndexes, occupiedVideoStepIndexes, pendingAssignedStepIndexes, recipe.orgURL, stepOptions.length])

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={cn(
          "max-h-[calc(100vh-2rem)] w-[calc(100vw-2rem)] max-w-5xl overflow-y-auto sm:w-full",
          !canCloseDialog && "[&>button:last-child]:hidden",
          blockedDismissFeedback && "animate-[dialog-shake-x_0.42s_ease-in-out] ring-2 ring-amber-300",
        )}
        onInteractOutside={(event) => {
          const target = event.target as HTMLElement | null
          if (
            target?.closest?.('[data-radix-popper-content-wrapper]')
            || target?.closest?.('[role="listbox"]')
            || savingJson
          ) {
            event.preventDefault()
            return
          }

          if (!canCloseDialog) {
            event.preventDefault()
            triggerBlockedDismissFeedback()
            return
          }

          if (!editedManifest || !jsonFileName || hasStoredJsonAsset) return

          event.preventDefault()
          void validateAndPersistJson().then((saved) => {
            if (saved) {
              handleOpenChange(false)
            }
          })
        }}
        onEscapeKeyDown={(event) => {
          if (!canCloseDialog) {
            event.preventDefault()
            triggerBlockedDismissFeedback()
            return
          }

          if (!editedManifest || !jsonFileName || hasStoredJsonAsset) return

          event.preventDefault()
          void validateAndPersistJson().then((saved) => {
            if (saved) {
              handleOpenChange(false)
            }
          })
        }}
      >
        <DialogHeader>
          <DialogTitle>Assets</DialogTitle>
          <DialogDescription>
            Gere les images d'etapes et, quand la source est compatible, la video chapitree depuis une seule popup.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="inline-flex w-full rounded-[var(--radius-xl)] border border-border/60 bg-secondary/20 p-1">
            <button
              type="button"
              onClick={() => setActiveTab("images")}
              className={cn(
                "flex-1 rounded-[calc(var(--radius-xl)-4px)] px-4 py-2 text-sm font-medium transition-colors",
                activeTab === "images"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Images
            </button>

            {hasVideoTab && (
              <button
                type="button"
                onClick={() => setActiveTab("video")}
                className={cn(
                  "flex-1 rounded-[calc(var(--radius-xl)-4px)] px-4 py-2 text-sm font-medium transition-colors",
                  activeTab === "video"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                Video
              </button>
            )}
          </div>

          {statusMessage && !error && !previewError && !validationError && (
            <div className="rounded-[var(--radius-xl)] border border-emerald-500/20 bg-emerald-500/8 p-3 text-sm text-emerald-700 dark:text-emerald-300">
              {statusMessage}
            </div>
          )}

          {infoMessage && !previewError && !error && activeTab === "video" && (
            <div className="rounded-[var(--radius-xl)] border border-border/60 bg-secondary/20 p-3 text-sm text-muted-foreground">
              {infoMessage}
            </div>
          )}

          {(error || validationError || previewError) && (
            <div className="rounded-[var(--radius-xl)] border border-destructive/20 bg-destructive/8 p-3 text-sm text-destructive">
              {validationError ?? previewError ?? error}
            </div>
          )}

          {activeTab === "images" && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-3">
                <label className="inline-flex cursor-pointer items-center">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(event) => {
                      handlePendingFilesAdded(event.target.files)
                      event.currentTarget.value = ""
                    }}
                  />
                  <span className="inline-flex items-center gap-2 rounded-[var(--radius-lg)] bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90">
                    <ImagePlus className="h-4 w-4" />
                    Ajouter des images
                  </span>
                </label>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void handleExtractSourceImages()}
                  disabled={extractingImages || !recipe.orgURL?.trim()}
                  className="gap-2"
                >
                  {extractingImages ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Extraction...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Extraire les images de la source
                    </>
                  )}
                </Button>

                {loading && (
                  <span className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Chargement des assets...
                  </span>
                )}
              </div>

              <div className="rounded-[var(--radius-xl)] border border-border/60 bg-secondary/20 p-3 text-sm text-muted-foreground">
                <div className="flex flex-wrap items-center gap-2">
                  <span>Les assets existants sont supprimables uniquement dans Mealie, pas ici.</span>
                  <span className="text-xs">
                    {canCloseDialog ? "Tu peux fermer la popup normalement." : "Utilise `Annuler` pour fermer cette popup."}
                  </span>
                  {mealieRecipeUrl && (
                    <a
                      href={mealieRecipeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-medium text-foreground underline-offset-2 hover:underline"
                    >
                      Ouvrir la recette
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              </div>

              <section className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-bold">Images deja presentes</h3>
                  <span className="text-xs font-medium text-muted-foreground">
                    {existingImageAssets.length} image{existingImageAssets.length > 1 ? "s" : ""}
                  </span>
                </div>

                {existingImageAssets.length === 0 ? (
                  <div className="rounded-[var(--radius-xl)] border border-dashed border-border/60 p-4 text-sm text-muted-foreground">
                    Aucune image d'etape enregistree pour le moment.
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {existingImageAssets.map(({ asset, stepIndex }) => {
                      const fileName = asset.fileName ?? asset.name
                      const assetUrl = asset.fileName ? getRecipeAssetMediaUrl(recipe.id, asset.fileName) : null

                      return (
                        <article key={fileName} className="overflow-hidden rounded-[var(--radius-xl)] border border-border/50 bg-card">
                          {assetUrl && (
                            <img
                              src={assetUrl}
                              alt={fileName}
                              className="aspect-video w-full bg-muted/20 object-cover"
                            />
                          )}

                          <div className="space-y-2 p-3">
                            <p className="truncate text-sm font-medium text-foreground">{fileName}</p>
                            <p className="text-xs text-muted-foreground">
                              {stepIndex == null ? "Non liee a une etape detectee" : buildStepOptionLabel(stepIndex)}
                            </p>
                            {assetUrl && (
                              <a
                                href={assetUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs font-medium text-foreground underline-offset-2 hover:underline"
                              >
                                Voir l'image
                                <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                            )}
                          </div>
                        </article>
                      )
                    })}
                  </div>
                )}
              </section>

              <section className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-bold">Images a envoyer</h3>
                  <span className="text-xs font-medium text-muted-foreground">
                    {pendingImages.length} image{pendingImages.length > 1 ? "s" : ""}
                  </span>
                </div>

                {pendingImages.length === 0 ? (
                  <div className="rounded-[var(--radius-xl)] border border-dashed border-border/60 p-4 text-sm text-muted-foreground">
                    Ajoute une ou plusieurs images puis associe-les a une etape.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingImages.map((item) => (
                      <div key={item.id} className="grid gap-3 rounded-[var(--radius-xl)] border border-border/50 bg-card p-3 md:grid-cols-[180px_minmax(0,1fr)_auto] md:items-center">
                        <img
                          src={item.previewUrl}
                          alt={item.sourceFile.name}
                          className="aspect-video w-full rounded-[var(--radius-lg)] bg-muted/20 object-cover"
                        />

                        <div className="space-y-2">
                          <p className="truncate text-sm font-medium text-foreground">{item.sourceFile.name}</p>
                          <select
                            value={item.stepIndex == null ? "__none__" : String(item.stepIndex)}
                            onChange={(event) => handlePendingStepChange(item.id, event.target.value)}
                            className="h-10 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm outline-none transition-colors focus-visible:ring-1 focus-visible:ring-ring"
                            aria-label={`Associer ${item.sourceFile.name} a une etape`}
                          >
                            <option value="__none__">Choisir une etape</option>
                            {stepOptions
                              .filter((option) => {
                                if (option.value === item.stepIndex) return true
                                if (occupiedExistingImageStepIndexes.has(option.value)) return false
                                if (occupiedVideoStepIndexes.has(option.value)) return false
                                if (pendingAssignedStepIndexes(item.id).has(option.value)) return false
                                return true
                              })
                              .map((option) => (
                                <option key={option.id} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                          </select>
                        </div>

                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => handleRemovePendingImage(item.id)}
                        >
                          Retirer
                        </Button>
                      </div>
                    ))}

                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        onClick={() => void handleUploadPendingImages()}
                        disabled={uploading}
                        className="gap-2"
                      >
                        {uploading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Envoi...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4" />
                            Envoyer les images
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </section>
            </div>
          )}

          {activeTab === "video" && hasVideoTab && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-3">
                {!hasImportedVideoAsset && (
                  <Button
                    type="button"
                    onClick={() => void handleImport()}
                    disabled={!isJowSource || importing || uploading}
                    className="gap-2"
                  >
                    {importing || uploading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Import video en cours...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        Importer la video
                      </>
                    )}
                  </Button>
                )}

                {statusMessage && !error && !previewError && !validationError && (
                  <span className="text-sm text-muted-foreground">
                    Les etapes deja reservees par une image ne sont pas proposees ici.
                  </span>
                )}
              </div>

              {activeManifest && previewVideoUrl ? (
                <div className="grid gap-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,1fr)]">
                  <div className="space-y-4 rounded-[var(--radius-xl)] border border-border/50 p-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Film className="h-4 w-4 text-muted-foreground" />
                        <h3 className="text-sm font-bold">Previsualisation Mealie</h3>
                      </div>

                      <video
                        ref={videoRef}
                        src={previewVideoUrl}
                        controls
                        playsInline
                        preload="metadata"
                        className="aspect-video w-full rounded-xl bg-black"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setActiveChapterIndex((current) => Math.max(0, current - 1))}
                        disabled={activeChapterIndex <= 0}
                        className="gap-1.5"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Precedent
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setActiveChapterIndex((current) =>
                            Math.min(activeManifest.chapters.length - 1, current + 1),
                          )
                        }
                        disabled={activeChapterIndex >= activeManifest.chapters.length - 1}
                        className="gap-1.5"
                      >
                        Suivant
                        <ChevronRight className="h-4 w-4" />
                      </Button>

                      {activeChapter && (
                        <span className="text-sm text-muted-foreground">
                          {getChapterLabel(activeChapter.stepIndex, videoStepOptions, activeChapterIndex - 1)} · {formatChapterTime(activeChapter.start)}
                          {activeChapter.end != null ? ` -> ${formatChapterTime(activeChapter.end)}` : ""}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3 rounded-[var(--radius-xl)] border border-border/50 p-4">
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold">Liaison chapitres / etapes</h3>
                      <p className="text-xs text-muted-foreground">
                        Le selecteur masque les etapes deja utilisees par une autre image ou un autre chapitre.
                      </p>
                    </div>

                    <div className="overflow-x-auto rounded-[var(--radius-xl)] border border-border/50">
                      <table className="min-w-full text-sm">
                        <thead className="bg-secondary/30 text-left text-xs uppercase tracking-[0.08em] text-muted-foreground">
                          <tr>
                            <th className="px-3 py-2 font-semibold">Etape liee</th>
                            <th className="px-3 py-2 font-semibold">Debut</th>
                            <th className="px-3 py-2 font-semibold">Fin</th>
                          </tr>
                        </thead>
                        <tbody>
                          {activeManifest.chapters.map((chapter, index) => {
                            const chapterAssetStepIndex = toAssetStepIndex(chapter.stepIndex)
                            const occupiedByOtherChapters = new Set(
                              activeManifest.chapters
                                .filter((_, chapterIndex) => chapterIndex !== index)
                                .map((otherChapter) => toAssetStepIndex(otherChapter.stepIndex))
                                .filter((stepIndex): stepIndex is number => stepIndex != null),
                            )

                            return (
                              <tr
                                key={chapter.key}
                                className={index === activeChapterIndex ? "border-t border-border/50 bg-primary/5" : "border-t border-border/50"}
                                onClick={() => setActiveChapterIndex(index)}
                              >
                                <td className="px-3 py-2 font-medium text-foreground">
                                  <select
                                    value={chapterAssetStepIndex == null ? "__none__" : String(chapterAssetStepIndex)}
                                    onChange={(event) => updateChapterStep(index, event.target.value)}
                                    disabled={hasStoredJsonAsset}
                                    className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm outline-none transition-colors focus-visible:ring-1 focus-visible:ring-ring"
                                    aria-label={`Etape liee au chapitre ${index + 1}`}
                                  >
                                    <option value="__none__">Non liee</option>
                                    {stepOptions
                                      .filter((option) => {
                                        if (option.value === chapterAssetStepIndex) return true
                                        if (occupiedExistingImageStepIndexes.has(option.value)) return false
                                        if (pendingAssignedStepIndexes().has(option.value)) return false
                                        if (occupiedByOtherChapters.has(option.value)) return false
                                        return true
                                      })
                                      .map((option) => (
                                        <option key={option.id} value={option.value}>
                                          {option.label}
                                        </option>
                                      ))}
                                  </select>
                                </td>
                                <td className="px-3 py-2">
                                  <Input
                                    type="number"
                                    step="0.1"
                                    value={String(chapter.start)}
                                    onChange={(event) => updateChapterValue(index, "start", event.target.value)}
                                    disabled={hasStoredJsonAsset}
                                    className="h-8"
                                    aria-label={`Debut ${getChapterLabel(chapter.stepIndex, videoStepOptions, index - 1)}`}
                                  />
                                </td>
                                <td className="px-3 py-2">
                                  <Input
                                    type="number"
                                    step="0.1"
                                    value={chapter.end == null ? "" : String(chapter.end)}
                                    onChange={(event) => updateChapterValue(index, "end", event.target.value)}
                                    disabled={hasStoredJsonAsset}
                                    className="h-8"
                                    placeholder="fin video"
                                    aria-label={`Fin ${getChapterLabel(chapter.stepIndex, videoStepOptions, index - 1)}`}
                                  />
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>

                    {jsonFileName && (
                      <div className="space-y-3">
                        {hasStoredJsonAsset && (
                          <div className="rounded-[var(--radius-xl)] border border-border/60 bg-secondary/20 p-3 text-sm text-muted-foreground">
                            <div className="flex flex-wrap items-center gap-2">
                              <span>
                                Pour modifier les etapes et les timecodes, supprime d'abord le fichier `chapters.json` dans Mealie.
                              </span>
                              {mealieRecipeUrl && (
                                <a
                                  href={mealieRecipeUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 font-medium text-foreground underline-offset-2 hover:underline"
                                >
                                  Ouvrir la recette
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </a>
                              )}
                              <TooltipProvider delayDuration={200}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      type="button"
                                      className="inline-flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                                      aria-label="Instructions Mealie"
                                    >
                                      <CircleHelp className="h-4 w-4" />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-xs text-left leading-relaxed">
                                    Dans Mealie : modifier -&gt; parametres -&gt; afficher les resources -&gt; supprimer le chapters.json.
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </div>
                        )}

                        <div className="flex justify-end">
                          <Button
                            type="button"
                            onClick={() => void handleSaveJson()}
                            disabled={savingJson || hasStoredJsonAsset}
                            className="gap-2"
                          >
                            {savingJson ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Sauvegarde...
                              </>
                            ) : (
                              <>
                                <Save className="h-4 w-4" />
                                Valider les modifications
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="rounded-[var(--radius-xl)] border border-dashed border-border/60 p-4 text-sm text-muted-foreground">
                  {hasImportedVideoAsset
                    ? "La video est presente, mais aucun manifeste de chapitres exploitable n'a encore ete charge."
                    : "Importe d'abord la video depuis Jow pour gerer les chapitres ici."}
                </div>
              )}
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-bold">Assets actuellement enregistres</h3>
              <span className="text-xs font-medium text-muted-foreground">
                {assetRows.length} asset{assetRows.length > 1 ? "s" : ""}
              </span>
            </div>

            {assetRows.length === 0 ? (
              <div className="rounded-[var(--radius-xl)] border border-dashed border-border/60 p-4 text-sm text-muted-foreground">
                Aucun asset enregistre sur cette recette pour le moment.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-[var(--radius-xl)] border border-border/50">
                <table className="min-w-full text-sm">
                  <thead className="bg-secondary/30 text-left text-xs uppercase tracking-[0.08em] text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 font-semibold">Nom</th>
                      <th className="px-3 py-2 font-semibold">Fichier</th>
                      <th className="px-3 py-2 font-semibold">Extension</th>
                      <th className="px-3 py-2 font-semibold">Icone</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assetRows.map((asset) => {
                      const assetUrl = asset.fileName ? getRecipeAssetMediaUrl(recipe.id, asset.fileName) : null

                      return (
                        <tr key={`${asset.name}-${asset.fileName ?? "no-file"}`} className="border-t border-border/50">
                          <td className="px-3 py-2 font-medium text-foreground">{asset.name}</td>
                          <td className="px-3 py-2 text-muted-foreground">
                            {assetUrl ? (
                              <a
                                href={assetUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline-offset-2 hover:underline"
                              >
                                {asset.fileName ?? "-"}
                              </a>
                            ) : (
                              asset.fileName ?? "-"
                            )}
                          </td>
                          <td className="px-3 py-2 text-muted-foreground">{getAssetExtension(asset)}</td>
                          <td className="px-3 py-2 text-muted-foreground">{asset.icon || "-"}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="flex justify-end border-t border-border/50 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (pendingImages.length > 0) {
                  handleOpenChange(false)
                  return
                }

                if (!editedManifest || !jsonFileName || hasStoredJsonAsset) {
                  handleOpenChange(false)
                  return
                }

                void validateAndPersistJson().then((saved) => {
                  if (saved) {
                    handleOpenChange(false)
                  }
                })
              }}
              disabled={uploading || extractingImages || savingJson}
            >
              {pendingImages.length > 0 ? "Annuler" : "Fermer"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
