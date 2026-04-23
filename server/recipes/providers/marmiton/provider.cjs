'use strict'

const { RecipeProxyError } = require('../../common/errors.cjs')
const { fetchWithDefaults } = require('../../common/http.cjs')
const {
  expandTermVariants,
  extractImageUrl,
  normalizeSearchText,
  parseJsonLd,
  stripTags,
  termMatches,
  toAbsoluteUrl,
  tokenizeQuery,
} = require('../../common/normalize.cjs')

const BASE_URL = 'https://www.marmiton.org'
const SEARCH_URL = `${BASE_URL}/recettes/recherche.aspx`

function normalizeMarmitonImageUrl(imageUrl) {
  const normalizedUrl = String(imageUrl ?? '').trim()
  if (!normalizedUrl) return ''

  let parsedUrl
  try {
    parsedUrl = new URL(normalizedUrl)
  } catch {
    return normalizedUrl
  }

  if (!/assets\.afcdn\.com$/i.test(parsedUrl.hostname)) {
    return normalizedUrl
  }

  parsedUrl.pathname = parsedUrl.pathname.replace(
    /(\/recipe\/\d+\/\d+)_origin[^/.]*\.(jpg|jpeg|png|webp)$/i,
    '$1_w600.$2',
  )

  return parsedUrl.toString()
}

function extractSearchCardsFromHtml(html) {
  const results = []
  const seen = new Set()
  const anchorPattern = /<a[^>]+href=["'](\/recettes\/recette_[^"']+\.aspx)["'][^>]*>([\s\S]*?)<\/a>/gi

  for (const match of html.matchAll(anchorPattern)) {
    const href = match[1]
    const block = match[2]

    const name =
      stripTags(block.match(/<h4[^>]*>([\s\S]*?)<\/h4>/i)?.[1] || '')
      || stripTags(block.match(/<h3[^>]*>([\s\S]*?)<\/h3>/i)?.[1] || '')
      || ''

    const imageRaw =
      block.match(/<img[^>]+data-src=["']([^"']+)["']/i)?.[1]
      || block.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1]
      || ''

    const recipeUrl = toAbsoluteUrl(href, BASE_URL)
    if (!recipeUrl || seen.has(recipeUrl)) continue

    seen.add(recipeUrl)
    results.push({
      name,
      imageUrl: normalizeMarmitonImageUrl(toAbsoluteUrl(imageRaw, BASE_URL)),
      recipeUrl,
    })
  }

  return results
}

async function fetchSearchPage(query, page) {
  const url = page <= 1
    ? `${SEARCH_URL}?aqt=${encodeURIComponent(query)}`
    : `${SEARCH_URL}?aqt=${encodeURIComponent(query)}&page=${page}`

  const response = await fetchWithDefaults(url, { timeoutMs: 10000 })
  if (!response.ok) return []

  const html = await response.text()
  const schemas = parseJsonLd(html)
  const list = schemas.find((item) => {
    const type = item['@type']
    return type === 'ItemList' || (Array.isArray(type) && type.includes('ItemList'))
  })

  const jsonLdItems = list?.itemListElement?.length
    ? list.itemListElement.map((item) => ({
        name: item.name ?? '',
        imageUrl: normalizeMarmitonImageUrl(extractImageUrl(item.image, BASE_URL)),
        recipeUrl: toAbsoluteUrl(item.url ?? '', BASE_URL),
      }))
    : []

  const htmlItems = extractSearchCardsFromHtml(html)
  const mergedByUrl = new Map()

  for (const item of jsonLdItems) {
    if (item.recipeUrl) mergedByUrl.set(item.recipeUrl, item)
  }

  for (const item of htmlItems) {
    if (!item.recipeUrl) continue

    const existing = mergedByUrl.get(item.recipeUrl)
    mergedByUrl.set(item.recipeUrl, {
      ...existing,
      ...item,
      name: existing?.name || item.name,
      imageUrl: existing?.imageUrl || item.imageUrl,
    })
  }

  return [...mergedByUrl.values()]
}

async function fetchSearchList(query, needed) {
  const perPage = 12
  const maxPages = Math.max(1, Math.ceil(needed / perPage) + 1)
  const seen = new Set()
  const results = []

  for (let page = 1; page <= maxPages; page += 1) {
    const pageItems = await fetchSearchPage(query, page)
    if (!pageItems.length) break

    let added = 0
    for (const item of pageItems) {
      if (seen.has(item.recipeUrl)) continue
      seen.add(item.recipeUrl)
      results.push(item)
      added += 1
    }

    if (results.length >= needed || added === 0) break
  }

  return results
}

