import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { CalendarPlus, ExternalLink, FileText, Heart, Loader2, ShoppingCart, Star, Utensils, UtensilsCrossed } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, Button, Badge } from "components/ui"

// hooks
import { useRecipe } from "hooks/recipes"
import { useRecipeComments } from "hooks/comments/useRecipeComments.ts"
import { useUpdateRating } from "hooks/rating/useUpdateRating.ts"
import { useGetFavorites } from "hooks/favorite/useGetFavorites.ts"
import { useToggleFavorite } from "hooks/favorite/useToggleFavorite.ts"
import { useAddRecipesToCart } from "hooks/shopping"

// components
import { PlanningSlotPicker } from "components/planning/PlanningSlotPicker.tsx"
import { CookingMode } from "components/common/CookingMode.tsx"
import { PlanningAddToCartDialog } from "components/common/PlanningAddToCartDialog.tsx"
import { MarkdownContent } from "components/common/MarkdownContent.tsx"
import { SeasonBadge } from "components/recipes"
import { RecipeCommentsSection } from "components/recipeDetail"

// utils
import { formatDuration, getRecipeSeasonsFromTags, SectionLabel, recipeImageUrl, renderIngredientText, truncateText, getStoredMealieUrl } from "@/shared/utils"
import { cn } from "@/lib/utils.ts"

import { addMealUseCase, deleteMealUseCase } from "@/infrastructure/container.ts"

// types
import type {
  MealieRecipeAsset, MealieRecipeIngredientOutput, MealieRecipeStep, MealieUserRatingSummary,
} from "@/shared/types/mealie/Recipes.ts"


interface RecipeDetailModalProps {
  slug: string | null
  onOpenChange: (open: boolean) => void
}

interface CookingSnapshot {
  id: string
  name: string
  ingredients: MealieRecipeIngredientOutput[]
  instructions: MealieRecipeStep[]
  assets?: MealieRecipeAsset[] | null
}

const baseurl = getStoredMealieUrl()

