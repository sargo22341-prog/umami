import type { CalorieTagBatchDetails } from "./settingsPage.types.ts"
import { SettingsBatchDetailsDialog } from "./SettingsBatchDetailsDialog.tsx"

type CalorieTagDetailsDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  details: CalorieTagBatchDetails
  onRecipeOpen: (slug: string) => void
}

export function CalorieTagDetailsDialog({
  open,
  onOpenChange,
  details,
  onRecipeOpen,
}: CalorieTagDetailsDialogProps) {
  return (
    <SettingsBatchDetailsDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Rapport complet des tags calories"
      description="Retrouve la liste des recettes traitees pour verifier les tags ajoutes, mis a jour, ignores ou en erreur."
      sections={[
        {
          id: "errors",
          title: "Erreurs",
          description: "Recettes en echec pendant la synchronisation automatique.",
          items: details.errors,
          emptyLabel: "Aucune erreur recensee.",
        },
        {
          id: "added",
          title: "Tags ajoutes",
          description: "Recettes sur lesquelles un tag calorie a ete cree.",
          items: details.added,
          emptyLabel: "Aucun tag ajoute.",
        },
        {
          id: "updated",
          title: "Tags mis a jour",
          description: "Recettes dont le tag calorie existant a ete corrige.",
          items: details.updated,
          emptyLabel: "Aucun tag mis a jour.",
        },
        {
          id: "missingCalories",
          title: "Calories manquantes",
          description: "Recettes ignorees faute de calories exploitables dans la nutrition.",
          items: details.missingCalories,
          emptyLabel: "Aucune recette sans calories exploitables.",
        },
        {
          id: "skipped",
          title: "Recettes passees",
          description: "Recettes deja conformes qui n'ont pas demande de modification.",
          items: details.skipped,
          emptyLabel: "Aucune recette passee.",
        },
      ]}
      onRecipeOpen={onRecipeOpen}
    />
  )
}
