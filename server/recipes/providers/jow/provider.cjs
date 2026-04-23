'use strict'

const { RecipeProxyError } = require('../../common/errors.cjs')
const { fetchWithDefaults, readJsonSafely } = require('../../common/http.cjs')
const { normalizeSpace } = require('../../common/normalize.cjs')

const JOW_SEARCH_URL = 'https://api.jow.fr/public/recipe/quicksearch'
const JOW_RECIPE_BASE_URL = 'https://jow.fr/recipes/'
const JOW_STATIC_BASE_URL = 'https://static.jow.fr/'
const JOW_SEARCH_LIMIT = 20

function isJowRecipeUrl(url) {
  try {
    const parsed = new URL(url)
    return /(^|\.)jow\.fr$/i.test(parsed.hostname) && parsed.pathname.startsWith('/recipes/')
  } catch {
    return false
  }
}

function buildInitialJowParams(query) {
  return new URLSearchParams({
    query,
    limit: String(JOW_SEARCH_LIMIT),
    availabilityZoneId: 'FR',
  })
}

function buildNextJowParams(query, searchToken) {
  const params = buildInitialJowParams(query)
  params.set('searchToken', searchToken)
  return params
}

function readJowSearchToken(payload) {
  const nextLink = String(payload?.data?.links?.next ?? '').trim()
  if (!nextLink) return null

  try {
    const parsed = new URL(nextLink, 'https://api.jow.fr')
    return parsed.searchParams.get('searchToken')
  } catch {
    return null
  }
}

function toJowStaticUrl(value) {
  const normalized = String(value ?? '').trim()
  if (!normalized) return ''
  if (/^https?:\/\//i.test(normalized)) return normalized
  return `${JOW_STATIC_BASE_URL}${normalized.replace(/^\/+/, '')}`
}

function buildJowRecipeUrl(recipe) {
  const slug = normalizeSpace(recipe?.slug ?? '')
  const id = normalizeSpace(recipe?._id ?? recipe?.id ?? '')

  if (slug && id) return `${JOW_RECIPE_BASE_URL}${slug}-${id}`
  if (slug) return `${JOW_RECIPE_BASE_URL}${slug}`
  if (id) return `${JOW_RECIPE_BASE_URL}${id}`
  return ''
}

async function runJowSearchRequest(queryString) {
  const url = `${JOW_SEARCH_URL}?${queryString}`

  const response = await fetchWithDefaults(url, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'accept-language': 'fr',
      'content-type': 'application/json',
      'x-jow-withmeta': '1',
    },
    timeoutMs: 12000,
  })

  return response
}

function mapJowSearchPayload(payload, query) {
  const nextSearchToken = readJowSearchToken(payload)
  const rows = Array.isArray(payload?.data?.content) ? payload.data.content : []

  return {
    results: rows.map((recipe) => ({
      id: String(recipe?._id ?? ''),
      title: normalizeSpace(recipe?.title ?? ''),
      url: buildJowRecipeUrl(recipe),
      image: toJowStaticUrl(
        recipe?.imageUrl || recipe?.editorialPictureUrl || recipe?.imageWithBackgroundPatternUrl,
      ),
    })),
    hasMore: Boolean(nextSearchToken),
    nextPage: nextSearchToken
      ? {
          query,
          searchToken: nextSearchToken,
        }
      : null,
  }
}

async function searchRecipes({ query }) {
  const queryString = buildInitialJowParams(query).toString()
  const searchResponse = await runJowSearchRequest(queryString)

  if (!searchResponse.ok) {
    const payload = await readJsonSafely(searchResponse)
    throw new RecipeProxyError(payload?.error || `Recherche Jow impossible (${searchResponse.status})`, {
      status: 502,
      code: 'provider_error',
      details: payload,
    })
  }

  const payload = await searchResponse.json()
  return mapJowSearchPayload(payload, query)
}

async function searchNextRecipes({ nextPage }) {
  const query = normalizeSpace(nextPage?.query ?? '')
  const searchToken = normalizeSpace(nextPage?.searchToken ?? '')

  if (!query || !searchToken) {
    throw new RecipeProxyError('Pagination Jow invalide.', {
      status: 400,
      code: 'invalid_next_page',
      details: nextPage,
    })
  }

  const queryString = buildNextJowParams(query, searchToken).toString()
  const searchResponse = await runJowSearchRequest(queryString)

  if (!searchResponse.ok) {
    const payload = await readJsonSafely(searchResponse)
    throw new RecipeProxyError(payload?.error || `Recherche Jow impossible (${searchResponse.status})`, {
      status: 502,
      code: 'provider_error',
      details: payload,
    })
  }

  const payload = await searchResponse.json()
  return mapJowSearchPayload(payload, query)
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

const jowRecipeProvider = {
  id: 'jow',
  label: 'Jow',
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
  jowRecipeProvider,
}
