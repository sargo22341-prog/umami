export function truncateText(value: string, maxLength = 250) {
  if (!value) return ""

  // 1. Nettoyage de base
  let text = value.trim()

  // 2. Supprimer les images <img ... />
  text = text.replace(/<img[^>]*>/gi, "")

  // 3. Limite de sauts de ligne (max 4)
  const lines = text.split(/\n+/)
  if (lines.length > 4) {
    text = lines.slice(0, 4).join("\n") + "..."
    return text
  }

  // 4. Si déjà court → ok
  if (text.length <= maxLength) return text

  // 5. Tronquer proprement sans couper un mot
  let truncated = text.slice(0, maxLength)

  // coupe au dernier espace pour éviter mot cassé
  const lastSpace = truncated.lastIndexOf(" ")
  if (lastSpace > 0) {
    truncated = truncated.slice(0, lastSpace)
  }

  return truncated.trimEnd() + "..."
}

export function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
}

export function equalsNormalizedText(left: string, right: string): boolean {
  return normalizeText(left) === normalizeText(right)
}
