import { useEffect, useMemo, useState } from "react"
import { ImagePlus, Loader2, Save } from "lucide-react"

import { userRepository } from "@/infrastructure/container.ts"
import type { MealieUserBaseInput, MealieUserOut } from "@/shared/types/mealie/User.ts"
import { userImageCandidates } from "@/shared/utils"
import { 
  Button, Input, Label, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle 
} from "components/ui"

interface EditProfileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: MealieUserOut | null
  onSaved: (user: MealieUserOut) => void
}

async function renderCroppedImageToFile(
  imageUrl: string,
  zoom: number,
  offsetX: number,
  offsetY: number,
): Promise<File> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = imageUrl
  })

  const size = 512
  const canvas = document.createElement("canvas")
  canvas.width = size
  canvas.height = size

  const context = canvas.getContext("2d")
  if (!context) throw new Error("Canvas indisponible")

  const baseScale = Math.max(size / image.width, size / image.height)
  const scaledWidth = image.width * baseScale * zoom
  const scaledHeight = image.height * baseScale * zoom

  const maxOffsetX = Math.max(0, (scaledWidth - size) / 2)
  const maxOffsetY = Math.max(0, (scaledHeight - size) / 2)

  const drawX = (size - scaledWidth) / 2 + offsetX * maxOffsetX
  const drawY = (size - scaledHeight) / 2 + offsetY * maxOffsetY

  context.drawImage(image, drawX, drawY, scaledWidth, scaledHeight)

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((value) => {
      if (!value) {
        reject(new Error("Impossible de generer l'image"))
        return
      }
      resolve(value)
    }, "image/webp", 0.95)
  })

  return new File([blob], "profile.webp", { type: "image/webp" })
}