async function fetchSearchFallbackList(queryTerms, needed) {
  const searchTerms = [...new Set(queryTerms)]
    .filter((term) => term.length >= 3)
    .slice(0, 4)

  if (!searchTerms.length) return []

  const perTermNeeded = Math.min(Math.max(Math.ceil(needed / searchTerms.length), 16), 50)
  const lists = await Promise.all(searchTerms.map((term) => fetchSearchList(term, perTermNeeded)))
  const seen = new Set()
  const results = []

  for (const items of lists) {
    for (const item of items) {
      if (seen.has(item.recipeUrl)) continue
      seen.add(item.recipeUrl)
      results.push(item)
    }
  }

  return results
}

function rankByTitle(items, queryTerms) {
  return [...items]
    .map((item) => {
      const title = normalizeSearchText(item.name)
      let matched = 0
      let score = 0

      for (const term of queryTerms) {
        const variants = expandTermVariants(term)
        if (termMatches(title, variants)) {
          matched += 1
          score += 6
        }
      }

      score += Math.max(0, 0.3 - (title.length / 300))
      return { item, matched, score }
    })
    .sort((left, right) => {
      if (right.matched !== left.matched) return right.matched - left.matched
      return right.score - left.score
    })
}

async function searchRecipes({ query, page = 1, limit = 12 }) {
  const terms = tokenizeQuery(query)
  const isMultiTerm = terms.length >= 2
  const offset = (page - 1) * limit
  const needed = isMultiTerm
    ? Math.min(Math.max((offset + limit + 1) * 4, 40), 140)
    : offset + limit + 1

  let listItems = await fetchSearchList(query, needed)
  if (isMultiTerm && listItems.length === 0) {
    listItems = await fetchSearchFallbackList(terms, needed)
  }

  if (!listItems.length) {
    return { results: [], hasMore: false }
  }

  const rankedItems = isMultiTerm
    ? rankByTitle(listItems, terms)
        .filter((entry) => entry.matched >= Math.max(1, terms.length - 1))
        .map((entry) => entry.item)
    : listItems

  const hasMore = rankedItems.length > offset + limit
  return {
    results: rankedItems.slice(offset, offset + limit).map((item) => ({
      id: item.recipeUrl,
      title: item.name,
      url: item.recipeUrl,
      image: item.imageUrl || '',
    })),
    hasMore,
    nextPage: hasMore
      ? {
        query,
        page: page + 1,
        limit,
      }
      : null,
  }
}

async function searchNextRecipes({ nextPage }) {
  const query = String(nextPage?.query ?? '').trim()
  const page = Math.max(1, Number.parseInt(String(nextPage?.page ?? '1'), 10) || 1)
  const limit = Math.min(Math.max(Number.parseInt(String(nextPage?.limit ?? '12'), 10) || 12, 1), 24)

  if (!query) {
    throw new RecipeProxyError('Pagination Marmiton invalide.', {
      status: 400,
      code: 'invalid_next_page',
      details: nextPage,
    })
  }

  return searchRecipes({ query, page, limit })
}

async function proxyImage(imageUrl, response) {
  let upstream = await fetchWithDefaults(imageUrl, { timeoutMs: 10000 })

  if (!upstream.ok) {
    const fallbackUrl = normalizeMarmitonImageUrl(imageUrl)
    if (fallbackUrl && fallbackUrl !== imageUrl) {
      upstream = await fetchWithDefaults(fallbackUrl, { timeoutMs: 10000 })
    }
  }

  if (!upstream.ok) {
    throw new RecipeProxyError(`Image distante HTTP ${upstream.status}`, {
      status: upstream.status,
      code: 'image_proxy_error',
    })
  }

  const buffer = Buffer.from(await upstream.arrayBuffer())
  response.set('Content-Type', upstream.headers.get('content-type') ?? 'image/jpeg')
  response.set('Cache-Control', 'public, max-age=86400')
  response.send(buffer)
}

const marmitonRecipeProvider = {
  id: 'marmiton',
  label: 'Marmiton',
  async searchRecipes(params) {
    return searchRecipes(params)
  },
  async searchNextRecipes(params) {
    return searchNextRecipes(params)
  },
  async proxyImage(imageUrl, response) {
    return proxyImage(imageUrl, response)
  },
}

module.exports = {
  marmitonRecipeProvider,
}
