import { useState } from "react"
import { Loader2, MessageSquare, Send, X } from "lucide-react"

import { formatCommentDate } from "@/shared/utils"
import type { MealieRecipeCommentOutOutput } from "@/shared/types/mealie/RecipeComment.ts"
import { 
  Button, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle
} from "components/ui"

interface RecipeCommentsSectionProps {
  comments: MealieRecipeCommentOutOutput[]
  commentsLoading: boolean
  creatingComment: boolean
  deletingCommentId: string | null
  commentsError: string | null
  headingClassName?: string
  onCreateComment: (text: string) => Promise<boolean>
  onDeleteComment: (commentId: string) => Promise<boolean>
}

export function RecipeCommentsSection({
  comments,
  commentsLoading,
  creatingComment,
  deletingCommentId,
  commentsError,
  headingClassName = "text-lg",
  onCreateComment,
  onDeleteComment,
}: RecipeCommentsSectionProps) {
  const [commentText, setCommentText] = useState("")
  const [commentToDelete, setCommentToDelete] = useState<MealieRecipeCommentOutOutput | null>(null)

  async function handleCreateComment() {
    const success = await onCreateComment(commentText)
    if (success) {
      setCommentText("")
    }
  }

  async function handleConfirmDeleteComment() {
    if (!commentToDelete) return
    const success = await onDeleteComment(commentToDelete.id)
    if (success) {
      setCommentToDelete(null)
    }
  }

  return (
    <>
      <Dialog open={Boolean(commentToDelete)} onOpenChange={(open) => !open && setCommentToDelete(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Supprimer ce commentaire ?</DialogTitle>
            <DialogDescription>
              Cette action est definitive. Le commentaire sera retire de la recette.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-[var(--radius-xl)] border border-border/50 bg-secondary/20 p-3 text-sm text-muted-foreground">
            {commentToDelete?.text}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCommentToDelete(null)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={() => void handleConfirmDeleteComment()}
              disabled={!commentToDelete || deletingCommentId === commentToDelete.id}
              className="gap-1.5"
            >
              {deletingCommentId === commentToDelete?.id ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Suppression...
                </>
              ) : (
                "Supprimer"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <section className="space-y-4 border-t border-border/60 pt-6">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          <h2 className={`font-heading font-bold tracking-tight ${headingClassName}`}>Commentaires</h2>
        </div>

        {commentsError && (
          <div className="rounded-[var(--radius-xl)] border border-destructive/20 bg-destructive/8 p-3 text-sm text-destructive">
            {commentsError}
          </div>
        )}

        <div className="space-y-3">
          {commentsLoading ? (
            <div className="rounded-[var(--radius-xl)] border border-border/50 bg-secondary/20 p-4 text-sm text-muted-foreground">
              Chargement des commentaires...
            </div>
          ) : comments.length > 0 ? (
            comments.map((comment) => (
              <article
                key={comment.id}
                className="relative rounded-[var(--radius-xl)] border border-border/50 bg-secondary/20 p-4 pr-12"
              >
                <button
                  type="button"
                  onClick={() => setCommentToDelete(comment)}
                  className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive hover:text-destructive-foreground"
                  aria-label="Supprimer le commentaire"
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {comment.user.fullName || comment.user.username || "Utilisateur"}
                  </span>
                  <span>{formatCommentDate(comment.createdAt)}</span>
                </div>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{comment.text}</p>
              </article>
            ))
          ) : (
            <div className="rounded-[var(--radius-xl)] border border-dashed border-border/60 p-4 text-sm text-muted-foreground">
              Aucun commentaire pour le moment.
            </div>
          )}
        </div>

        <div className="rounded-[var(--radius-xl)] border border-border/60 bg-card p-3">
          <textarea
            value={commentText}
            onChange={(event) => setCommentText(event.target.value)}
            placeholder="Ecrire un commentaire..."
            rows={4}
            className="min-h-[112px] w-full resize-none rounded-md border-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            disabled={creatingComment}
          />
          <div className="mt-3 flex justify-end">
            <Button
              type="button"
              size="sm"
              onClick={() => void handleCreateComment()}
              disabled={creatingComment || !commentText.trim()}
              className="gap-1.5"
            >
              {creatingComment ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Envoi...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Envoyer
                </>
              )}
            </Button>
          </div>
        </div>
      </section>
    </>
  )
}
