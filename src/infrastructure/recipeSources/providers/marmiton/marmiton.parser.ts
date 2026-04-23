function toResolvedUrl(url: string, pageUrl?: string): string {
  const value = url.trim()
  if (!value) return ""
  if (/^https?:\/\//i.test(value)) {
    return normalizeMarmitonImageUrl(value)
  }
  if (value.startsWith("//")) {
    return `https:${value}`
  }
  if (!pageUrl) return value

  try {
    return normalizeMarmitonImageUrl(new URL(value, pageUrl).toString())
  } catch {
    return value
  }
}

export function normalizeMarmitonImageUrl(url: string): string {
  try {
    const parsed = new URL(url)
    if (!/assets\.afcdn\.com$/i.test(parsed.hostname)) return url

    parsed.pathname = parsed.pathname.replace(
      /(\/\d+)_originc[^/.]*(\.(?:jpe?g|png|webp))?$/i,
      (_match, id, extension) => `${id}_origin${extension || ".jpg"}`,
    )

    return parsed.toString()
  } catch {
    return url
  }
}

export function resolveMarmitonImageUrl(imageUrl: string, pageUrl?: string): string {
  return toResolvedUrl(imageUrl, pageUrl)
}

export function buildMarmitonImageCandidates(imageUrl: string, pageUrl?: string): string[] {
  const firstCandidate = resolveMarmitonImageUrl(imageUrl, pageUrl)
  if (!firstCandidate) return []

  const candidates = [firstCandidate]
  const originFallback = firstCandidate.replace(
    /(\/\d+)_w\d+h\d+c[^/.]*(\.(?:jpe?g|png|webp))$/i,
    (_match, id, extension) => `${id}_origin${extension || ".jpg"}`,
  )

  if (originFallback !== firstCandidate) {
    candidates.push(originFallback)
  }

  return Array.from(new Set(candidates))
}

export function inferImageExtension(contentType: string): string {
  const type = contentType.split(";")[0].trim().toLowerCase()

  switch (type) {
    case "image/jpeg":
      return "jpg"
    case "image/png":
      return "png"
    case "image/webp":
      return "webp"
    case "image/avif":
      return "avif"
    case "image/gif":
      return "gif"
    default:
      return "jpg"
  }
}
