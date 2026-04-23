// React
import {
  useState, useRef, useCallback,
  type Dispatch, type SetStateAction,
} from "react"

// Router
import { Link, useNavigate, useParams } from "react-router-dom"

// Icons (lucide)
import {
  Loader2, ImagePlus, Check, UtensilsCrossed, Star, Heart, ShoppingCart, CookingPot, PenLine,
  FolderOpen, Leaf, Clock3, FileText, Type, Tag, RefreshCw, Trash2, ExternalLink, Utensils,
} from "lucide-react"

// Infrastructure
import { deleteRecipeUseCase } from "@/infrastructure/container.ts"
import { isJowRecipeUrl } from "@/infrastructure/recipeSources/providers/jow/jow.videoImport.ts"

// Types
import type { MealieRecipeOutput, RecipeFormData } from "@/shared/types/mealie/Recipes.ts"

// Season
import { SEASONS, SEASON_LABELS, type Season } from "@/shared/types/Season.ts"

// Shared utils
import { isSeasonTag, isCalorieTag, getStoredMealieUrl } from "@/shared/utils"

// App utils
import { cn } from "@/lib/utils.ts"

// Hooks - Recipes
import { useRecipe, useRecipeForm } from "hooks/recipes"

// Hooks - Organizer
import { useCategories, useTags, useTools, useFoods, useUnits } from "hooks/organizer"

// Hooks - Shopping
import { useAddRecipesToCart } from "hooks/shopping/useAddRecipesToCart.ts"

// Hooks - Recipe Detail
import {
  useRecipeRatingsAndFavorite, useRecipeDetailEditing, useRecipeDetailSync,
  useRecipeIngredientAnalysis, useRecipeInstructionLinks
} from "hooks/recipeDetail"

// Hooks - Comments
import { useRecipeComments } from "hooks/comments/useRecipeComments.ts"

