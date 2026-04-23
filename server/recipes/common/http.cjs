'use strict'

const DEFAULT_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
  'Accept-Language': 'fr-FR,fr;q=0.9',
}

async function fetchWithDefaults(url, options = {}) {
  const {
    headers,
    timeoutMs = 10000,
    ...rest
  } = options

  return fetch(url, {
    ...rest,
    headers: {
      ...DEFAULT_HEADERS,
      ...headers,
    },
    signal: AbortSignal.timeout(timeoutMs),
  })
}

async function readJsonSafely(response) {
  return response.json().catch(() => null)
}

module.exports = {
  DEFAULT_HEADERS,
  fetchWithDefaults,
  readJsonSafely,
}
