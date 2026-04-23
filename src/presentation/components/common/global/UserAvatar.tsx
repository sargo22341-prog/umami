import { useMemo, useState } from "react"
import { User } from "lucide-react"
import { userImageCandidates } from "@/shared/utils/image.ts"
import { cn } from "@/lib/utils.ts"

interface UserAvatarProps {
  userId?: string | null
  cacheBust?: string | number | null
  alt?: string
  className?: string
  iconClassName?: string
}

export function UserAvatar({
  userId,
  cacheBust,
  alt = "Utilisateur",
  className,
  iconClassName,
}: UserAvatarProps) {
  const [failedImageSrc, setFailedImageSrc] = useState<string | null>(null)

  const imageSrc = useMemo(
    () => (userId ? userImageCandidates(userId, cacheBust) : null),
    [cacheBust, userId],
  )

  if (!userId || !imageSrc || failedImageSrc === imageSrc) {
    return (
      <div className={cn("flex items-center justify-center", className)}>
        <User className={cn("h-5 w-5", iconClassName)} />
      </div>
    )
  }

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      onError={() => setFailedImageSrc(imageSrc)}
    />
  )
}
