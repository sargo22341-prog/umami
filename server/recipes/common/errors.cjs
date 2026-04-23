'use strict'

class RecipeProxyError extends Error {
  constructor(message, options = {}) {
    super(message)
    this.name = 'RecipeProxyError'
    this.code = options.code || 'provider_error'
    this.status = options.status || 500
    this.details = options.details
  }
}

function isRecipeProxyError(error) {
  return error instanceof RecipeProxyError
}

module.exports = {
  RecipeProxyError,
  isRecipeProxyError,
}
