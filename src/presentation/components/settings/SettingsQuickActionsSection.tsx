import { useState } from "react"
import { Flame, Loader2, RefreshCw, UtensilsCrossed } from "lucide-react"

import { cn } from "@/lib/utils.ts"
import { useSettingsCalorieTags, useSettingsIngredientInstructionLinks, useSettingsRecipeSourceSync } from "hooks/settings"
import { Button } from "components/ui"
import { CalorieTagDetailsDialog } from "./CalorieTagDetailsDialog.tsx"
import { CollapsibleSection } from "./CollapsibleSection.tsx"
import { IngredientLinkDetailsDialog } from "./IngredientLinkDetailsDialog.tsx"
import { RecipeSourceSyncDetailsDialog } from "./RecipeSourceSyncDetailsDialog.tsx"
import { SettingsConfirmDialog } from "./SettingsConfirmDialog.tsx"
import { RecipeSyncDialog } from "components/recipeDetail"

type QuickActionKey = "calorieTags" | "ingredientLinks" | "recipeSourceSync" | null

function QuickActionReportShell({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="space-y-3 rounded-[var(--radius-xl)] border border-border/50 bg-secondary/20 p-4">
      {children}
    </div>
  )
}

function QuickActionProgress({
  processed,
  total,
  progress,
  primaryLabel,
  secondaryLabel,
}: {
  processed: number
  total: number
  progress: number
  primaryLabel: string
  secondaryLabel: string
}) {
  return (
    <>
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-medium text-foreground">{primaryLabel}</span>
        <span className="text-muted-foreground">{secondaryLabel}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-border/60">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        {processed}/{total} recette{total > 1 ? "s" : ""} traitee{total > 1 ? "s" : ""}
      </p>
    </>
  )
}

