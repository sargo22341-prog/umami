import { useMemo, useState } from "react"
import { AlertTriangle, Loader2, Sparkles } from "lucide-react"
import {
  Dialog, Button, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "components/ui"
import { toggleValueInArray, type TagMergeRecommendation } from "@/shared/utils"

interface AutoCleanTagsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  recommendations: TagMergeRecommendation[]
  loading?: boolean
  onConfirm: (selections: Array<{ key: string; winnerTagId: string }>) => Promise<void> | void
}

export function AutoCleanTagsDialog({
  open,
  onOpenChange,
  recommendations,
  loading = false,
  onConfirm,
}: AutoCleanTagsDialogProps) {
  const [selectedKeys, setSelectedKeys] = useState<string[]>([])
  const [winnerByKey, setWinnerByKey] = useState<Record<string, string>>({})

  const selectedCount = selectedKeys.length
  const allSelected = recommendations.length > 0 && recommendations.every((group) => selectedKeys.includes(group.key))

  const sortedRecommendations = useMemo(
    () => [...recommendations].sort((a, b) => a.winnerTag.name.localeCompare(b.winnerTag.name, "fr", { sensitivity: "base" })),
    [recommendations],
  )

  const toggleGroup = (key: string) => {
    setSelectedKeys((prev) => toggleValueInArray(prev, key))
  }

  const toggleAll = () => {
    setSelectedKeys(allSelected ? [] : sortedRecommendations.map((group) => group.key))
  }

  const handleConfirm = async () => {
    if (selectedKeys.length === 0) return
    await onConfirm(
      selectedKeys.map((key) => {
        const recommendation = sortedRecommendations.find((group) => group.key === key)
        return {
          key,
          winnerTagId: winnerByKey[key] ?? recommendation?.winnerTag.id ?? "",
        }
      }).filter((selection) => selection.winnerTagId),
    )
    setSelectedKeys([])
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-2xl sm:w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Auto clean des tags
          </DialogTitle>
          <DialogDescription>
            Umami a detecte des tags probablement doublons, souvent en singulier/pluriel.
            Choisis les recommandations a appliquer.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-[var(--radius-xl)] border border-amber-300/50 bg-amber-50/70 p-4 text-sm text-amber-900 dark:border-amber-700/40 dark:bg-amber-950/20 dark:text-amber-200">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>Attention, les fusions appliquees ici sont irreversibles.</p>
          </div>
        </div>

        {sortedRecommendations.length === 0 ? (
          <div className="rounded-[var(--radius-xl)] border border-border/50 bg-secondary/20 px-4 py-6 text-center text-sm text-muted-foreground">
            Aucune fusion recommandee pour le moment.
          </div>
        ) : (
          <div className="space-y-3">
            <label className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-border/40 bg-card px-3 py-3 text-sm">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                className="h-4 w-4 rounded border-border text-primary focus:ring-ring"
              />
              <span>Selectionner toutes les recommandations</span>
            </label>

            <div className="max-h-[26rem] space-y-3 overflow-y-auto pr-1">
              {sortedRecommendations.map((group) => (
                <label
                  key={group.key}
                  className="block rounded-[var(--radius-xl)] border border-border/50 bg-card p-4"
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedKeys.includes(group.key)}
                      onChange={() => toggleGroup(group.key)}
                      className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-ring"
                    />
                    <div className="min-w-0 flex-1 space-y-2">
                      <p className="text-sm font-semibold text-foreground">
                        Fusion recommandee vers{" "}
                        <span className="text-primary">
                          {group.tags.find((tag) => tag.id === (winnerByKey[group.key] ?? group.winnerTag.id))?.name ?? group.winnerTag.name}
                        </span>
                      </p>
                      <div className="space-y-1">
                        {group.tags.map((tag) => (
                          <button
                            key={tag.id}
                            type="button"
                            onClick={() =>
                              setWinnerByKey((prev) => ({
                                ...prev,
                                [group.key]: tag.id,
                              }))
                            }
                            className="flex w-full items-center gap-2 rounded-[var(--radius-md)] px-2 py-1 text-left text-sm text-muted-foreground transition-colors hover:bg-secondary/60"
                          >
                            <span className="inline-block h-1.5 w-1.5 rounded-full bg-border" />
                            <span
                              className={
                                tag.id === (winnerByKey[group.key] ?? group.winnerTag.id)
                                  ? "font-medium text-foreground"
                                  : undefined
                              }
                            >
                              {tag.name}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>
            Fermer
          </Button>
          <Button
            type="button"
            onClick={() => void handleConfirm()}
            disabled={loading || selectedCount === 0}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Fusion...
              </>
            ) : (
              `Appliquer (${selectedCount})`
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
