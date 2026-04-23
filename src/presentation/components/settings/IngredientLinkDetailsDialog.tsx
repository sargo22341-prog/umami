import type { IngredientLinkBatchDetails } from "./settingsPage.types.ts"
import { SettingsBatchDetailsDialog } from "./SettingsBatchDetailsDialog.tsx"

type IngredientLinkDetailsDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  details: IngredientLinkBatchDetails
  onRecipeOpen: (slug: string) => void
}

export function IngredientLinkDetailsDialog({
  open,
  onOpenChange,
  details,
  onRecipeOpen,
}: IngredientLinkDetailsDialogProps) {
  return (
    <SettingsBatchDetailsDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Details des recettes a verifier"
      description="Ouvre une recette dans l'onglet courant ou dans un nouvel onglet pour verifier plusieurs cas sans relancer l'analyse."
      sections={[
        {
          id: "errors",
          title: "Erreurs",
          description: "Recettes en echec pendant le traitement automatique.",
          items: details.errors,
          emptyLabel: "Aucune erreur recensee.",
        },
        {
          id: "skippedNoInstructions",
          title: "Ignorees sans instructions",
          description: "Recettes ignorees car aucune instruction ou etape n'a ete trouvee.",
          items: details.skippedNoInstructions,
          emptyLabel: "Aucune recette ignoree pour absence d'instructions.",
        },
        {
          id: "skippedNoIngredients",
          title: "Ignorees sans ingredients",
          description: "Recettes ignorees car aucun ingredient exploitable n'a ete trouve.",
          items: details.skippedNoIngredients,
          emptyLabel: "Aucune recette ignoree pour absence d'ingredients.",
        },
      ]}
      onRecipeOpen={onRecipeOpen}
    />
  )
}
