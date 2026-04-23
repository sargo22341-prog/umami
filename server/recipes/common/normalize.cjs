'use strict'

function normalizeSpace(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim()
}

function normalizeSearchText(value) {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function stripTags(html) {
  return normalizeSpace(
    String(html ?? '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&quot;/gi, '"')
      .replace(/&#0*39;|&apos;/gi, "'")
      .replace(/\u00a0/g, ' ')
      .replace(/[ \t]{2,}/g, ' ')
      .replace(/\n{2,}/g, '\n'),
  )
}

function tokenizeQuery(query) {
  return normalizeSearchText(query)
    .split(' ')
    .map((item) => item.trim())
    .filter((item) => item.length >= 2)
}

function expandTermVariants(term) {
  const normalized = normalizeSearchText(term)
  const variants = new Set([normalized])

  if (normalized.endsWith('es') && normalized.length > 4) variants.add(normalized.slice(0, -2))
  if (normalized.endsWith('s') && normalized.length > 3) variants.add(normalized.slice(0, -1))
  if (normalized.endsWith('x') && normalized.length > 3) variants.add(normalized.slice(0, -1))

  return [...variants].filter(Boolean)
}

function termMatches(haystack, termVariants) {
  return termVariants.some((variant) => haystack.includes(variant))
}

function parseISO8601(duration) {
  if (!duration) return 0
  const hours = parseInt(duration.match(/(\d+)H/)?.[1] ?? '0', 10)
  const minutes = parseInt(duration.match(/(\d+)M/)?.[1] ?? '0', 10)
  return hours * 60 + minutes
}

function formatMinutes(minutes) {
  if (!minutes || minutes <= 0) return ''
  if (minutes < 60) return `${minutes} min`

  const hours = Math.floor(minutes / 60)
  const remaining = minutes % 60
  return remaining > 0 ? `${hours}h${String(remaining).padStart(2, '0')}` : `${hours}h`
}

function toAbsoluteUrl(rawUrl, baseUrl = '') {
  const value = String(rawUrl ?? '').trim()
  if (!value) return ''
  if (/^https?:\/\//i.test(value)) return value
  if (value.startsWith('//')) return `https:${value}`

  try {
    return new URL(value, baseUrl).toString()
  } catch {
    return value
  }
}

function extractImageUrl(value, baseUrl = '') {
  if (!value) return ''
  if (typeof value === 'string') return toAbsoluteUrl(value, baseUrl)

  if (Array.isArray(value)) {
    for (const item of value) {
      const imageUrl = extractImageUrl(item, baseUrl)
      if (imageUrl) return imageUrl
    }
    return ''
  }

  if (typeof value === 'object') {
    return (
      extractImageUrl(value.url, baseUrl)
      || extractImageUrl(value.contentUrl, baseUrl)
      || extractImageUrl(value.thumbnailUrl, baseUrl)
    )
  }

  return ''
}

function parseJsonLd(html) {
  const results = []
  const pattern = /<script[^>]*type\s*=\s*["']?\s*(?:application\/ld\+json|application&#x2F;ld&#x2B;json)\s*["']?[^>]*>([\s\S]*?)<\/script>/gi

  for (const [, content] of html.matchAll(pattern)) {
    try {
      const normalizedContent = content
        .trim()
        .replace(/^<!--/, '')
        .replace(/-->$/, '')
        .replace(/^<!\[CDATA\[/i, '')
        .replace(/\]\]>$/i, '')
        // Certains sites injectent des caracteres de controle non echappes
        // dans le JSON-LD, ce qui casse JSON.parse alors que la structure
        // reste exploitable une fois assainie.
        .replace(/[\u0000-\u001F]/g, ' ')
        .trim()

      const parsed = JSON.parse(normalizedContent)
      if (Array.isArray(parsed)) results.push(...parsed)
      else results.push(parsed)
    } catch {
      // Ignore malformed JSON-LD blocks.
    }
  }

  return results.flatMap((item) => (item['@graph'] ? item['@graph'] : [item]))
}

function formatIngredientText(parts) {
  return parts.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim()
}

module.exports = {
  expandTermVariants,
  extractImageUrl,
  formatIngredientText,
  formatMinutes,
  normalizeSearchText,
  normalizeSpace,
  parseISO8601,
  parseJsonLd,
  stripTags,
  termMatches,
  toAbsoluteUrl,
  tokenizeQuery,
}