// UI Components
import { Button, Badge, Input, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "components/ui"

// Components - Common
import { InlineEditText, InlineEditDuration } from "components/common/RecipeEditorShared.tsx"
import { CookingMode } from "components/common/CookingMode.tsx"
import { InlineEditCompactNumber } from "components/common/InlineEditCompactNumber.tsx"
import { MarkdownContent } from "components/common/MarkdownContent.tsx"
import { PlanningAddToCartDialog } from "components/common/PlanningAddToCartDialog.tsx"
import { UrlImportIngredientReviewDialog } from "components/common/urlImportIngredientReviewDialog/UrlImportIngredientReviewDialog.tsx"

// Components - Recipe Detail
import {
  RecipeCommentsSection, autoResizeTextarea, formatRecipeIngredientLine, NUTRITION_LAYOUT,
  RecipeIngredientsSection, RecipeInstructionsSection, RecipeDetailSectionHeader,
  RecipeDetailSkeleton, RecipeSyncDialog, RecipeAssetsDialog
} from "components/recipeDetail"


interface RecipeDetailContentProps {
  recipe: MealieRecipeOutput
  setRecipe: Dispatch<SetStateAction<MealieRecipeOutput | null>>
  onRecipeDeleted: () => void
}

function RecipeDetailContent({ recipe, setRecipe, onRecipeDeleted }: RecipeDetailContentProps) {
  const { categories: allCategories } = useCategories()
  const { tags: allTags } = useTags()
  const { tools: allTools } = useTools()
  const { foods } = useFoods()
  const { units } = useUnits()
  const { updateRecipe, loading: saving, error: saveError } = useRecipeForm()

  // ─── Local editable state (initialized from recipe) ───

  const [cookingMode, setCookingMode] = useState(false)
  const [cartDialogOpen, setCartDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingRecipe, setDeletingRecipe] = useState(false)
  const [deleteRecipeError, setDeleteRecipeError] = useState<string | null>(null)
  const [assetsDialogOpen, setAssetsDialogOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { addRecipes, loading: addingToCart } = useAddRecipesToCart()

  const baseurl = getStoredMealieUrl();
  const canImportSourceVideo = isJowRecipeUrl(recipe.orgURL?.trim() ?? "")
  const mealieRecipeUrl = baseurl && recipe.slug ? `${baseurl}/g/home/r/${recipe.slug}` : null

  const persistRecipeForm = useCallback(async (nextFormData: RecipeFormData) => {
    if (!nextFormData.name.trim()) return null
    return updateRecipe(recipe.slug, nextFormData)
  }, [recipe.slug, updateRecipe])

  const editing = useRecipeDetailEditing({
    recipe,
    persistRecipeForm,
    setRecipe,
  })

  const { formData, imagePreview, isDirty, isEditMode, isEditingTags, tagSearch, setTagSearch, patch,
    resetFormFromRecipe, handleImageChange, handleToggleCategory, handleToggleTool, handleToggleSeason,
    addIngredient, removeIngredient, updateIngredientField, handleRemoveTag, handleAddTag, moveInstruction,
    handleToggleTagEditing, handleCancelEditing, handleSave, handleToggleEditMode,
    visibleNutritionEntries, visibleIngredients, analyzableIngredientIndexes, visibleInstructions,
  } = editing

  const { instructionIngredientInputs, setInstructionIngredientInputs, addInstruction, removeInstruction,
    updateInstruction, updateInstructionReferences, handleAutoLinkIngredients, resetInstructionLinkInputs,
  } = useRecipeInstructionLinks({ formData, foods, patch, })

  const { analyzingIngredientIndexes, ingredientReviewDraft, ingredientReviewOpen, ingredientReviewError,
    handleAnalyzeIngredients, handleIngredientReviewOpenChange, handleIngredientReviewConfirm,
  } = useRecipeIngredientAnalysis({ formData, recipe, patch, })

  const {
    comments, loading: commentsLoading, creating: creatingComment,
    deletingId: deletingCommentId, error: commentsError, createComment, deleteComment,
  } = useRecipeComments(recipe.slug, recipe.id)

  const { syncDialogOpen, syncFields, syncSelection, syncLoading, syncApplying, syncError,
    setSyncDialogOpen, loadScrapedPreview, toggleSyncField, handleApplySync,
  } = useRecipeDetailSync({
    recipe, formData, allTags, allCategories, saveError, persistRecipeForm, resetFormFromRecipe
  })

  const handleAssetsRecipeUpdated = useCallback((nextRecipe: MealieRecipeOutput) => {
    setRecipe(nextRecipe)
  }, [setRecipe])

  const { isFavorite, handleRate, handleToggleFavorite } = useRecipeRatingsAndFavorite({
    recipe,
    setRecipe,
  })

  const foodOptions = foods.map((food) => ({ id: food.id, label: food.name }))
  const unitOptions = units.map((unit) => ({
    id: unit.id,
    label: unit.useAbbreviation && unit.abbreviation ? unit.abbreviation : unit.name,
  }))
  const availableTags = allTags
    .filter((tag) => !isSeasonTag(tag) && !isCalorieTag(tag))
    .filter((tag) => !formData.tags.some((current) => current.id === tag.id))
    .filter((tag) => tag.name.toLowerCase().includes(tagSearch.toLowerCase().trim()))

  const visibleTools = isEditMode
    ? allTools
    : formData.tools

  const visibleCategories = isEditMode
    ? allCategories
    : formData.categories

  const visibleSeasons = isEditMode
    ? SEASONS.filter((season) => season !== 'sans')
    : formData.seasons

  const visibleTimeEntries = [
    {
      key: 'prepTime',
      label: 'Préparation',
      value: formData.prepTime,
      displayRaw: recipe.prepTime,
    },
    {
      key: 'performTime',
      label: 'Cuisson',
      value: formData.performTime,
      displayRaw: recipe.performTime,
    },
    {
      key: 'totalTime',
      label: 'Total',
      value: formData.totalTime,
      displayRaw: recipe.totalTime,
    },
  ].filter((entry) => isEditMode || Boolean((entry.value || entry.displayRaw || '').toString().trim()))

  const instructionIngredientOptions = formData.recipeIngredient
    .filter((ingredient) => Boolean(ingredient.referenceId) && Boolean(ingredient.food.trim() || ingredient.note.trim()))
    .map((ingredient, index) => ({
      id: ingredient.referenceId ?? `ingredient-option-${index}`,
      label: formatRecipeIngredientLine(ingredient) || ingredient.food || ingredient.note || `Ingredient ${index + 1}`,
    }))

  const handleCancelEditingAndLinks = useCallback(() => {
    handleCancelEditing()
    resetInstructionLinkInputs()
  }, [handleCancelEditing, resetInstructionLinkInputs])

  const handleSaveAndResetLinks = useCallback(async () => {
    const updated = await handleSave()
    if (updated) {
      resetInstructionLinkInputs()
    }
    return updated
  }, [handleSave, resetInstructionLinkInputs])

  const handleEditButtonClick = useCallback(async () => {
    if (!isEditMode) {
      await handleToggleEditMode()
      return
    }

    if (isDirty) {
      await handleSaveAndResetLinks()
      return
    }

    handleCancelEditingAndLinks()
  }, [handleCancelEditingAndLinks, handleSaveAndResetLinks, handleToggleEditMode, isDirty, isEditMode])
  const handleDeleteRecipe = async () => {
    setDeletingRecipe(true)
    setDeleteRecipeError(null)
    try {
      await deleteRecipeUseCase.execute(recipe.slug)
      setDeleteDialogOpen(false)
      onRecipeDeleted()
    } catch (error) {
      setDeleteRecipeError(
        error instanceof Error ? error.message : "Impossible de supprimer la recette.",
      )
    } finally {
      setDeletingRecipe(false)
    }
  }

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {cookingMode && (
        <CookingMode
          recipeId={recipe.id}
          recipeName={recipe.name}
          ingredients={recipe.recipeIngredient ?? []}
          instructions={recipe.recipeInstructions ?? []}
          assets={recipe.assets}
          onClose={() => setCookingMode(false)}
        />
      )}
      <PlanningAddToCartDialog
        open={cartDialogOpen}
        onOpenChange={setCartDialogOpen}
        recipes={[{ recipe, occurrences: 1 }]}
        loadingRecipes={false}
        submitting={addingToCart}
        onSubmit={addRecipes}
      />
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Supprimer cette recette ?</DialogTitle>
            <DialogDescription>
              Cette action est definitive. La recette sera supprimee dans Mealie.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-[var(--radius-lg)] bg-muted/40 p-3 text-sm font-medium text-foreground">
            {recipe.name}
          </div>
          {deleteRecipeError && (
            <div className="rounded-[var(--radius-lg)] border border-destructive/20 bg-destructive/8 p-3 text-sm text-destructive">
              {deleteRecipeError}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deletingRecipe}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={() => void handleDeleteRecipe()}
              disabled={deletingRecipe}
              className="gap-1.5"
            >
              {deletingRecipe ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Suppression...
                </>
              ) : (
                "Supprimer la recette"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <RecipeSyncDialog
        open={syncDialogOpen}
        onOpenChange={setSyncDialogOpen}
        recipeName={recipe.name}
        sourceUrl={recipe.orgURL ?? ""}
        loading={syncLoading}
        applying={syncApplying}
        error={syncError}
        fields={syncFields}
        selectedFieldIds={syncSelection}
        onToggleField={toggleSyncField}
        onRefresh={() => void loadScrapedPreview()}
        onConfirm={() => void handleApplySync()}
      />
      <RecipeAssetsDialog
        open={assetsDialogOpen}
        onOpenChange={setAssetsDialogOpen}
        recipe={recipe}
        onRecipeUpdated={handleAssetsRecipeUpdated}
        mealieRecipeUrl={mealieRecipeUrl}
      />
      <UrlImportIngredientReviewDialog
        open={ingredientReviewOpen}
        draft={ingredientReviewDraft}
        loading={false}
        error={ingredientReviewError}
        onOpenChange={handleIngredientReviewOpenChange}
        onConfirm={handleIngredientReviewConfirm}
      />
      <Button variant="ghost" size="sm" asChild>
        <Link to="/recipes">&larr; Recettes</Link>
      </Button>

      <div className="mx-auto max-w-2xl space-y-4 px-4 py-6">
        <div className="flex flex-col gap-3">

          {/* 🔹 Ligne 1 */}
          <div className="flex items-center justify-between gap-2">

            {/* Gauche : actions principales */}
            <div className="flex items-center gap-2">
              {recipe && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCartDialogOpen(true)}
                    className="gap-1.5 px-2.5 sm:px-3"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    <span className="hidden sm:inline">Ajouter au panier</span>
                  </Button>
                </>
              )}
            </div>

            {/* Droite : liens */}
            <div className="flex items-center gap-2">
              {recipe?.orgURL && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => recipe.orgURL && window.open(recipe.orgURL, "_blank")}
                  className="gap-1.5 px-2.5 sm:px-3"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span className="hidden sm:inline">Source</span>
                </Button>
              )}

              {recipe?.slug && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`${baseurl}/g/home/r/${recipe.slug}`, "_blank")}
                  className="gap-1.5 px-2.5 sm:px-3"
                >
                  <Utensils className="h-4 w-4" />
                  <span className="hidden sm:inline">Mealie</span>
                </Button>
              )}
            </div>

          </div>

          {/* 🔸 Ligne 2 */}
          <div className="flex items-center justify-between border-t pt-3">

            {/* Gauche (optionnel : Sync) */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAssetsDialogOpen(true)}
                className="gap-1.5 px-2.5 sm:px-3"
              >
                {canImportSourceVideo ? <FolderOpen className="h-4 w-4" /> : <ImagePlus className="h-4 w-4" />}
                <span className="hidden sm:inline">Assets</span>
              </Button>

              {recipe?.orgURL && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSyncDialogOpen(true)}
                  className="gap-1.5 px-2.5 sm:px-3"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span className="hidden sm:inline">Sync</span>
                </Button>
              )}
            </div>

            {/* Droite : édition + suppression */}
            <div className="flex items-center gap-2">
              {recipe && (
                <>
                  <Button
                    variant={isEditMode ? "default" : "outline"}
                    size="sm"
                    onClick={() => void handleEditButtonClick()}
                    className="gap-1.5 px-2.5 sm:px-3"
                    disabled={saving}
                  >
                    <PenLine className="h-4 w-4" />
                    <span className="hidden sm:inline">
                      {isEditMode ? "Quitter" : "Éditer"}
                    </span>
                  </Button>

                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setDeleteDialogOpen(true)}
                    className="gap-1.5 px-2.5 sm:px-3"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="hidden sm:inline">Supprimer</span>
                  </Button>
                </>
              )}
            </div>

          </div>
        </div>
        {/* Header */}
        {/* Errors */}
        {
          saveError && (
            <div className="rounded-[var(--radius-xl)] border border-destructive/20 bg-destructive/8 p-4 text-sm text-destructive">
              {saveError}
            </div>
          )
        }

        <article className={cn("space-y-6 pb-24", isEditMode && isDirty && !isEditingTags && "md:pb-0")}>
          {/* Image */}
          <div className="space-y-2">
            <div
              className={cn(
                "group relative overflow-hidden rounded-[var(--radius-xl)]",
                isEditMode ? "cursor-pointer" : "cursor-default"
              )}
              onClick={() => {
                if (!isEditMode) return
                fileInputRef.current?.click()
              }}
              title={isEditMode ? "Cliquer pour changer la photo" : undefined}
            >
              {imagePreview ? (
                <>
                  <img
                    src={imagePreview}
                    alt={recipe.name}
                    className="aspect-video w-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/30">
                    <span className="flex flex-col items-center gap-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100">
                      <ImagePlus className="h-7 w-7" />
                      <span className="text-xs font-medium">Changer la photo</span>
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-[var(--radius-xl)] border-2 border-dashed border-border bg-muted/30 text-muted-foreground transition-colors hover:border-ring hover:bg-muted/50">
                  <ImagePlus className="h-8 w-8" />
                  <span className="text-sm">Cliquer pour ajouter une photo</span>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
          </div>

          {/* Titre */}
          <div className="space-y-3">
            <RecipeDetailSectionHeader icon={<Type className="h-3.5 w-3.5" />} label="Titre" />
            <InlineEditText
              value={formData.name}
              displayValue={
                <span className="font-heading text-2xl font-bold leading-snug tracking-tight">
                  {formData.name}
                </span>
              }
              onChange={(v) => patch({ name: v })}
              placeholder="Nom de la recette"
              as="h1"
              inputClassName="font-heading text-2xl font-bold"
              disabled={saving || !isEditMode}
            />

            {isEditMode && (
              <div className="space-y-2">
                <RecipeDetailSectionHeader icon={<ExternalLink className="h-3.5 w-3.5" />} label="Source" />
                <Input
                  type="url"
                  value={formData.orgURL ?? ""}
                  onChange={(e) => patch({ orgURL: e.target.value })}
                  placeholder="https://..."
                  disabled={saving || !isEditMode}
                  className={cn(
                    "h-11 rounded-[var(--radius-xl)] border-border/50 bg-secondary/20",
                  )}
                />
                <p className="text-xs text-muted-foreground">
                  Si ce champ est vide a l'enregistrement, l'URL source sera supprimee dans Mealie.
                </p>
              </div>
            )}

            {/* Ustensiles */}
            {visibleTools.length > 0 && (
              <div className="space-y-1.5">
                <RecipeDetailSectionHeader icon={<CookingPot className="h-3.5 w-3.5" />} label="Ustensiles" />
                <div className="flex flex-wrap gap-1.5">
                  {visibleTools.map((tool) => {
                    const active = formData.tools.some((current) => current.id === tool.id)
                    return (
                      <Badge
                        key={tool.id}
                        variant={isEditMode ? (active ? "default" : "outline") : "outline"}
                        className={cn(
                          "select-none transition-colors text-xs",
                          isEditMode ? "cursor-pointer" : "cursor-default"
                        )}
                        onClick={() => {
                          if (!isEditMode) return
                          void handleToggleTool({ id: tool.id, name: tool.name, slug: tool.slug })
                        }}
                      >
                        {tool.name}
                      </Badge>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <RecipeDetailSectionHeader icon={<Tag className="h-3.5 w-3.5" />} label="Tags" />
                {isEditMode && (
                  <Button
                    type="button"
                    variant={isEditingTags ? "default" : "outline"}
                    size="sm"
                    className="gap-1.5"
                    onClick={handleToggleTagEditing}
                    disabled={saving}
                  >
                    <PenLine className="h-3.5 w-3.5" />
                    {isEditingTags ? "Valider les tags" : "Editer les tags"}
                  </Button>
                )}
              </div>

              {isEditMode && isEditingTags && (
                <div className="space-y-2 rounded-[var(--radius-xl)] border border-border/50 bg-secondary/20 p-3">
                  <Input
                    type="text"
                    value={tagSearch}
                    onChange={(event) => setTagSearch(event.target.value)}
                    placeholder="Rechercher un tag..."
                    className="h-9"
                  />

                  <div className="max-h-36 overflow-y-auto pr-1">
                    <div className="flex flex-wrap gap-1.5">
                      {availableTags.map((tag) => (
                        <Badge
                          key={tag.id}
                          variant="outline"
                          className="cursor-pointer text-xs transition-colors hover:border-primary/50 hover:bg-primary/8 hover:text-primary"
                          onClick={() => handleAddTag({ id: tag.id, name: tag.name, slug: tag.slug })}
                        >
                          {tag.name}
                        </Badge>
                      ))}

                      {availableTags.length === 0 && (
                        <span className="text-xs text-muted-foreground">
                          Aucun autre tag disponible
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {formData.tags.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {formData.tags.map((tag) => (
                    <Badge
                      key={tag.id}
                      variant={isEditingTags && isEditMode ? "secondary" : "outline"}
                      className={cn(
                        "select-none text-xs transition-all",
                        isEditingTags && isEditMode ? "cursor-pointer animate-[wiggle-soft_0.32s_ease-in-out_infinite]" : "",
                      )}
                      onClick={() => {
                        if (!isEditingTags || !isEditMode) return
                        handleRemoveTag(tag.id)
                      }}
                    >
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              ) : isEditMode ? (
                <p className="text-sm text-muted-foreground">
                  Aucun tags sur cette recette.
                </p>
              ) : null}
            </div>

            {visibleCategories.length > 0 && (
              <div className="space-y-1.5">
                <RecipeDetailSectionHeader icon={<FolderOpen className="h-3.5 w-3.5" />} label="Catégories" />
                <div className="flex flex-wrap gap-1.5">
                  {visibleCategories.map((cat) => {
                    const active = formData.categories.some((c) => c.id === cat.id)
                    return (
                      <Badge
                        key={cat.id}
                        variant={isEditMode ? (active ? "default" : "outline") : "outline"}
                        className={cn(
                          "select-none transition-colors text-xs",
                          isEditMode ? "cursor-pointer" : "cursor-default"
                        )}
                        onClick={() => {
                          if (!isEditMode) return
                          void handleToggleCategory(cat)
                        }}
                      >
                        {cat.name}
                      </Badge>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Saisons */}
            {visibleSeasons.length > 0 && (
              <div className="space-y-1.5">
                <RecipeDetailSectionHeader icon={<Leaf className="h-3.5 w-3.5" />} label="Saisons" />
                <div className="flex flex-wrap gap-1.5">
                  {visibleSeasons.map((season: Season) => {
                    const active = formData.seasons.includes(season)
                    return (
                      <Badge
                        key={season}
                        variant={isEditMode ? (active ? "default" : "outline") : "outline"}
                        className={cn(
                          "select-none transition-colors text-xs",
                          isEditMode ? "cursor-pointer" : "cursor-default"
                        )}
                        onClick={() => {
                          if (!isEditMode) return
                          void handleToggleSeason(season)
                        }}
                      >
                        {SEASON_LABELS[season]}
                      </Badge>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Durées */}
            {visibleTimeEntries.length > 0 && (
              <div className="space-y-1.5">
                <RecipeDetailSectionHeader icon={<Clock3 className="h-3.5 w-3.5" />} label="Temps" />
                <div className="flex flex-wrap gap-4">
                  {visibleTimeEntries.map((entry) => (
                    <InlineEditDuration
                      key={entry.key}
                      label={entry.label}
                      value={entry.value}
                      displayRaw={entry.displayRaw ?? undefined}
                      onChange={(v) => patch({ [entry.key]: v } as Partial<RecipeFormData>)}
                      disabled={saving || !isEditMode}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Rating + Favorite */}
            <div className="flex items-center justify-between gap-3">

              {/* Rating */}
              <div className="flex items-center gap-1.5">
                {Array.from({ length: 5 }).map((_, i) => {
                  const value = i + 1
                  const current = recipe?.rating ?? 0

                  return (
                    <Star
                      key={i}
                      onClick={() => {
                        if (!isEditMode) return
                        void handleRate(value)
                      }}
                      className={cn(
                        "h-3.5 w-3.5 transition",
                        (saving || !isEditMode) && "pointer-events-none opacity-50",
                        isEditMode && "cursor-pointer",
                        value <= current
                          ? "text-yellow-400 fill-yellow-400"
                          : "text-muted-foreground/30 hover:text-yellow-300"
                      )}
                    />
                  )
                })}
              </div>

              {/* Favorite */}
              <button
                onClick={() => void handleToggleFavorite()}
                className={cn(
                  "ml-auto transition-all duration-150 hover:scale-110",
                  isFavorite ? "text-red-500" : "text-muted-foreground/40 hover:text-red-400"
                )}
              >
                <Heart
                  className={cn(
                    "h-5 w-5 transition-all",
                    isFavorite && "fill-red-500 text-red-500"
                  )}
                />
              </button>
            </div>

            {(isEditMode || visibleNutritionEntries.length > 0) && (
              <div
                className={cn(
                  "space-y-2.5 rounded-[var(--radius-xl)]",
                  "border border-border/50 bg-secondary/30 p-3.5",
                )}
              >
                <div className="grid gap-3">
                  <RecipeDetailSectionHeader icon={<FileText className="h-3.5 w-3.5" />} label="Nutrition" />

                  {isEditMode ? (
                    <>
                      <div className="flex justify-start sm:justify-center">
                        <InlineEditCompactNumber
                          label="Calories"
                          value={String(formData.nutrition.calories ?? "")}
                          unit="kcal"
                          placeholder="-"
                          onChange={(nextValue) =>
                            patch({
                              nutrition: {
                                ...formData.nutrition,
                                calories: nextValue,
                              },
                            })
                          }
                          disabled={saving || !isEditMode}
                        />
                      </div>

                      {NUTRITION_LAYOUT.map((row, index) => (
                        <div
                          key={index}
                          className={cn(
                            "grid gap-1.5",
                            row.length >= 4 ? "sm:grid-cols-4" : "sm:grid-cols-2",
                          )}
                        >
                          {row.map(({ key, label, unit }) => (
                            <InlineEditCompactNumber
                              key={key}
                              label={label}
                              value={String(formData.nutrition[key] ?? "")}
                              unit={unit}
                              placeholder="-"
                              onChange={(nextValue) =>
                                patch({
                                  nutrition: {
                                    ...formData.nutrition,
                                    [key]: nextValue,
                                  },
                                })
                              }
                              disabled={saving || !isEditMode}
                            />
                          ))}
                        </div>
                      ))}
                    </>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {visibleNutritionEntries.map(({ key, label, unit }) => (
                        <Badge key={key} variant="outline" className="text-xs">
                          {label} : {String(formData.nutrition[key] ?? "")} {unit}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Description */}
            <div className="space-y-2">
              <RecipeDetailSectionHeader icon={<FileText className="h-3.5 w-3.5" />} label="Description" />

              {isEditMode ? (
                <div className="space-y-2">
                  <textarea
                    value={formData.description}
                    onChange={(e) => {
                      patch({ description: e.target.value })
                      autoResizeTextarea(e.target, 4)
                    }}
                    onInput={(e) => autoResizeTextarea(e.currentTarget, 4)}
                    placeholder="Ajouter une description..."
                    disabled={saving || !isEditMode}
                    rows={4}
                    className={cn(
                      "w-full rounded-[var(--radius-xl)] border border-border/50 bg-secondary/20 px-3 py-2",
                      "resize-none overflow-hidden text-sm leading-relaxed text-foreground",
                      "outline-none transition-colors focus:border-ring",
                    )}
                  />
                </div>
              ) : (
                <MarkdownContent
                  content={formData.description}
                  className="text-sm leading-relaxed text-muted-foreground"
                />
              )}
            </div>

          </div>

          <RecipeIngredientsSection
            recipeServings={formData.recipeServings}
            isEditMode={isEditMode}
            saving={saving}
            visibleIngredients={visibleIngredients}
            totalIngredientCount={formData.recipeIngredient.length}
            analyzableIngredientIndexes={analyzableIngredientIndexes}
            analyzingIngredientIndexes={analyzingIngredientIndexes}
            foodOptions={foodOptions}
            unitOptions={unitOptions}
            onChangeServings={(value) => patch({ recipeServings: value })}
            onAnalyzeIngredients={handleAnalyzeIngredients}
            onAddIngredient={addIngredient}
            onUpdateIngredientField={updateIngredientField}
            onRemoveIngredient={removeIngredient}
          />

          <RecipeInstructionsSection
            visibleInstructions={visibleInstructions}
            ingredients={formData.recipeIngredient}
            isEditMode={isEditMode}
            saving={saving}
            instructionIngredientInputs={instructionIngredientInputs}
            instructionIngredientOptions={instructionIngredientOptions}
            onInstructionIngredientInputsChange={setInstructionIngredientInputs}
            onAutoLinkIngredients={handleAutoLinkIngredients}
            onAddInstruction={addInstruction}
            onUpdateInstruction={updateInstruction}
            onMoveInstruction={moveInstruction}
            onRemoveInstruction={removeInstruction}
            onUpdateInstructionReferences={updateInstructionReferences}
          />

          <RecipeCommentsSection
            comments={comments}
            commentsLoading={commentsLoading}
            creatingComment={creatingComment}
            deletingCommentId={deletingCommentId}
            commentsError={commentsError}
            onCreateComment={createComment}
            onDeleteComment={deleteComment}
          />
          {/* Sticky save bar when dirty */}
          {isEditMode && isDirty && !isEditingTags && (
            <div
              className={cn(
                "fixed inset-x-4 bottom-[calc(env(safe-area-inset-bottom)+4.5rem)] z-[60] flex justify-end gap-2 rounded-[var(--radius-xl)] border border-border bg-background/95 px-4 py-3 shadow-lg backdrop-blur-sm",
                "md:sticky md:inset-x-auto md:bottom-4",
              )}
            >
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancelEditingAndLinks}
                disabled={saving}
              >
                Annuler
              </Button>
              <Button
                size="sm"
                onClick={() => void handleSaveAndResetLinks()}
                disabled={saving || !formData.name.trim()}
                className="gap-1.5"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Enregistrer les modifications
                  </>
                )}
              </Button>
            </div>
          )}
        </article>
      </div >

      <Button
        type="button"
        onClick={() => setCookingMode(true)}
        className={cn(
          "fixed right-4 z-[70] h-14 rounded-full px-5 shadow-[0_16px_40px_rgba(0,0,0,0.18)]",
          "bg-primary text-primary-foreground hover:bg-primary/90",
          isEditMode && isDirty && !isEditingTags
            ? "bottom-[calc(env(safe-area-inset-bottom)+9.5rem)] md:bottom-4"
            : "bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] md:bottom-4",
        )}
      >
        <UtensilsCrossed className="mr-2 h-4 w-4" />
        En cuisine
      </Button>
    </>
  )
}

export function RecipeDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { recipe, loading, error, setRecipe } = useRecipe(slug)

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-6">
      {loading && <RecipeDetailSkeleton />}

      {error && (
        <div className="rounded-[var(--radius-xl)] border border-destructive/20 bg-destructive/8 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {recipe && (
        <RecipeDetailContent
          key={recipe.id}
          recipe={recipe}
          setRecipe={setRecipe}
          onRecipeDeleted={() => navigate("/recipes")}
        />
      )}
    </div>
  )
}
