'use strict'

const express = require('express')
const { isRecipeProxyError } = require('../common/errors.cjs')
const { listRecipeProviders } = require('../providers/providerRegistry.cjs')
const {
  proxyRecipeImage,
  searchRecipes,
  searchNextRecipes,
} = require('../services/recipeSearchService.cjs')

function sendError(response, error) {
  if (isRecipeProxyError(error)) {
    return response.status(error.status).json({
      error: error.message,
      code: error.code,
      details: error.details,
    })
  }

  return response.status(500).json({
    error: error instanceof Error ? error.message : 'Erreur inconnue',
    code: 'internal_error',
  })
}

function createRecipeRoutes() {
  const router = express.Router()

  router.get('/sources', (_request, response) => {
    response.json({
      sources: listRecipeProviders()
        .filter((provider) => provider.searchable !== false)
        .map((provider) => ({
        id: provider.id,
        label: provider.label,
      })),
    })
  })

  router.get('/search', async (request, response) => {
    try {
      const payload = await searchRecipes({
        query: request.query.q,
        source: request.query.source,
      })

      response.json(payload)
    } catch (error) {
      console.error('[RecipesSearchProxy] Search error:', error instanceof Error ? error.message : error)
      sendError(response, error)
    }
  })

  router.post('/search-next', express.json(), async (request, response) => {
    try {
      const payload = await searchNextRecipes({
        source: request.body?.source,
        nextPage: request.body?.nextPage,
      })

      response.json(payload)
    } catch (error) {
      console.error('[RecipesSearchProxy] Search next error:', error instanceof Error ? error.message : error)
      sendError(response, error)
    }
  })

  router.get('/image', async (request, response) => {
    try {
      await proxyRecipeImage(request.query.source, request.query.url, response)
    } catch (error) {
      console.error('[RecipesSearchProxy] Image proxy error:', error instanceof Error ? error.message : error)
      sendError(response, error)
    }
  })

  return router
}

module.exports = {
  createRecipeRoutes,
}
