// React
import { useState } from "react"

// Icons (lucide)
import { Calendar, RefreshCw, Zap, Layers } from "lucide-react"

// Utils
import { cn } from "@/lib/utils.ts"

// Hooks - Stats
import { useStats, type StatsPeriod } from "hooks/stats/useStats.ts"

// Components - Common
import { RecipeDetailModal } from "components/common/recipe/RecipeDetailModal.tsx"

// Components - Stats
import { StatCard, CatalogueCoverage, CategoryBars, NeverPlannedList, RankedList } from "components/stats"

const PERIODS: { value: StatsPeriod; label: string }[] = [
  { value: "30d", label: "30 jours" },
  { value: "90d", label: "90 jours" },
  { value: "12m", label: "12 mois" },
]

export function StatsPage() {
  const { period, setPeriod, stats, loading, error } = useStats()
  const [selectedRecipeSlug, setSelectedRecipeSlug] = useState<string | null>(null)

  return (
    <>
      <RecipeDetailModal slug={selectedRecipeSlug} onOpenChange={(open) => !open && setSelectedRecipeSlug(null)} />

      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold">Statistiques</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">Analyse de vos habitudes culinaires</p>
          </div>

          <div className="flex gap-1 rounded-[var(--radius-xl)] border border-border/50 bg-secondary/50 p-1">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setPeriod(p.value)}
                className={cn(
                  "rounded-xl px-3 py-1.5 text-sm font-semibold transition-all",
                  period === p.value
                    ? "bg-card text-foreground shadow-subtle"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="rounded-[var(--radius-xl)] border border-destructive/20 bg-destructive/8 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        {loading && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-28 animate-pulse rounded-[var(--radius-2xl)] border border-border/40 bg-muted" />
              ))}
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-48 animate-pulse rounded-[var(--radius-2xl)] border border-border/40 bg-muted" />
              ))}
            </div>
          </div>
        )}

        {!loading && stats && (
          <div className="space-y-6">
            {stats.totalMeals === 0 && (
              <div className="rounded-[var(--radius-2xl)] border border-border/50 bg-card p-10 text-center shadow-subtle">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary">
                  <Calendar className="h-7 w-7 text-muted-foreground" />
                </div>
                <p className="font-heading text-lg font-bold">Aucun repas planifié sur cette période</p>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  Commencez à remplir votre planning pour voir apparaître des statistiques.
                </p>
              </div>
            )}

            {stats.totalMeals > 0 && (
              <>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <StatCard label="Repas planifiés" value={stats.totalMeals} icon={Calendar} accent="bg-primary/10 text-primary" />
                  <StatCard
                    label="Recettes uniques"
                    value={stats.uniqueRecipesCount}
                    sub="recettes différentes"
                    icon={Layers}
                    accent="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                  />
                  <StatCard
                    label="% restes"
                    value={`${stats.leftoverPercentage}%`}
                    sub="même plat consécutif"
                    icon={RefreshCw}
                    accent="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                  />
                  <StatCard
                    label="Streak"
                    value={stats.streak}
                    sub={stats.streak === 1 ? "semaine complète" : "semaines complètes"}
                    icon={Zap}
                    accent="bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400"
                  />
                </div>

                <CatalogueCoverage unique={stats.uniqueRecipesCount} total={stats.totalCatalogueRecipes} pct={stats.catalogueCoverage} />

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <RankedList
                    title="Top recettes cuisinées"
                    items={stats.topRecipes.map((tr) => ({
                      label: tr.recipe.name,
                      count: tr.count,
                      sub: tr.recipe.recipeCategory?.map((c) => c.name).join(", "),
                      slug: tr.recipe.slug,
                      onClick: () => setSelectedRecipeSlug(tr.recipe.slug),
                    }))}
                    maxCount={stats.topRecipes[0]?.count ?? 1}
                  />
                  <RankedList
                    title="Top ingrédients consommés"
                    items={stats.topIngredients.map((ti) => ({ label: ti.name, count: ti.count }))}
                    maxCount={stats.topIngredients[0]?.count ?? 1}
                  />
                </div>

                <CategoryBars stats={stats.categoryStats} />

                <NeverPlannedList
                  recipes={stats.neverPlannedRecipes.map((r) => ({ slug: r.slug, name: r.name }))}
                  onRecipeClick={setSelectedRecipeSlug}
                />
              </>
            )}
          </div>
        )}
      </div>
    </>
  )
}