export function SettingsQuickActionsSection() {
  const calorieTags = useSettingsCalorieTags()
  const ingredientInstructionLinks = useSettingsIngredientInstructionLinks()
  const recipeSourceSync = useSettingsRecipeSourceSync()
  const [open, setOpen] = useState(false)
  const [activeAction, setActiveAction] = useState<QuickActionKey>(null)

  const handleActionClick = (action: Exclude<QuickActionKey, null>, onOpenConfirm: () => void) => {
    setActiveAction(action)
    calorieTags.setDetailsDialogOpen(false)
    ingredientInstructionLinks.setDetailsDialogOpen(false)
    recipeSourceSync.setDetailsDialogOpen(false)
    onOpenConfirm()
  }

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (!nextOpen) {
      setActiveAction(null)
      calorieTags.setDetailsDialogOpen(false)
      ingredientInstructionLinks.setDetailsDialogOpen(false)
      recipeSourceSync.setDetailsDialogOpen(false)
    }
  }

  const showCalorieReport = activeAction === "calorieTags" && calorieTags.status.state !== "idle"
  const showIngredientReport = activeAction === "ingredientLinks" && ingredientInstructionLinks.status.state !== "idle"
  const showRecipeSourceSyncReport = activeAction === "recipeSourceSync" && recipeSourceSync.status.state !== "idle"

  return (
    <>
      <CalorieTagDetailsDialog
        open={calorieTags.detailsDialogOpen}
        onOpenChange={calorieTags.setDetailsDialogOpen}
        details={calorieTags.details}
        onRecipeOpen={calorieTags.openRecipe}
      />

      <IngredientLinkDetailsDialog
        open={ingredientInstructionLinks.detailsDialogOpen}
        onOpenChange={ingredientInstructionLinks.setDetailsDialogOpen}
        details={ingredientInstructionLinks.details}
        onRecipeOpen={ingredientInstructionLinks.openRecipe}
      />

      <RecipeSourceSyncDetailsDialog
        open={recipeSourceSync.detailsDialogOpen}
        onOpenChange={recipeSourceSync.setDetailsDialogOpen}
        details={recipeSourceSync.details}
        onRecipeOpen={recipeSourceSync.openRecipe}
      />

      <RecipeSyncDialog
        open={recipeSourceSync.reviewDialogOpen}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            recipeSourceSync.skipReview()
          }
        }}
        recipeName={recipeSourceSync.pendingReview?.recipeName ?? ""}
        sourceUrl={recipeSourceSync.pendingReview?.sourceUrl ?? ""}
        loading={false}
        applying={false}
        error={null}
        fields={recipeSourceSync.pendingReview?.fields ?? []}
        selectedFieldIds={recipeSourceSync.pendingReview?.syncSelection ?? []}
        onToggleField={recipeSourceSync.toggleSyncField}
        onRefresh={() => {}}
        onConfirm={recipeSourceSync.confirmReview}
        onCancel={recipeSourceSync.skipReview}
        cancelLabel="Passer cette recette"
        confirmLabel="Appliquer et continuer"
      />

      <SettingsConfirmDialog
        open={calorieTags.confirmOpen}
        onOpenChange={calorieTags.setConfirmOpen}
        title="Ajouter les tags calories ?"
        description="La synchronisation va parcourir toutes les recettes, relire leur nutrition et mettre a jour les tags calories quand necessaire."
        note="Cette action peut prendre un peu de temps sur une grosse bibliotheque de recettes."
        confirmLabel="Lancer la synchronisation"
        confirmIcon={<Flame className="h-4 w-4" />}
        onConfirm={() => {
          void calorieTags.run()
        }}
      />

      <SettingsConfirmDialog
        open={ingredientInstructionLinks.confirmOpen}
        onOpenChange={ingredientInstructionLinks.setConfirmOpen}
        title="Analyser et lier les ingredients aux etapes ?"
        description="Le traitement va parcourir les recettes, attribuer des referenceId manquants aux ingredients puis recalculer les liaisons ingredient-etape quand c'est necessaire."
        note="Les recettes deja a jour seront ignorees. Les erreurs seront listees dans le rapport detaille."
        confirmLabel="Lancer l'analyse"
        confirmIcon={<UtensilsCrossed className="h-4 w-4" />}
        onConfirm={() => {
          void ingredientInstructionLinks.run()
        }}
      />

      <SettingsConfirmDialog
        open={recipeSourceSync.confirmOpen}
        onOpenChange={recipeSourceSync.setConfirmOpen}
        title="Synchroniser toutes les recettes depuis leur source ?"
        description="Le traitement va parcourir toutes les recettes. Si aucune difference n'est detectee, la recette sera ignoree. Sinon, une fenetre de validation s'ouvrira pour vous laisser appliquer ou refuser les changements avant de reprendre automatiquement la suite."
        note="Le traitement se met en pause a chaque recette qui a des differences, puis reprend des que vous validez ou passez la recette."
        confirmLabel="Lancer la synchronisation"
        confirmIcon={<RefreshCw className="h-4 w-4" />}
        onConfirm={() => {
          void recipeSourceSync.run()
        }}
      />

      <CollapsibleSection
        open={open}
        onOpenChange={handleOpenChange}
        icon={<Flame className="h-4 w-4 text-primary" />}
        iconBg="bg-[rgba(234,88,12,0.10)]"
        title="Actions rapides"
        subtitle="Operations automatiques sur les recettes"
      >
        <div className="space-y-4">
          <div className="rounded-[var(--radius-xl)] border border-border/50 bg-secondary/20 p-4">
            <p className="text-sm text-muted-foreground">
              Lancez une action de maintenance sur la bibliotheque. Le rapport visible se vide quand vous changez d&apos;action ou quand ce bloc est replie.
            </p>
          </div>

          {showCalorieReport && calorieTags.status.state !== "idle" && (
            <QuickActionReportShell>
              <QuickActionProgress
                processed={calorieTags.status.processed}
                total={calorieTags.status.total}
                progress={calorieTags.progress}
                primaryLabel="Synchronisation des tags calories"
                secondaryLabel={`${calorieTags.status.added} ajoute${calorieTags.status.added > 1 ? "s" : ""}, ${calorieTags.status.updated} mis a jour`}
              />

              {calorieTags.status.currentRecipeName && (
                <p className="text-sm text-muted-foreground">
                  Recette en cours : <span className="font-medium text-foreground">{calorieTags.status.currentRecipeName}</span>
                </p>
              )}
              {calorieTags.status.lastMessage && (
                <p className="text-sm text-muted-foreground">{calorieTags.status.lastMessage}</p>
              )}

              <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                <p>Tags ajoutes : {calorieTags.status.added}</p>
                <p>Tags mis a jour : {calorieTags.status.updated}</p>
                <p>Calories manquantes : {calorieTags.status.missingCalories}</p>
                <p>Recettes passees : {calorieTags.status.skipped}</p>
                <p>Erreurs : {calorieTags.status.errors}</p>
                <p>Total analyse : {calorieTags.status.processed}</p>
              </div>

              {calorieTags.detailsCount > 0 && (
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => calorieTags.setDetailsDialogOpen(true)}
                  >
                    Ouvrir le rapport complet
                  </Button>
                </div>
              )}

              {calorieTags.status.state === "done" && (
                <p className="text-sm text-[rgba(22,163,74,1)]">Synchronisation terminee.</p>
              )}
              {calorieTags.status.state === "error" && (
                <p className="text-sm text-destructive">{calorieTags.status.message}</p>
              )}
            </QuickActionReportShell>
          )}

          {showIngredientReport && ingredientInstructionLinks.status.state !== "idle" && (
            <QuickActionReportShell>
              <QuickActionProgress
                processed={ingredientInstructionLinks.status.processed}
                total={ingredientInstructionLinks.status.total}
                progress={ingredientInstructionLinks.progress}
                primaryLabel="Analyse des liaisons ingredients / etapes"
                secondaryLabel={`${ingredientInstructionLinks.status.updated} recette${ingredientInstructionLinks.status.updated > 1 ? "s" : ""} mise${ingredientInstructionLinks.status.updated > 1 ? "s" : ""} a jour`}
              />

              {ingredientInstructionLinks.status.currentRecipeName && (
                <p className="text-sm text-muted-foreground">
                  Recette en cours : <span className="font-medium text-foreground">{ingredientInstructionLinks.status.currentRecipeName}</span>
                </p>
              )}
              {ingredientInstructionLinks.status.lastMessage && (
                <p className="text-sm text-muted-foreground">{ingredientInstructionLinks.status.lastMessage}</p>
              )}

              <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                <p>Recettes mises a jour : {ingredientInstructionLinks.status.updated}</p>
                <p>Recettes deja a jour : {ingredientInstructionLinks.status.alreadyUpToDate}</p>
                <p>Ignorees sans instructions : {ingredientInstructionLinks.status.skippedNoInstructions}</p>
                <p>Ignorees sans ingredients : {ingredientInstructionLinks.status.skippedNoIngredients}</p>
                <p>Erreurs : {ingredientInstructionLinks.status.errors}</p>
                <p>Total analyse : {ingredientInstructionLinks.status.processed}</p>
              </div>

              {ingredientInstructionLinks.detailsCount > 0 && (
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => ingredientInstructionLinks.setDetailsDialogOpen(true)}
                  >
                    Ouvrir le rapport complet
                  </Button>
                </div>
              )}

              {ingredientInstructionLinks.status.state === "done" && (
                <p className="text-sm text-[rgba(22,163,74,1)]">Liaison automatique terminee.</p>
              )}
              {ingredientInstructionLinks.status.state === "error" && (
                <p className="text-sm text-destructive">{ingredientInstructionLinks.status.message}</p>
              )}
            </QuickActionReportShell>
          )}

          {showRecipeSourceSyncReport && recipeSourceSync.status.state !== "idle" && (
            <QuickActionReportShell>
              <QuickActionProgress
                processed={recipeSourceSync.status.processed}
                total={recipeSourceSync.status.total}
                progress={recipeSourceSync.progress}
                primaryLabel="Synchronisation des recettes par source"
                secondaryLabel={`${recipeSourceSync.status.updated} synchronisee${recipeSourceSync.status.updated > 1 ? "s" : ""}, ${recipeSourceSync.status.errors} erreur${recipeSourceSync.status.errors > 1 ? "s" : ""}`}
              />

              {recipeSourceSync.status.currentRecipeName && (
                <p className="text-sm text-muted-foreground">
                  Recette en cours : <span className="font-medium text-foreground">{recipeSourceSync.status.currentRecipeName}</span>
                </p>
              )}
              {recipeSourceSync.status.lastMessage && (
                <p className="text-sm text-muted-foreground">{recipeSourceSync.status.lastMessage}</p>
              )}

              <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                <p>Recettes synchronisees : {recipeSourceSync.status.updated}</p>
                <p>Ignorees sans source : {recipeSourceSync.status.skippedNoSource}</p>
                <p>Ignorees sans difference : {recipeSourceSync.status.skippedNoChanges}</p>
                <p>Ignorees manuellement : {recipeSourceSync.status.skippedDeclined}</p>
                <p>Erreurs : {recipeSourceSync.status.errors}</p>
                <p>Total analyse : {recipeSourceSync.status.processed}</p>
              </div>

              {recipeSourceSync.detailsCount > 0 && (
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => recipeSourceSync.setDetailsDialogOpen(true)}
                  >
                    Ouvrir le rapport complet
                  </Button>
                </div>
              )}

              {recipeSourceSync.status.state === "waitingReview" && (
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Synchronisation en pause : validation en attente.
                </p>
              )}
              {recipeSourceSync.status.state === "done" && (
                <p className="text-sm text-[rgba(22,163,74,1)]">Synchronisation terminee.</p>
              )}
              {recipeSourceSync.status.state === "error" && (
                <p className="text-sm text-destructive">{recipeSourceSync.status.message}</p>
              )}
            </QuickActionReportShell>
          )}

          <div className="grid gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleActionClick("calorieTags", () => calorieTags.setConfirmOpen(true))}
              disabled={calorieTags.status.state === "running"}
              className={cn(
                "w-full justify-start gap-2",
                calorieTags.status.state === "running" && "bg-secondary text-muted-foreground",
              )}
            >
              {calorieTags.status.state === "running" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Synchronisation en cours...
                </>
              ) : (
                <>
                  <Flame className="h-4 w-4" />
                  Ajouter les tags calories
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => handleActionClick("ingredientLinks", () => ingredientInstructionLinks.setConfirmOpen(true))}
              disabled={ingredientInstructionLinks.status.state === "running"}
              className={cn(
                "w-full justify-start gap-2",
                ingredientInstructionLinks.status.state === "running" && "bg-secondary text-muted-foreground",
              )}
            >
              {ingredientInstructionLinks.status.state === "running" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyse des liaisons en cours...
                </>
              ) : (
                <>
                  <UtensilsCrossed className="h-4 w-4" />
                  Lier automatiquement les ingredients aux etapes
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => handleActionClick("recipeSourceSync", () => recipeSourceSync.setConfirmOpen(true))}
              disabled={recipeSourceSync.status.state === "running" || recipeSourceSync.status.state === "waitingReview"}
              className={cn(
                "w-full justify-start gap-2",
                (recipeSourceSync.status.state === "running" || recipeSourceSync.status.state === "waitingReview") && "bg-secondary text-muted-foreground",
              )}
            >
              {recipeSourceSync.status.state === "running" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Synchronisation en cours...
                </>
              ) : recipeSourceSync.status.state === "waitingReview" ? (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Validation en attente...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Synchroniser toutes les recettes
                </>
              )}
            </Button>
          </div>
        </div>
      </CollapsibleSection>
    </>
  )
}
