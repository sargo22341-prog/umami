'use strict'

const { RecipeProxyError } = require('../common/errors.cjs')
const { fetchWithDefaults } = require('../common/http.cjs')

function parseAssetUrl(assetUrl) {
  const normalizedUrl = String(assetUrl ?? '').trim()
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
    throw new RecipeProxyError('URL asset invalide.', {
      status: 400,
      code: 'invalid_url',
    })
  }

  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    throw new RecipeProxyError('URL asset invalide.', {
      status: 400,
      code: 'invalid_url',
    })
  }

  return parsedUrl.toString()
}

async function proxyRemoteAsset(assetUrl, response) {
  const normalizedUrl = parseAssetUrl(assetUrl)
  const upstream = await fetchWithDefaults(normalizedUrl, { timeoutMs: 30000 })

  if (!upstream.ok) {
    throw new RecipeProxyError(`Asset distant HTTP ${upstream.status}`, {
      status: upstream.status,
      code: 'asset_proxy_error',
    })
  }

  const buffer = Buffer.from(await upstream.arrayBuffer())
  response.set('Content-Type', upstream.headers.get('content-type') ?? 'application/octet-stream')
  response.set('Cache-Control', 'public, max-age=3600')
  const contentLength = upstream.headers.get('content-length')
  if (contentLength) {
    response.set('Content-Length', contentLength)
  }
  response.send(buffer)
}

module.exports = {
  proxyRemoteAsset,
}
