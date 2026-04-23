// React
import { useEffect, useMemo, useState } from "react"

// Router
import { Link } from "react-router-dom"

// Icons (lucide)
import {
  Loader2, AlertCircle, Heart, ChevronRight, BarChart2, Pencil,
  Mail, Users, Home, Shield,
} from "lucide-react"

// Infrastructure
import { userRepository } from "@/infrastructure/container.ts"

// Types
import type { MealieRecipeOutput } from "@/shared/types/mealie/Recipes.ts"
import type { MealieUserOut } from "@/shared/types/mealie/User.ts"

// Utils
import { cn } from "@/lib/utils.ts"

// Shared utils
import { recipeImageUrl } from "@/shared/utils"

// Hooks
import { useFavoriteRecipes } from "hooks/favorite/useFavoriteRecipesProfile.ts"

// UI Components
import { Button } from "components/ui"

// Components - Common
import { UserAvatar } from "components/common/global/UserAvatar.tsx"
import { RecipeDetailModal } from "components/common/recipe/RecipeDetailModal.tsx"

// Components - Profile
import { EditProfileDialog } from "components/profile/EditProfileDialog.tsx"

export function ProfilePage() {
  const [user, setUser] = useState<MealieUserOut | null>(null)
  const [favoriteRecipes, setFavoriteRecipes] = useState<MealieRecipeOutput[]>([])
  const [selectedRecipeSlug, setSelectedRecipeSlug] = useState<string | null>(null)
  const [editingProfile, setEditingProfile] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { getFavoriteRecipes } = useFavoriteRecipes()

  useEffect(() => {
    let cancelled = false

    const loadProfile = async () => {
      setLoading(true)
      setError(null)
      try {
        const [profile, favorites] = await Promise.all([
          userRepository.getSelf(),
          getFavoriteRecipes({ limit: 3, order: "favorite" }),
        ])

        if (cancelled) return
        setUser(profile)
        setFavoriteRecipes(favorites)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Impossible de charger le profil.")
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadProfile()
    return () => {
      cancelled = true
    }
  }, [getFavoriteRecipes])

  const displayName = useMemo(() => {
    if (!user) return "Utilisateur"
    return user.fullName?.trim() || user.username?.trim() || "Utilisateur"
  }, [user])

  return (
    <div className="mx-auto max-w-5xl space-y-6">

      <RecipeDetailModal
        slug={selectedRecipeSlug}
        onOpenChange={(open) => !open && setSelectedRecipeSlug(null)}
      />
      
      <EditProfileDialog
        open={editingProfile}
        onOpenChange={setEditingProfile}
        user={user}
        onSaved={(nextUser) => setUser(nextUser)}
      />
      
      <div className="sticky top-0 z-10 -mx-4 -mt-5 border-b border-border/40 bg-background/95 px-4 pb-4 pt-5 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-full",
              "bg-primary/10 text-primary",
            )}
          >
            <UserAvatar
              userId={user?.id}
              cacheBust={user?.cacheKey}
              alt={displayName}
              className="h-12 w-12 rounded-full object-cover"
              iconClassName="h-5 w-5"
            />
          </div>
          <div className="min-w-0">
            <p className="font-heading text-xl font-bold leading-tight">{displayName}</p>
            {user?.username && (
              <p className="truncate text-sm text-muted-foreground">@{user.username}</p>
            )}
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-14">
          <Loader2 className="h-7 w-7 animate-spin text-muted-foreground/50" />
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 rounded-[var(--radius-xl)] border border-destructive/20 bg-destructive/8 p-4 text-destructive">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {!loading && !error && user && (
        <>
          <section className="rounded-[var(--radius-2xl)] border border-border/50 bg-card p-4 shadow-subtle">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold">Mon compte Mealie</p>
                {user.admin && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-primary">
                    Admin
                  </span>
                )}
              </div>
              <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => setEditingProfile(true)}>
                <Pencil className="h-4 w-4" />
                Editer
              </Button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">Email</p>
                  <p className="break-all text-foreground">{user.email}</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Users className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">Groupe</p>
                  <p className="text-foreground">{user.group}</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Home className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">Foyer</p>
                  <p className="text-foreground">{user.household}</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Shield className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">Permissions</p>
                  <p className="text-foreground">
                    {user.canOrganize ? "Organisation active" : "Accès standard"}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[var(--radius-2xl)] border border-border/50 bg-card p-4 shadow-subtle">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-primary" />
                <p className="text-sm font-bold">Mes favoris</p>
              </div>
              <Link
                to="/favorites"
                className="text-xs font-semibold text-primary transition-opacity hover:opacity-80"
              >
                Voir tout
              </Link>
            </div>

            <div className="space-y-3">
              {favoriteRecipes.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune recette favorite pour le moment.</p>
              ) : (
                favoriteRecipes.map((recipe) => (
                  <button
                    key={recipe.id}
                    type="button"
                    onClick={() => setSelectedRecipeSlug(recipe.slug)}
                    className="flex w-full items-center gap-3 rounded-[var(--radius-xl)] border border-border/40 bg-background/60 p-2.5 text-left transition-colors hover:bg-secondary/70"
                  >
                    <img
                      src={recipeImageUrl(recipe, "min-original")}
                      alt={recipe.name}
                      className="h-14 w-14 shrink-0 rounded-[var(--radius-lg)] object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-medium leading-snug">{recipe.name}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </section>

          <section className="rounded-[var(--radius-2xl)] border border-border/50 bg-card p-4 shadow-subtle">
            <div className="mb-3 flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-primary" />
              <p className="text-sm font-bold">Statistiques</p>
            </div>

            <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
              Retrouve ton activité cuisine, tes recettes les plus planifiées et les tendances de ton usage.
            </p>

            <Button asChild className="w-full justify-between">
              <Link to="/stats">
                Ouvrir mes statistiques
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          </section>

          <section className="rounded-[var(--radius-2xl)] border border-border/50 bg-card p-4 shadow-subtle">
            <div className="mb-3 flex items-center gap-2">
              <Home className="h-4 w-4 text-primary" />
              <p className="text-sm font-bold">Paramètres</p>
            </div>

            <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
              Gère ton thème, ta session et les options générales de l'application.
            </p>

            <Button asChild variant="outline" className="w-full justify-between">
              <Link to="/settings">
                Ouvrir les paramètres
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          </section>
        </>
      )}
    </div>
  )
}
