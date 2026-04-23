'use strict'

const express = require('express')
const { isRecipeProxyError } = require('../common/errors.cjs')
const { proxyRemoteAsset } = require('../services/assetProxyService.cjs')

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

function createAssetRoutes() {
  const router = express.Router()

  router.get('/', async (request, response) => {
    try {
      await proxyRemoteAsset(request.query.url, response)
    } catch (error) {
      console.error('[RecipesAssetProxy] Asset proxy error:', error instanceof Error ? error.message : error)
      sendError(response, error)
    }
  })

  return router
}

module.exports = {
  createAssetRoutes,
}
