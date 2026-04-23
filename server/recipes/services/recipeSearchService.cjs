'use strict'

const { RecipeProxyError } = require('../common/errors.cjs')
const { getRecipeProvider, listRecipeProviders } = require('../providers/providerRegistry.cjs')

function validateSearchParams(query, source) {
  const trimmedQuery = String(query ?? '').trim()
  if (!trimmedQuery) {
    throw new RecipeProxyError('Parametre q manquant.', {
      status: 400,
      code: 'invalid_query',
    })
  }

  const provider = getRecipeProvider(source)
  if (!provider || typeof provider.searchRecipes !== 'function') {
    throw new RecipeProxyError('Source non supportee.', {
      status: 400,
      code: 'unsupported_source',
      details: { availableSources: listRecipeProviders().map((item) => item.id) },
    })
  }

  return {
    provider,
    query: trimmedQuery,
  }
}

async function searchRecipes(params) {
  const normalized = validateSearchParams(params.query, params.source)
  const result = await normalized.provider.searchRecipes(normalized)

  return {
    source: normalized.provider.id,
    results: result.results,
    hasMore: Boolean(result.hasMore),
    nextPage: result.nextPage ?? null,
  }
}

async function searchNextRecipes(params) {
  const provider = getRecipeProvider(params.source)
  if (!provider || typeof provider.searchNextRecipes !== 'function') {
    throw new RecipeProxyError('Source non supportee.', {
      status: 400,
      code: 'unsupported_source',
      details: { availableSources: listRecipeProviders().map((item) => item.id) },
    })
  }

  if (typeof provider.searchNextRecipes !== 'function') {
    throw new RecipeProxyError('Pagination indisponible pour cette source.', {
      status: 400,
      code: 'unsupported_pagination',
    })
  }

  const result = await provider.searchNextRecipes({ nextPage: params.nextPage })

  return {
    source: provider.id,
    results: result.results,
    hasMore: Boolean(result.hasMore),
    nextPage: result.nextPage ?? null,
  }
}

async function proxyRecipeImage(source, imageUrl, response) {
  const provider = getRecipeProvider(source)
  if (!provider) {
    throw new RecipeProxyError('Source non supportee.', {
      status: 400,
      code: 'unsupported_source',
    })
  }

  const normalizedUrl = String(imageUrl ?? '').trim()
  if (!normalizedUrl) {
    throw new RecipeProxyError('Parametre url manquant.', {
      status: 400,
      code: 'invalid_url',
    })
  }

  let parsedUrl
  try {
    parsedUrl = new URL(normalizedUrl)
  } catch {
    throw new RecipeProxyError('URL image invalide.', {
      status: 400,
      code: 'invalid_url',
    })
  }

  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    throw new RecipeProxyError('URL image invalide.', {
      status: 400,
      code: 'invalid_url',
    })
  }

  return provider.proxyImage(parsedUrl.toString(), response)
}

module.exports = {
  proxyRecipeImage,
  searchRecipes,
  searchNextRecipes,
}