export function RecipeDetailModal({ slug, onOpenChange }: RecipeDetailModalProps) {
  const { recipe, loading, error } = useRecipe(slug ?? undefined)
  const [cookingSnapshot, setCookingSnapshot] = useState<CookingSnapshot | null>(null)
  const [planningPickerOpen, setPlanningPickerOpen] = useState(false)
  const [cartDialogOpen, setCartDialogOpen] = useState(false)
  const [favoriteOverride, setFavoriteOverride] = useState<boolean | null>(null)
  const [ratingOverride, setRatingOverride] = useState<number | null>(null)
  const [ratings, setRatings] = useState<MealieUserRatingSummary[]>([])
  const { addRecipes, loading: addingToCart } = useAddRecipesToCart()
  const { comments, loading: commentsLoading, creating: creatingComment,
    deletingId, error: commentsError, createComment, deleteComment } = useRecipeComments(recipe?.slug, recipe?.id)
  const { getFavorites } = useGetFavorites()
  const { updateRating } = useUpdateRating()
  const { toggleFavorite } = useToggleFavorite()

  useEffect(() => {
    let mounted = true
    const load = async () => {
      const data = await getFavorites()
      if (!mounted) return
      setRatings(data.ratings)
    }

    void load()
    return () => {
      mounted = false
    }
  }, [getFavorites, slug])

  const handleModalOpenChange = (open: boolean) => {
    if (!open) {
      setFavoriteOverride(null)
      setRatingOverride(null)
    }
    onOpenChange(open)
  }

  const handleSlotSelect = async (date: string, entryType: string, existingMealId?: number) => {
    if (!recipe) return
    if (existingMealId !== undefined) {
      await deleteMealUseCase.execute(existingMealId)
    }
    await addMealUseCase.execute(date, entryType, recipe.id)
    setPlanningPickerOpen(false)
  }

  const handleStartCooking = () => {
    if (!recipe) return
    setCookingSnapshot({
      id: recipe.id,
      name: recipe.name,
      ingredients: recipe.recipeIngredient ?? [],
      instructions: recipe.recipeInstructions ?? [],
      assets: recipe.assets,
    })
    onOpenChange(false)
  }

  const handleRate = async (value: number) => {
    if (!recipe) return
    const success = await updateRating(recipe.slug, value)
    if (!success) return
    setRatingOverride(value)
  }

  const currentRating = ratingOverride ?? recipe?.rating ?? 0

  const isFavorite =
    favoriteOverride !== null
      ? favoriteOverride
      : Boolean(recipe && ratings.some((rating) => rating.recipeId === recipe.id && rating.isFavorite))

  const handleToggleFavorite = async () => {
    if (!recipe) return
    const previous = isFavorite
    const next = !previous
    setFavoriteOverride(next)
    const success = await toggleFavorite(recipe.slug, previous)
    if (!success) {
      setFavoriteOverride(previous)
    }
  }

  const seasons = recipe ? getRecipeSeasonsFromTags(recipe.tags) : []
  const servingsValue =
    recipe?.recipeServings != null && String(recipe.recipeServings).trim() !== ""
      ? String(recipe.recipeServings)
      : "1"
  const servingsLabel = Number(servingsValue) > 1 ? "portions" : "portion"

  const nutritionEntries = recipe
    ? [
      { label: "Calories", value: recipe.nutrition?.calories, unit: "kcal" },
      { label: "Graisses saturées", value: recipe.nutrition?.saturatedFatContent, unit: "g" },
      { label: "Fibres", value: recipe.nutrition?.fiberContent, unit: "g" },
      { label: "Glucides", value: recipe.nutrition?.carbohydrateContent, unit: "g" },
      { label: "Sucres", value: recipe.nutrition?.sugarContent, unit: "g" },
      { label: "Lipides", value: recipe.nutrition?.fatContent, unit: "g" },
      { label: "Protéines", value: recipe.nutrition?.proteinContent, unit: "g" },
      { label: "Cholestérol", value: recipe.nutrition?.cholesterolContent, unit: "mg" },
      { label: "Sodium", value: recipe.nutrition?.sodiumContent, unit: "mg" },
      { label: "Graisses trans", value: recipe.nutrition?.transFatContent, unit: "g" },
      { label: "Graisses insaturées", value: recipe.nutrition?.unsaturatedFatContent, unit: "g" },
    ].filter((entry) => entry.value != null && String(entry.value).trim() !== "")
    : []

  return (
    <>
      {cookingSnapshot && (
        <CookingMode
          recipeId={cookingSnapshot.id}
          recipeName={cookingSnapshot.name}
          ingredients={cookingSnapshot.ingredients}
          instructions={cookingSnapshot.instructions}
          assets={cookingSnapshot.assets}
          onClose={() => setCookingSnapshot(null)}
        />
      )}

      <PlanningSlotPicker
        open={planningPickerOpen}
        onOpenChange={setPlanningPickerOpen}
        recipeName={recipe?.name ?? ""}
        onSelect={handleSlotSelect}
      />

      {recipe && (
        <PlanningAddToCartDialog
          open={cartDialogOpen}
          onOpenChange={setCartDialogOpen}
          recipes={[{ recipe, occurrences: 1 }]}
          loadingRecipes={false}
          submitting={addingToCart}
          onSubmit={addRecipes}
        />
      )}

      <Dialog open={!!slug} onOpenChange={handleModalOpenChange}>
        <DialogContent
          className="flex max-h-[90vh] w-[calc(100vw-1.5rem)] max-w-[calc(100vw-1.5rem)] flex-col overflow-hidden sm:max-w-3xl"
          onOpenAutoFocus={(event) => event.preventDefault()}
        >
          <DialogHeader className="gap-3 pr-6">
            <DialogTitle className="pr-2 text-xl leading-snug">{recipe?.name ?? " "}</DialogTitle>
            <DialogDescription className="sr-only">
              Apercu rapide de la recette avec ses actions principales, ses ingredients, ses instructions et ses commentaires.
            </DialogDescription>

            <div className="flex items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCartDialogOpen(true)}
                  className="gap-1.5"
                  disabled={!recipe}
                >
                  <ShoppingCart className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Ajouter au panier</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPlanningPickerOpen(true)}
                  className="gap-1.5"
                  disabled={!recipe}
                >
                  <CalendarPlus className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Planifier</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleStartCooking}
                  className="gap-1.5"
                  disabled={!recipe}
                >
                  <UtensilsCrossed className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Mode cuisine</span>
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {recipe && (
                  <Button variant="outline" size="sm" asChild className="gap-1.5">
                    <Link to={`/recipes/${recipe.slug}`}>
                      <FileText className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Détail</span>
                    </Link>
                  </Button>
                )}

                {recipe?.orgURL && (
                  <Button variant="outline" size="sm" asChild className="gap-1.5">
                    <a href={recipe.orgURL} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Source</span>
                    </a>
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
          </DialogHeader>

          <div className="flex-1 overflow-y-auto pr-1">
            {loading && (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}

            {error && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
                {error}
              </div>
            )}

            {recipe && (
              <article className="space-y-6 p-1">
                <div className="relative overflow-hidden rounded-[var(--radius-xl)]">
                  <img
                    src={recipeImageUrl(recipe, "original")}
                    alt={recipe.name}
                    className="aspect-video w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/5 to-transparent" />
                  {seasons.length > 0 && (
                    <div className="absolute bottom-2.5 right-2.5 flex flex-wrap justify-end gap-1">
                      {seasons.map((season) => (
                        <SeasonBadge key={season} season={season} size="sm" />
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5">
                      {Array.from({ length: 5 }).map((_, index) => {
                        const value = index + 1

                        return (
                          <Star
                            key={value}
                            onClick={() => void handleRate(value)}
                            className={cn(
                              "h-3.5 w-3.5 cursor-pointer transition",
                              value <= currentRating
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-muted-foreground/30 hover:text-yellow-300",
                            )}
                          />
                        )
                      })}
                    </div>

                    <button
                      type="button"
                      onClick={() => void handleToggleFavorite()}
                      className={cn(
                        "transition-all duration-150 hover:scale-110",
                        isFavorite ? "text-red-500" : "text-muted-foreground/40 hover:text-red-400",
                      )}
                      aria-label={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
                    >
                      <Heart className={cn("h-5 w-5", isFavorite && "fill-red-500 text-red-500")} />
                    </button>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {(recipe.recipeCategory ?? []).length > 0 && (
                      <div className="space-y-2 p-3.5">
                        <SectionLabel label="Catégories" />
                        <div className="flex flex-wrap gap-1.5">
                          {recipe.recipeCategory?.map((category) => (
                            <Badge key={category.id} variant="outline" className="text-xs">
                              {category.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {(recipe.tools ?? []).length > 0 && (
                      <div className="space-y-2 p-3.5">
                        <SectionLabel label="Ustensiles" />
                        <div className="flex flex-wrap gap-1.5">
                          {recipe.tools?.map((tool) => (
                            <Badge key={tool.id} variant="outline" className="text-xs">
                              {tool.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {(recipe.prepTime || recipe.performTime || recipe.totalTime) && (
                    <div className="space-y-2 rounded-[var(--radius-xl)] border border-border/50 bg-secondary/20 p-3.5">
                      <SectionLabel label="Temps" />
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        {recipe.prepTime && <span>Préparation : {formatDuration(recipe.prepTime)}</span>}
                        {recipe.performTime && <span>Cuisson : {formatDuration(recipe.performTime)}</span>}
                        {recipe.totalTime && <span>Total : {formatDuration(recipe.totalTime)}</span>}
                      </div>
                    </div>
                  )}

                  {nutritionEntries.length > 0 && (
                    <div className="space-y-2 rounded-[var(--radius-xl)] border border-border/50 bg-secondary/20 p-3.5">
                      <SectionLabel label="Nutrition" />
                      <div className="overflow-x-auto pb-1">
                        <div className="flex min-w-max gap-1.5">
                          {nutritionEntries.map((entry) => (
                            <div
                              key={entry.label}
                              className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-background px-2 py-1 text-sm text-muted-foreground"
                            >
                              <span>{entry.label}</span>
                              <span className="font-medium text-foreground">
                                {entry.value} {entry.unit}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {recipe.description && (
                    <div className="space-y-2">
                      <SectionLabel label="Description" />
                      <MarkdownContent
                        content={truncateText(recipe.description, 250)}
                        className="text-sm leading-relaxed text-muted-foreground"
                      />
                    </div>
                  )}
                </div>

                {(recipe.recipeIngredient ?? []).length > 0 && (
                  <section className="space-y-3">
                    <h2 className="font-heading text-base font-bold tracking-tight">
                      Ingrédients pour {servingsValue} {servingsLabel}
                    </h2>
                    <ul className="space-y-1.5">
                      {(recipe.recipeIngredient ?? []).map((ingredient, index) => (
                        <li key={index} className="text-sm leading-relaxed">
                          {renderIngredientText(ingredient)}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {(recipe.recipeInstructions ?? []).length > 0 && (
                  <section className="space-y-3">
                    <h2 className="font-heading text-base font-bold tracking-tight">Instructions</h2>

                    <ol className="space-y-4">
                      {(recipe.recipeInstructions ?? []).map((instruction, index) => (
                        <li key={instruction.id ?? index} className="flex items-start gap-3">
                          <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/8 text-[11px] font-bold text-primary">
                            {index + 1}
                          </span>

                          <div className="min-w-0 flex-1">
                            {(instruction.summary ?? instruction.title) && (
                              <h3 className="mb-1 text-sm font-semibold text-foreground">
                                {instruction.summary ?? instruction.title}
                              </h3>
                            )}

                            <MarkdownContent
                              content={truncateText(instruction.text ?? "", 250)}
                              className="text-sm leading-relaxed text-foreground/90"
                            />
                          </div>
                        </li>
                      ))}
                    </ol>
                  </section>
                )}

                <RecipeCommentsSection
                  comments={comments}
                  commentsLoading={commentsLoading}
                  creatingComment={creatingComment}
                  deletingCommentId={deletingId}
                  commentsError={commentsError}
                  headingClassName="text-base"
                  onCreateComment={createComment}
                  onDeleteComment={deleteComment}
                />
              </article>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
