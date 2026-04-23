// React
import { type ReactNode } from "react"

// Router
import { Link, useNavigate } from "react-router-dom"

// Icons (lucide)
import {
  Check, Clock3, CookingPot, FileText, FolderOpen, GripVertical, 
  ImagePlus, Leaf, Loader2, Plus, Tag, Trash2, Type,
} from "lucide-react"

// Hooks - Recipes
import { useRecipeForm, useRecipeCreationForm } from "hooks/recipes"

// Hooks - Organizer
import { useCategories, useFoods, useTags, useTools, useUnits } from "hooks/organizer"

// UI Components
import { Button, Badge, Input, Combobox } from "components/ui"

// Feature Components - Recipes
import { SeasonBadge } from "components/recipes"

// Feature Components - Shared
import { InlineEditText, InlineEditDuration } from "components/common/RecipeEditorShared.tsx"
import { InlineEditCompactNumber } from "components/common/InlineEditCompactNumber.tsx"

// Components - Recipe
import { NUTRITION_LAYOUT } from "components/recipeDetail"

// Constants
import { SEASONS, SEASON_LABELS, type Season} from "@/shared/types/Season.ts"

function SectionHeader({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
      {icon}
      <span>{label}</span>
    </div>
  )
}

export function RecipeAddPage() {
  const navigate = useNavigate()
  const { createRecipe, loading: saving, error: saveError } = useRecipeForm()
  const { categories: allCategories } = useCategories()
  const { foods } = useFoods()
  const { tags: allTags } = useTags()
  const { tools: allTools } = useTools()
  const { units } = useUnits()
  const {
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
  } = useRecipeCreationForm(allTags)

  const handleCreate = async () => {
    if (!formData.name.trim()) return
    const result = await createRecipe(formData)
    if (result) {
      navigate(`/recipes/${result.slug}`)
    }
  }

  const foodOptions = foods.map((food) => ({ id: food.id, label: food.name }))
  const unitOptions = units.map((unit) => ({
    id: unit.id,
    label: unit.useAbbreviation && unit.abbreviation ? unit.abbreviation : unit.name,
  }))

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/recipes">&larr; Recettes</Link>
        </Button>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={() => navigate("/recipes")} disabled={saving}>
            Annuler
          </Button>
          <Button size="sm" onClick={() => void handleCreate()} disabled={saving || !formData.name.trim()} className="gap-1.5">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creation...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Creer la recette
              </>
            )}
          </Button>
        </div>
      </div>

      {saveError && (
        <div className="rounded-[var(--radius-xl)] border border-destructive/20 bg-destructive/8 p-4 text-sm text-destructive">
          {saveError}
        </div>
      )}

      <article className="space-y-6">
        <div className="space-y-2">
          <div
            className="group relative cursor-pointer overflow-hidden rounded-[var(--radius-xl)]"
            onClick={() => fileInputRef.current?.click()}
            title="Cliquer pour ajouter une photo"
          >
            {imagePreview ? (
              <>
                <img src={imagePreview} alt="Apercu" className="aspect-video w-full object-cover" />
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
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
        </div>

        <div className="space-y-3">
          <SectionHeader icon={<Type className="h-3.5 w-3.5" />} label="Titre" />
          <InlineEditText
            value={formData.name}
            displayValue={formData.name ? <span className="font-heading text-2xl font-bold leading-snug tracking-tight">{formData.name}</span> : undefined}
            onChange={(value) => patch({ name: value })}
            placeholder="Nom de la recette"
            as="h1"
            inputClassName="font-heading text-2xl font-bold"
            disabled={saving}
            autoFocus
          />

          {allTools.length > 0 && (
            <div className="space-y-1.5">
              <SectionHeader icon={<CookingPot className="h-3.5 w-3.5" />} label="Ustensiles" />
              <div className="flex flex-wrap gap-1.5">
                {allTools.map((tool) => {
                  const active = formData.tools.some((current) => current.id === tool.id)
                  return (
                    <Badge
                      key={tool.id}
                      variant={active ? "default" : "outline"}
                      className="cursor-pointer select-none text-xs transition-colors"
                      onClick={() => handleToggleTool(tool)}
                    >
                      {tool.name}
                    </Badge>
                  )
                })}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <SectionHeader icon={<Tag className="h-3.5 w-3.5" />} label="Tags" />
            <div className="flex flex-wrap gap-1.5">
              {formData.tags.length > 0 ? (
                formData.tags.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant="outline"
                    className="cursor-pointer select-none text-xs transition-colors"
                    onClick={() => handleRemoveTag(tag.id)}
                  >
                    {tag.name}
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Aucun tag</p>
              )}
            </div>
            <div className="space-y-2 rounded-[var(--radius-xl)] border border-border/50 bg-secondary/20 p-3">
              <Input
                type="text"
                value={tagSearch}
                onChange={(event) => setTagSearch(event.target.value)}
                placeholder="Rechercher un tag..."
                className="h-9"
                disabled={saving}
              />
              <div className="max-h-36 overflow-y-auto pr-1">
                <div className="flex flex-wrap gap-1.5">
                  {availableTags.map((tag) => (
                    <Badge
                      key={tag.id}
                      variant="outline"
                      className="cursor-pointer text-xs transition-colors hover:border-primary/50 hover:bg-primary/8 hover:text-primary"
                      onClick={() => handleAddTag(tag)}
                    >
                      {tag.name}
                    </Badge>
                  ))}
                  {availableTags.length === 0 && <span className="text-xs text-muted-foreground">Aucun autre tag disponible</span>}
                </div>
              </div>
            </div>
          </div>

          {allCategories.length > 0 && (
            <div className="space-y-1.5">
              <SectionHeader icon={<FolderOpen className="h-3.5 w-3.5" />} label="Categories" />
              <div className="flex flex-wrap gap-1.5">
                {allCategories.map((category) => {
                  const active = formData.categories.some((current) => current.id === category.id)
                  return (
                    <Badge
                      key={category.id}
                      variant={active ? "default" : "outline"}
                      className="cursor-pointer select-none text-xs transition-colors"
                      onClick={() => handleToggleCategory(category)}
                    >
                      {category.name}
                    </Badge>
                  )
                })}
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <SectionHeader icon={<Leaf className="h-3.5 w-3.5" />} label="Saisons" />
            {formData.seasons.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {formData.seasons.map((season) => <SeasonBadge key={season} season={season} size="md" />)}
              </div>
            )}
            <div className="flex flex-wrap gap-1.5">
              {SEASONS.filter((season) => season !== "sans").map((season: Season) => {
                const active = formData.seasons.includes(season)
                return (
                  <Badge
                    key={season}
                    variant={active ? "default" : "outline"}
                    className="cursor-pointer select-none text-xs transition-colors"
                    onClick={() => handleToggleSeason(season)}
                  >
                    {SEASON_LABELS[season]}
                  </Badge>
                )
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <SectionHeader icon={<Clock3 className="h-3.5 w-3.5" />} label="Temps" />
            <div className="flex flex-wrap gap-4">
              <InlineEditDuration label="Preparation" value={formData.prepTime} onChange={(value) => patch({ prepTime: value })} disabled={saving} />
              <InlineEditDuration label="Cuisson" value={formData.performTime} onChange={(value) => patch({ performTime: value })} disabled={saving} />
              <InlineEditDuration label="Total" value={formData.totalTime} onChange={(value) => patch({ totalTime: value })} disabled={saving} />
            </div>
          </div>

          <div className="space-y-2.5 rounded-[var(--radius-xl)] border border-border/50 bg-secondary/30 p-3.5">
            <div className="grid gap-3">
              <div className="grid gap-2 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
                <SectionHeader icon={<FileText className="h-3.5 w-3.5" />} label="Nutrition" />
                <div className="flex justify-start sm:justify-center">
                  <InlineEditCompactNumber
                    label="Calories"
                    value={String(formData.nutrition.calories ?? "")}
                    unit="kcal"
                    placeholder="-"
                    onChange={(nextValue) => patch({ nutrition: { ...formData.nutrition, calories: nextValue } })}
                    disabled={saving}
                  />
                </div>
                <div className="hidden sm:block" />
              </div>

              {NUTRITION_LAYOUT.map((row, index) => (
                <div key={index} className={row.length >= 4 ? "grid gap-1.5 sm:grid-cols-4" : "grid gap-1.5 sm:grid-cols-2"}>
                  {row.map(({ key, label, unit }) => (
                    <InlineEditCompactNumber
                      key={key}
                      label={label}
                      value={String(formData.nutrition[key] ?? "")}
                      unit={unit}
                      placeholder="-"
                      onChange={(nextValue) => patch({ nutrition: { ...formData.nutrition, [key]: nextValue } })}
                      disabled={saving}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>

          <SectionHeader icon={<FileText className="h-3.5 w-3.5" />} label="Description" />
          <InlineEditText
            value={formData.description}
            onChange={(value) => patch({ description: value })}
            placeholder="Ajouter une description..."
            multiline
            rows={3}
            as="p"
            className="text-sm leading-relaxed text-muted-foreground"
            disabled={saving}
          />
        </div>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h2 className="font-heading text-lg font-bold tracking-tight">Ingredients</h2>
              <InlineEditCompactNumber
                label=""
                value={formData.recipeServings}
                unit={Number(formData.recipeServings || "0") > 1 ? "portions" : "portion"}
                placeholder="1"
                onChange={(value) => patch({ recipeServings: value })}
                disabled={saving}
                step="1"
                inputMode="numeric"
              />
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addIngredient} disabled={saving} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              Ajouter
            </Button>
          </div>

          <div className="hidden items-center gap-2 px-1 sm:grid sm:grid-cols-[16px_70px_1fr_1fr_1.5fr_32px]">
            <span />
            <span className="text-xs font-medium text-muted-foreground">Qte</span>
            <span className="text-xs font-medium text-muted-foreground">Unite</span>
            <span className="text-xs font-medium text-muted-foreground">Ingredient</span>
            <span className="text-xs font-medium text-muted-foreground">Notes</span>
            <span />
          </div>

          <div className="space-y-2">
            {formData.recipeIngredient.map((ingredient, index) => (
              <div key={index} className="grid grid-cols-[16px_55px_1fr_1fr_32px] items-center gap-2 sm:grid-cols-[16px_70px_1fr_1fr_1.5fr_32px]">
                <GripVertical className="h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder="Qte"
                  value={ingredient.quantity}
                  onChange={(event) => updateIngredientField(index, { quantity: event.target.value })}
                  disabled={saving}
                  className="min-w-0 px-2"
                  aria-label={`Quantite ingredient ${index + 1}`}
                />
                <Combobox
                  value={ingredient.unit}
                  onChange={(value, option) => updateIngredientField(index, { unit: value, unitId: option?.id })}
                  options={unitOptions}
                  placeholder="Unite..."
                  disabled={saving}
                  inputClassName="bg-white dark:bg-zinc-900"
                  aria-label={`Unite ingredient ${index + 1}`}
                />
                <Combobox
                  value={ingredient.food}
                  onChange={(value, option) =>
                    updateIngredientField(index, {
                      food: value,
                      foodId: option && option.id !== "__create__" ? option.id : undefined,
                    })}
                  options={foodOptions}
                  placeholder="Ingredient..."
                  disabled={saving}
                  allowCreate
                  createLabel={(value) => `Creer "${value}"`}
                  inputClassName="bg-white dark:bg-zinc-900"
                  aria-label={`Ingredient ${index + 1}`}
                />
                <Input
                  type="text"
                  placeholder="Notes..."
                  value={ingredient.note}
                  onChange={(event) => updateIngredientField(index, { note: event.target.value })}
                  disabled={saving}
                  className="hidden min-w-0 px-2 sm:block"
                  aria-label={`Notes ingredient ${index + 1}`}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeIngredient(index)}
                  disabled={saving || formData.recipeIngredient.length <= 1}
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  aria-label={`Supprimer ingredient ${index + 1}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-heading text-lg font-bold tracking-tight">Instructions</h2>
            <Button type="button" variant="outline" size="sm" onClick={addInstruction} disabled={saving} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              Ajouter
            </Button>
          </div>

          <ol className="space-y-4">
            {formData.recipeInstructions.map((step, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/8 text-[11px] font-bold text-primary">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <textarea
                    value={step.text}
                    onChange={(event) => updateInstruction(index, event.target.value)}
                    placeholder={`Etape ${index + 1}...`}
                    disabled={saving}
                    rows={2}
                    className={[
                      "w-full resize-none rounded-md border-transparent bg-transparent px-2 py-1 text-sm leading-relaxed text-muted-foreground",
                      "placeholder:text-muted-foreground/50 focus-visible:border-input focus-visible:outline-none",
                      "focus-visible:bg-background focus-visible:ring-1 focus-visible:ring-ring",
                      "transition-colors hover:bg-muted/30 disabled:cursor-not-allowed disabled:opacity-50",
                    ].join(" ")}
                    aria-label={`Etape ${index + 1}`}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeInstruction(index)}
                  disabled={saving}
                  className="mt-0.5 h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </li>
            ))}
          </ol>
        </section>

        <div className="sticky bottom-4 flex justify-end gap-2 rounded-[var(--radius-xl)] border border-border bg-background/95 px-4 py-3 shadow-lg backdrop-blur-sm">
          <Button variant="outline" size="sm" onClick={() => navigate("/recipes")} disabled={saving}>
            Annuler
          </Button>
          <Button size="sm" onClick={() => void handleCreate()} disabled={saving || !formData.name.trim()} className="gap-1.5">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creation...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Creer la recette
              </>
            )}
          </Button>
        </div>
      </article>
    </div>
  )
}
