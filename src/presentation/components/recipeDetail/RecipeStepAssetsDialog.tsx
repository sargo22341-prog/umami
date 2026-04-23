import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { ExternalLink, ImagePlus, Loader2, Sparkles, Upload } from "lucide-react"

import { Button, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "components/ui"
import { useRecipeAssets } from "hooks/recipes"
import type { MealieRecipeOutput } from "@/shared/types/mealie/Recipes.ts"
import { exportImageStep } from "@/infrastructure/recipeSources/exportImageStep.ts"
import {
  getRecipeAssetMediaUrl,
  getRecipeStepImageAssets,
  isImageRecipeAsset,
} from "@/shared/utils"
import { cn } from "@/lib/utils.ts"

interface RecipeStepAssetsDialogProps {
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

function buildStepOptionLabel(stepIndex: number) {
  return stepIndex === 0 ? "Ingredients (step-0)" : `Etape ${stepIndex} (step-${stepIndex})`
}

function buildStepImageFileName(stepIndex: number) {
  return `step-${stepIndex}.jpg`
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

export function RecipeStepAssetsDialog({
  open,
  onOpenChange,
  recipe,
  onRecipeUpdated,
  mealieRecipeUrl = null,
}: RecipeStepAssetsDialogProps) {
  const {
    assets,
    loading,
    uploading,
    error,
    loadAssets,
    uploadAssets,
  } = useRecipeAssets(recipe.slug, recipe.assets ?? [])
  const [pendingImages, setPendingImages] = useState<PendingStepImage[]>([])
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [extractingImages, setExtractingImages] = useState(false)
  const [blockedDismissFeedback, setBlockedDismissFeedback] = useState(false)
  const blockedDismissTimeoutRef = useRef<number | null>(null)

  useEffect(() => {
    if (!open) return

    void loadAssets().then((nextRecipe) => {
      if (nextRecipe) onRecipeUpdated(nextRecipe)
    })
  }, [loadAssets, onRecipeUpdated, open])

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

  const occupiedExistingStepIndexes = useMemo(
    () => new Set(
      existingImageAssets
        .map(({ stepIndex }) => stepIndex)
        .filter((stepIndex): stepIndex is number => stepIndex != null),
    ),
    [existingImageAssets],
  )

  const stepOptions = useMemo(
    () => Array.from({ length: (recipe.recipeInstructions?.length ?? 0) + 1 }).map((_, index) => ({
      value: index,
      label: buildStepOptionLabel(index),
    })),
    [recipe.recipeInstructions],
  )

  const pendingAssignedStepIndexes = useCallback((currentImageId?: string) => new Set(
    pendingImages
      .filter((item) => item.id !== currentImageId)
      .map((item) => item.stepIndex)
      .filter((stepIndex): stepIndex is number => stepIndex != null),
  ), [pendingImages])
  const canCloseDialog = pendingImages.length === 0 && !uploading && !extractingImages

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
      return
    }

    setPendingImages((current) => [...current, ...nextImages])
    setStatusMessage(null)
    setValidationError(null)
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
      return
    }

    const unassignedImage = pendingImages.find((item) => item.stepIndex == null)
    if (unassignedImage) {
      setValidationError("Associe chaque image a une etape avant l'envoi.")
      return
    }

    const assignedStepIndexes = pendingImages
      .map((item) => item.stepIndex)
      .filter((stepIndex): stepIndex is number => stepIndex != null)
    const assignedStepSet = new Set<number>()
    for (const stepIndex of assignedStepIndexes) {
      if (assignedStepSet.has(stepIndex)) {
        setValidationError(`Une seule image est autorisee pour ${buildStepOptionLabel(stepIndex)}.`)
        return
      }
      assignedStepSet.add(stepIndex)
    }

    const conflictingExistingStep = assignedStepIndexes.find((stepIndex) => occupiedExistingStepIndexes.has(stepIndex))
    if (conflictingExistingStep != null) {
      setValidationError(
        `${buildStepOptionLabel(conflictingExistingStep)} a deja une image dans Mealie. Supprime-la d'abord dans Mealie avant d'en envoyer une nouvelle.`,
      )
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
    }
  }, [occupiedExistingStepIndexes, onRecipeUpdated, pendingImages, uploadAssets])

  const handleExtractSourceImages = useCallback(async () => {
    const sourceUrl = recipe.orgURL?.trim() ?? ""
    if (!sourceUrl) {
      setValidationError("Aucune URL source n'est renseignee sur cette recette.")
      return
    }

    setExtractingImages(true)
    setValidationError(null)
    setStatusMessage(null)

    try {
      const extracted = await exportImageStep(sourceUrl)
      if (extracted.items.length === 0) {
        setStatusMessage("Aucune image d'etape exploitable n'a ete trouvee dans le schema source.")
        return
      }

      const maxStepIndex = stepOptions.length - 1
      const currentPendingSteps = pendingAssignedStepIndexes()
      const importableItems = extracted.items.filter((item) =>
        item.stepIndex >= 0
        && item.stepIndex <= maxStepIndex
        && !occupiedExistingStepIndexes.has(item.stepIndex)
        && !currentPendingSteps.has(item.stepIndex))

      if (importableItems.length === 0) {
        setValidationError("Aucune image extraite n'est importable : les etapes correspondantes ont deja un asset ou sont deja remplies.")
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
    } catch (extractError) {
      setValidationError(
        extractError instanceof Error ? extractError.message : "Impossible d'extraire les images de la source.",
      )
    } finally {
      setExtractingImages(false)
    }
  }, [occupiedExistingStepIndexes, pendingAssignedStepIndexes, recipe.orgURL, stepOptions.length])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "max-h-[calc(100vh-2rem)] w-[calc(100vw-2rem)] max-w-5xl overflow-y-auto sm:w-full",
          !canCloseDialog && "[&>button:last-child]:hidden",
          blockedDismissFeedback && "animate-[dialog-shake-x_0.42s_ease-in-out] ring-2 ring-amber-300",
        )}
        onInteractOutside={(event) => {
          if (canCloseDialog) return
          event.preventDefault()
          triggerBlockedDismissFeedback()
        }}
        onEscapeKeyDown={(event) => {
          if (canCloseDialog) return
          event.preventDefault()
          triggerBlockedDismissFeedback()
        }}
      >
        <DialogHeader>
          <DialogTitle>Assets images</DialogTitle>
          <DialogDescription>
            Associe une image aux ingredients (`step-0`) ou a une etape (`step-1`, `step-2`, ...). Les fichiers sont envoyes dans Mealie au format `step-X.jpg`.
          </DialogDescription>
        </DialogHeader>

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

            {statusMessage && !error && !validationError && (
              <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                {statusMessage}
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

          {(error || validationError) && (
            <div className="rounded-[var(--radius-xl)] border border-destructive/20 bg-destructive/8 p-3 text-sm text-destructive">
              {validationError ?? error}
            </div>
          )}

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
                            if (occupiedExistingStepIndexes.has(option.value)) return false
                            if (pendingAssignedStepIndexes(item.id).has(option.value)) return false
                            return true
                          })
                          .map((option) => (
                          <option key={option.value} value={option.value}>
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

          <div className="flex justify-end border-t border-border/50 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={uploading || extractingImages}
            >
              {pendingImages.length > 0 ? "Annuler" : "Fermer"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
