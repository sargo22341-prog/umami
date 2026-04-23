import { useEffect, useRef, useState } from "react"
import { Link } from "react-router-dom"
import { CalendarPlus, Clock, ExternalLink, FileText, Heart, Loader2, ShoppingCart, 
  Star, UtensilsCrossed, Wrench, X } from "lucide-react"
  
// Components 
import { CookingMode } from "components/common/CookingMode.tsx"
import { PlanningAddToCartDialog } from "components/common/PlanningAddToCartDialog"

import { RecipeIngredientsList, RecipeInstructionsList } from "components/recipes"
import { PlanningSlotPicker } from "components/planning/PlanningSlotPicker.tsx"
import { RecipeCommentsSection } from "components/recipeDetail"

// Components Ui
import { Badge, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "components/ui"

// Hooks
import { useRecipe } from "hooks/recipes/useRecipe"
import { useRecipeComments } from "hooks/comments/useRecipeComments"
import { useUpdateRating } from "hooks/rating/useUpdateRating.ts"
import { useGetFavorites } from "hooks/favorite/useGetFavorites.ts"
import { useToggleFavorite } from "hooks/favorite/useToggleFavorite.ts"
import { useAddRecipesToCart } from "hooks/shopping"

import { addMealUseCase, deleteMealUseCase } from "@/infrastructure/container"
import { getRecipeSeasonsFromTags, recipeImageUrl, formatDuration } from "@/shared/utils"
import { cn } from "@/lib/utils"

import type { MealieUserRatingSummary } from "@/shared/types/mealie/Recipes.ts"
import type { MealieRecipeCategory } from "@/shared/types/mealie/Category.ts"
import { SEASON_LABELS } from "@/shared/types/Season.ts"

interface RecipeDrawerProps {
  slug: string
  allCategories: MealieRecipeCategory[]
  closing: boolean
  onClose: () => void
}

export function RecipeDrawer({ slug, closing, onClose }: RecipeDrawerProps) {
  const { recipe, setRecipe, loading } = useRecipe(slug)
  const { updateRating } = useUpdateRating()
  const { getFavorites } = useGetFavorites()
  const { toggleFavorite } = useToggleFavorite()
  const { addRecipes, loading: addingToCart } = useAddRecipesToCart()
  const {
    comments,
    loading: commentsLoading,
    creating: creatingComment,
    deletingId,
    error: commentsError,
    createComment,
    deleteComment,
  } = useRecipeComments(recipe?.slug, recipe?.id)

  const [cookingMode, setCookingMode] = useState(false)
  const [planningPickerOpen, setPlanningPickerOpen] = useState(false)
  const [cartDialogOpen, setCartDialogOpen] = useState(false)
  const [ratings, setRatings] = useState<MealieUserRatingSummary[]>([])
  const [favoriteOverride, setFavoriteOverride] = useState<boolean | null>(null)
  const syncLock = useRef(false)
  const swipeStartRef = useRef<{ x: number; y: number; timestamp: number } | null>(null)
  const swipeCurrentRef = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    if (!recipe || syncLock.current) return

    void (async () => {
      const data = await getFavorites()
      setRatings(data.ratings)
    })()

  }, [getFavorites, recipe, setRecipe])

  const handleSlotSelect = async (date: string, entryType: string, existingMealId?: number) => {
    if (!recipe) return
    if (existingMealId !== undefined) {
      await deleteMealUseCase.execute(existingMealId)
    }
    await addMealUseCase.execute(date, entryType, recipe.id)
    setPlanningPickerOpen(false)
  }

  const handleRate = async (value: number) => {
    if (!recipe) return
    const success = await updateRating(recipe.slug, value)
    if (success) {
      setRecipe({
        ...recipe,
        rating: value,
      })
    }
  }

  const isFavorite =
    favoriteOverride !== null
      ? favoriteOverride
      : ratings.some((rating) => rating.recipeId === recipe?.id && rating.isFavorite)

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

  const servingsValue =
    recipe?.recipeServings != null && String(recipe.recipeServings).trim() !== ""
      ? String(recipe.recipeServings)
      : "1"
  const servingsLabel = Number(servingsValue) > 1 ? "portions" : "portion"

  const handleDrawerTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    if (window.innerWidth >= 768) return
    const touch = event.touches[0]
    swipeStartRef.current = { x: touch.clientX, y: touch.clientY, timestamp: Date.now() }
    swipeCurrentRef.current = { x: touch.clientX, y: touch.clientY }
  }

  const handleDrawerTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    if (!swipeStartRef.current || window.innerWidth >= 768) return
    const touch = event.touches[0]
    swipeCurrentRef.current = { x: touch.clientX, y: touch.clientY }
  }

  const handleDrawerTouchEnd = () => {
    if (!swipeStartRef.current || !swipeCurrentRef.current || window.innerWidth >= 768) {
      swipeStartRef.current = null
      swipeCurrentRef.current = null
      return
    }

    const dx = swipeCurrentRef.current.x - swipeStartRef.current.x
    const dy = swipeCurrentRef.current.y - swipeStartRef.current.y

    const elapsed = Date.now() - swipeStartRef.current.timestamp
    const isHorizontalSwipe = dx > 96 && Math.abs(dy) < 36 && Math.abs(dx) > Math.abs(dy) * 2 && elapsed < 700

    if (isHorizontalSwipe) {
      onClose()
    }

    swipeStartRef.current = null
    swipeCurrentRef.current = null
  }

  const recipeCategories = recipe?.recipeCategory ?? []
  const recipeTools = recipe?.tools ?? []
  const recipeSeasons = recipe ? getRecipeSeasonsFromTags(recipe.tags).filter((season) => season !== "sans") : []

  return (
    <>
      {cookingMode && recipe && (
        <CookingMode
          recipeId={recipe.id}
          recipeName={recipe.name}
          ingredients={recipe.recipeIngredient ?? []}
          instructions={recipe.recipeInstructions ?? []}
          assets={recipe.assets}
          onClose={() => setCookingMode(false)}
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

      <div
        className={cn(
          "fixed inset-y-0 right-0 z-50",
          "flex w-full max-w-md flex-col",
          "border-l border-border/40 bg-card",
          "shadow-warm-lg",
          closing ? "animate-slide-out-right" : "animate-slide-in-right",
        )}
        onTouchStart={handleDrawerTouchStart}
        onTouchMove={handleDrawerTouchMove}
        onTouchEnd={handleDrawerTouchEnd}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-border/40 px-5 py-3.5">
          <span className="font-heading text-base font-bold tracking-tight">Recette</span>
          <div className="flex items-center gap-1.5">
            {recipe && (
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      aria-label="Planifier"
                      title="Planifier"
                      onClick={() => setPlanningPickerOpen(true)}
                      className={cn(
                        "flex items-center justify-center rounded-[var(--radius-md)] border border-border p-2",
                        "text-muted-foreground transition-all duration-150",
                        "hover:border-border/80 hover:bg-secondary hover:text-foreground",
                      )}
                    >
                      <CalendarPlus className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Planifier</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      aria-label="Mode cuisine"
                      title="Mode cuisine"
                      onClick={() => setCookingMode(true)}
                      className={cn(
                        "flex items-center justify-center rounded-[var(--radius-md)] border border-border p-2",
                        "text-muted-foreground transition-all duration-150",
                        "hover:border-border/80 hover:bg-secondary hover:text-foreground",
                      )}
                    >
                      <UtensilsCrossed className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Mode cuisine</TooltipContent>
                </Tooltip>

                {recipe.orgURL && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <a
                        aria-label="Recette originale"
                        title="Recette originale"
                        href={recipe.orgURL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          "flex items-center justify-center rounded-[var(--radius-md)] border border-border p-2",
                          "text-muted-foreground transition-all duration-150",
                          "hover:border-border/80 hover:bg-secondary hover:text-foreground",
                        )}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </TooltipTrigger>
                    <TooltipContent>Recette originale</TooltipContent>
                  </Tooltip>
                )}
              </TooltipProvider>
            )}

            <button
              type="button"
              onClick={onClose}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)]",
                "text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground",
              )}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {loading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-primary/60" />
            </div>
          )}

          {recipe && (
            <article className="space-y-5 pb-24">
              <div className="relative">
                <img
                  src={recipeImageUrl(recipe, "original")}
                  alt={recipe.name}
                  className="aspect-video w-full object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-card to-transparent" />
              </div>

              <div className="space-y-4 px-5">
                <h1 className="font-heading text-xl font-bold leading-snug tracking-tight">{recipe.name}</h1>

                <div className="flex items-center gap-2 px-5">
                  <button
                    type="button"
                    onClick={() => setCartDialogOpen(true)}
                    aria-label="Ajouter cette recette"
                    title="Ajouter cette recette"
                    className={cn(
                      "flex min-w-0 flex-1 items-center justify-center gap-2 rounded-[var(--radius-lg)]",
                      "border border-border/60 bg-card px-3 py-2.5 text-sm font-medium",
                      "text-foreground transition-colors hover:bg-secondary",
                    )}
                  >
                    <ShoppingCart className="h-4 w-4 shrink-0" />
                    <span className="hidden min-[420px]:inline">Ajouter</span>
                  </button>

                  <Link
                    aria-label="Page complète"
                    title="Page complète"
                    to={`/recipes/${recipe.slug}`}
                    className={cn(
                      "flex min-w-0 flex-1 items-center justify-center gap-2 rounded-[var(--radius-lg)]",
                      "border border-border/60 bg-card px-3 py-2.5 text-sm font-medium",
                      "text-foreground transition-colors hover:bg-secondary",
                    )}
                  >
                    <FileText className="h-4 w-4 shrink-0" />
                    <span className="hidden min-[420px]:inline">Page complète</span>
                  </Link>
                </div>

                {(recipe.prepTime || recipe.performTime || recipe.totalTime) && (
                  <div className="flex flex-wrap gap-3">
                    {recipe.prepTime && (
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="h-3.5 w-3.5 text-primary/60" />
                        <span className="font-medium">Prép.</span> {formatDuration(recipe.prepTime)}
                      </span>
                    )}
                    {recipe.performTime && (
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="h-3.5 w-3.5 text-primary/60" />
                        <span className="font-medium">Cuisson</span> {formatDuration(recipe.performTime)}
                      </span>
                    )}
                    {recipe.totalTime && (
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="h-3.5 w-3.5 text-primary/60" />
                        <span className="font-medium">Total</span> {formatDuration(recipe.totalTime)}
                      </span>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {Array.from({ length: 5 }).map((_, index) => {
                      const value = index + 1
                      const current = recipe.rating ?? 0

                      return (
                        <Star
                          key={value}
                          onClick={() => void handleRate(value)}
                          className={cn(
                            "h-3.5 w-3.5 cursor-pointer transition",
                            loading && "pointer-events-none opacity-50",
                            value <= current
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
                      "ml-2 transition-all duration-150 hover:scale-110",
                      isFavorite ? "text-red-500" : "text-muted-foreground/40 hover:text-red-400",
                    )}
                    aria-label={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
                  >
                    <Heart className={cn("h-5 w-5 transition-all", isFavorite && "fill-red-500 text-red-500")} />
                  </button>
                </div>

                {recipe.description && (
                  <p className="text-sm leading-relaxed text-muted-foreground">{recipe.description}</p>
                )}

                {recipeCategories.length > 0 && (
                  <div className="space-y-2.5 rounded-[var(--radius-xl)] border border-border/50 bg-secondary/30 p-3.5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.10em] text-muted-foreground/60">
                      Catégories
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {recipeCategories.map((category) => (
                        <Badge key={category.id} variant="default">
                          {category.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {recipeTools.length > 0 && (
                  <div className="space-y-2.5 rounded-[var(--radius-xl)] border border-border/50 bg-secondary/30 p-3.5">
                    <div className="flex items-center gap-2">
                      <Wrench className="h-3.5 w-3.5 text-muted-foreground/70" />
                      <p className="text-[10px] font-bold uppercase tracking-[0.10em] text-muted-foreground/60">
                        Ustensiles
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {recipeTools.map((tool) => (
                        <Badge key={tool.id} variant="default">
                          {tool.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {recipeSeasons.length > 0 && (
                  <div className="space-y-2.5 rounded-[var(--radius-xl)] border border-border/50 bg-secondary/30 p-3.5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.10em] text-muted-foreground/60">
                      Saisons
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {recipeSeasons.map((season) => (
                        <Badge key={season} variant="default">
                          {SEASON_LABELS[season]}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {recipe.nutrition?.calories && (
                  <div className="space-y-2.5 rounded-[var(--radius-xl)] border border-border/50 bg-secondary/30 p-3.5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.10em] text-muted-foreground/60">
                      Nutrition
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant="outline">{recipe.nutrition.calories} kcal</Badge>
                      {recipe.nutrition.proteinContent && (
                        <Badge variant="outline">{recipe.nutrition.proteinContent}g protéines</Badge>
                      )}
                      {recipe.nutrition.carbohydrateContent && (
                        <Badge variant="outline">{recipe.nutrition.carbohydrateContent}g glucides</Badge>
                      )}
                      {recipe.nutrition.fatContent && (
                        <Badge variant="outline">{recipe.nutrition.fatContent}g lipides</Badge>
                      )}
                      {recipe.nutrition.fiberContent && (
                        <Badge variant="outline">{recipe.nutrition.fiberContent}g fibres</Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {((recipe.recipeIngredient ?? []).length > 0 || (recipe.recipeInstructions ?? []).length > 0) && (
                <div className="px-5">
                  <div className="divider-editorial" />
                </div>
              )}

              {(recipe.recipeIngredient ?? []).length > 0 && (
                <div className="px-5">
                  <RecipeIngredientsList
                    ingredients={recipe.recipeIngredient ?? []}
                    headingSize="text-base"
                    headingText={`Ingrédients pour ${servingsValue} ${servingsLabel}`}
                  />
                </div>
              )}

              {(recipe.recipeInstructions ?? []).length > 0 && (
                <div className="px-5">
                  <RecipeInstructionsList instructions={recipe.recipeInstructions ?? []} headingSize="text-base" />
                </div>
              )}

              <div className="px-5">
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
              </div>
            </article>
          )}
        </div>
      </div>
    </>
  )
}
