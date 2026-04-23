'use strict'

const { RecipeProxyError } = require('../../common/errors.cjs')
const { fetchWithDefaults } = require('../../common/http.cjs')
const { stripTags, toAbsoluteUrl } = require('../../common/normalize.cjs')

const BASE_URL = 'https://www.750g.com'
const SEARCH_URL = `${BASE_URL}/recherche/`

function extract750gSearchCardsFromHtml(html) {
  const results = []
  const seen = new Set()
  const cardPattern = /<(article|div)[^>]+class=["'][^"']*\bcard-recipe\b[^"']*["'][^>]*>/gi
  const matches = [...html.matchAll(cardPattern)]

  for (let index = 0; index < matches.length; index += 1) {
    const start = matches[index].index ?? -1
    const end = matches[index + 1]?.index ?? html.length
    if (start < 0 || end <= start) continue

    const block = html.slice(start, end)
    const hrefRaw =
      block.match(/<a[^>]*href=["']([^"']+)["'][^>]*class=["'][^"']*\bcard-link\b[^"']*["']/i)?.[1]
      ?? block.match(/<a[^>]*class=["'][^"']*\bcard-link\b[^"']*["'][^>]*href=["']([^"']+)["']/i)?.[1]
      ?? ''
    const imageRaw =
      block.match(/<[^>]+class=["'][^"']*\bcard-media\b[^"']*["'][^>]*>[\s\S]*?<img[^>]+(?:data-src|src)=["']([^"']+)["']/i)?.[1]
      ?? ''
    const name =
      stripTags(block.match(/<a[^>]+class=["'][^"']*\bcard-link\b[^"']*["'][^>]*>([\s\S]*?)<\/a>/i)?.[1] ?? '')
      || stripTags(block.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i)?.[1] ?? '')
      || stripTags(block.match(/<h3[^>]*>([\s\S]*?)<\/h3>/i)?.[1] ?? '')
      || ''

    const recipeUrl = toAbsoluteUrl(hrefRaw, BASE_URL)
    if (!recipeUrl || seen.has(recipeUrl)) continue

    seen.add(recipeUrl)
    results.push({
      name,
      imageUrl: toAbsoluteUrl(imageRaw, BASE_URL),
      recipeUrl,
    })
  }

  return results
}

function hasNextPage(html, currentPage) {
  const paginationBlock = html.match(/<ul[^>]+class=["'][^"']*\bpagination\b[^"']*["'][^>]*>([\s\S]*?)<\/ul>/i)?.[1] ?? ''
  if (!paginationBlock) return false

  const pageNumbers = [...paginationBlock.matchAll(/>(\d+)<\/(?:span|a)>/gi)]
    .map((match) => Number.parseInt(match[1], 10))
    .filter((value) => Number.isFinite(value))

  return pageNumbers.some((value) => value > currentPage)
}

async function fetchSearchPage(query, page) {
  const params = new URLSearchParams({
    q: query,
    page: String(page),
  })

  const response = await fetchWithDefaults(`${SEARCH_URL}?${params.toString()}`, { timeoutMs: 10000 })
  if (!response.ok) return { results: [], hasMore: false }

  const html = await response.text()

  return {
    results: extract750gSearchCardsFromHtml(html),
    hasMore: hasNextPage(html, page),
  }
}

async function searchRecipes({ query, page = 1 }) {
  const normalizedPage = Math.max(1, Number.parseInt(String(page ?? '1'), 10) || 1)
  const pageResult = await fetchSearchPage(query, normalizedPage)

  return {
    results: pageResult.results.map((item) => ({
      id: item.recipeUrl,
      title: item.name,
      url: item.recipeUrl,
      image: item.imageUrl || '',
    })),
    hasMore: pageResult.hasMore,
    nextPage: pageResult.hasMore
      ? {
          query,
          page: normalizedPage + 1,
        }
      : null,
  }
}

async function searchNextRecipes({ nextPage }) {
  const query = String(nextPage?.query ?? '').trim()
  const page = Math.max(1, Number.parseInt(String(nextPage?.page ?? '1'), 10) || 1)

  if (!query) {
    throw new RecipeProxyError('Pagination 750g invalide.', {
      status: 400,
      code: 'invalid_next_page',
      details: nextPage,
    })
  }

  return searchRecipes({ query, page })
}

async function proxyImage(imageUrl, response) {
  const upstream = await fetchWithDefaults(imageUrl, { timeoutMs: 10000 })

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

const recipe750gProvider = {
  id: '750g',
  label: '750g',
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
  recipe750gProvider,
}
