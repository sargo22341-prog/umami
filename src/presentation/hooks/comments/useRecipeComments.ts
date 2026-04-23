import { useCallback, useEffect, useState } from "react"
import type { MealieRecipeCommentOutOutput } from "@/shared/types/mealie/RecipeComment.ts"
import {
  createRecipeCommentUseCase,
  deleteRecipeCommentUseCase,
  getRecipeCommentsUseCase,
} from "@/infrastructure/container.ts"

export function useRecipeComments(slug: string | undefined, recipeId: string | undefined) {
  const [comments, setComments] = useState<MealieRecipeCommentOutOutput[]>([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!slug) {
      setComments([])
      return
    }

    setLoading(true)
    setError(null)
    try {
      const nextComments = await getRecipeCommentsUseCase.execute(slug)
      setComments(nextComments)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de charger les commentaires")
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => {
    void reload()
  }, [reload])

  const createComment = useCallback(async (text: string) => {
    if (!recipeId || !text.trim()) return false

    setCreating(true)
    setError(null)
    try {
      const created = await createRecipeCommentUseCase.execute(recipeId, text.trim())
      setComments((prev) => [...prev, created])
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible d'envoyer le commentaire")
      return false
    } finally {
      setCreating(false)
    }
  }, [recipeId])

  const deleteComment = useCallback(async (commentId: string) => {
    setDeletingId(commentId)
    setError(null)
    try {
      await deleteRecipeCommentUseCase.execute(commentId)
      setComments((prev) => prev.filter((comment) => comment.id !== commentId))
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de supprimer le commentaire")
      return false
    } finally {
      setDeletingId(null)
    }
  }, [])

  return {
    comments,
    loading,
    creating,
    deletingId,
    error,
    createComment,
    deleteComment,
    reload,
  }
}
