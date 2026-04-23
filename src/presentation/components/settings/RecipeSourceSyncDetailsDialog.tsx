import type { RecipeSourceSyncBatchDetails } from "./settingsPage.types.ts"
import { SettingsBatchDetailsDialog } from "./SettingsBatchDetailsDialog.tsx"

type RecipeSourceSyncDetailsDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  details: RecipeSourceSyncBatchDetails
  onRecipeOpen: (slug: string) => void
}

export function RecipeSourceSyncDetailsDialog({
  open,
  onOpenChange,
  details,
  onRecipeOpen,
}: RecipeSourceSyncDetailsDialogProps) {
  return (
    <SettingsBatchDetailsDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Details de la synchronisation des recettes"
      description="Retrouve rapidement les recettes synchronisees, ignorees ou en erreur pour verifier le resultat."
      sections={[
        {
          id: "updated",
          title: "Synchronisees",
          description: "Recettes mises a jour apres validation des changements detectes.",
          items: details.updated,
          emptyLabel: "Aucune recette synchronisee.",
        },
        {
          id: "skippedNoChanges",
          title: "Ignorees sans changement",
          description: "Recettes deja alignees avec leur source, donc laissees telles quelles.",
          items: details.skippedNoChanges,
          emptyLabel: "Aucune recette ignoree pour absence de changement.",
        },
        {
          id: "skippedDeclined",
          title: "Ignorees manuellement",
          description: "Recettes pour lesquelles les changements proposes ont ete refuses.",
          items: details.skippedDeclined,
          emptyLabel: "Aucune recette ignoree manuellement.",
        },
        {
          id: "skippedNoSource",
          title: "Ignorees sans source",
          description: "Recettes sans URL source exploitable pour lancer la synchronisation.",
          items: details.skippedNoSource,
          emptyLabel: "Aucune recette ignoree pour absence de source.",
        },
        {
          id: "errors",
          title: "Erreurs",
          description: "Recettes qui ont echoue pendant l'analyse ou l'application de la synchronisation.",
          items: details.errors,
          emptyLabel: "Aucune erreur recensee.",
        },
      ]}
      onRecipeOpen={onRecipeOpen}
    />
  )
}