export function EditProfileDialog({ open, onOpenChange, user, onSaved }: EditProfileDialogProps) {
  const [username, setUsername] = useState("")
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [advanced, setAdvanced] = useState(false)
  const [canInvite, setCanInvite] = useState(false)
  const [canManage, setCanManage] = useState(false)
  const [canManageHousehold, setCanManageHousehold] = useState(false)
  const [canOrganize, setCanOrganize] = useState(false)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const [offsetX, setOffsetX] = useState(0)
  const [offsetY, setOffsetY] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !user) return
    setUsername(user.username ?? "")
    setFullName(user.fullName ?? "")
    setEmail(user.email ?? "")
    setAdvanced(Boolean(user.advanced))
    setCanInvite(Boolean(user.canInvite))
    setCanManage(Boolean(user.canManage))
    setCanManageHousehold(Boolean(user.canManageHousehold))
    setCanOrganize(Boolean(user.canOrganize))
    setSelectedImage(null)
    setImagePreview(null)
    setZoom(1)
    setOffsetX(0)
    setOffsetY(0)
    setError(null)
  }, [open, user])

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview)
    }
  }, [imagePreview])

  const currentImage = useMemo(() => {
    if (imagePreview) return imagePreview
    return user?.id ? userImageCandidates(user.id) : null
  }, [imagePreview, user?.id])

  const handleFileChange = (file?: File | null) => {
    if (!file) return
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setSelectedImage(file)
    setImagePreview(URL.createObjectURL(file))
    setZoom(1)
    setOffsetX(0)
    setOffsetY(0)
  }

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    setError(null)

    try {
      const payload: MealieUserBaseInput = {
        id: user.id,
        username: username.trim() || null,
        fullName: fullName.trim() || null,
        email: email.trim(),
        authMethod: "Mealie",
        admin: user.admin,
        group: user.group,
        household: user.household,
        advanced,
        canInvite,
        canManage,
        canManageHousehold,
        canOrganize,
      }

      const croppedFile = selectedImage && currentImage
        ? await renderCroppedImageToFile(currentImage, zoom, offsetX, offsetY)
        : null

      const refreshed = await userRepository.saveProfile({
        userId: user.id,
        profile: payload,
        imageFile: croppedFile,
      })
      onSaved(refreshed)
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de mettre a jour le profil.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[90vh] w-[calc(100vw-2rem)] max-w-2xl overflow-y-auto sm:w-full"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Editer mon profil</DialogTitle>
          <DialogDescription>
            Modifie les informations de ton compte Mealie et recadre ton image avant l&apos;envoi.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="profile-username">Nom d&apos;utilisateur</Label>
              <Input id="profile-username" value={username} onChange={(e) => setUsername(e.target.value)} disabled={saving} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="profile-fullname">Nom complet</Label>
              <Input id="profile-fullname" value={fullName} onChange={(e) => setFullName(e.target.value)} disabled={saving} />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="profile-email">Email</Label>
              <Input id="profile-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={saving} />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {[
              { label: "Mode avance", checked: advanced, setChecked: setAdvanced },
              { label: "Peut inviter", checked: canInvite, setChecked: setCanInvite },
              { label: "Peut gerer", checked: canManage, setChecked: setCanManage },
              { label: "Peut gerer le foyer", checked: canManageHousehold, setChecked: setCanManageHousehold },
              { label: "Peut organiser", checked: canOrganize, setChecked: setCanOrganize },
            ].map((item) => (
              <label key={item.label} className="flex items-center gap-3 rounded-[var(--radius-xl)] border border-border/50 bg-secondary/20 px-4 py-3 text-sm">
                <input
                  type="checkbox"
                  checked={item.checked}
                  onChange={(event) => item.setChecked(event.target.checked)}
                  disabled={saving}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-ring"
                />
                <span>{item.label}</span>
              </label>
            ))}
          </div>

          <div className="space-y-3 rounded-[var(--radius-xl)] border border-border/50 bg-secondary/20 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">Image de profil</p>
                <p className="text-xs text-muted-foreground">Choisis, recadre, zoome et repositionne l&apos;image avant l&apos;upload.</p>
              </div>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-[var(--radius-lg)] border border-border bg-card px-3 py-2 text-sm font-medium">
                <ImagePlus className="h-4 w-4" />
                Choisir une image
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => handleFileChange(event.target.files?.[0] ?? null)}
                  disabled={saving}
                />
              </label>
            </div>

            <div className="flex flex-col gap-4 md:flex-row">
              <div className="mx-auto h-56 w-56 overflow-hidden rounded-full border border-border/50 bg-card">
                {currentImage ? (
                  <img
                    src={currentImage}
                    alt="Apercu du profil"
                    className="h-full w-full select-none object-cover"
                    style={{
                      transform: `scale(${zoom}) translate(${offsetX * 25}%, ${offsetY * 25}%)`,
                      transformOrigin: "center center",
                    }}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
                    Aucune image
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-4">
                <div className="space-y-1.5">
                  <Label>Zoom</Label>
                  <input
                    type="range"
                    min="1"
                    max="3"
                    step="0.05"
                    value={zoom}
                    onChange={(event) => setZoom(Number(event.target.value))}
                    disabled={saving || !currentImage}
                    className="w-full"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Deplacement horizontal</Label>
                  <input
                    type="range"
                    min="-1"
                    max="1"
                    step="0.05"
                    value={offsetX}
                    onChange={(event) => setOffsetX(Number(event.target.value))}
                    disabled={saving || !currentImage}
                    className="w-full"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Deplacement vertical</Label>
                  <input
                    type="range"
                    min="-1"
                    max="1"
                    step="0.05"
                    value={offsetY}
                    onChange={(event) => setOffsetY(Number(event.target.value))}
                    disabled={saving || !currentImage}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-[var(--radius-xl)] border border-destructive/20 bg-destructive/8 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
            Annuler
          </Button>
          <Button type="button" onClick={() => void handleSave()} disabled={saving || !email.trim()} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Enregistrer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
