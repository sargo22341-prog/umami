'use strict'

const { marmitonRecipeProvider } = require('./marmiton/provider.cjs')
const { jowRecipeProvider } = require('./jow/provider.cjs')
const { recipe750gProvider } = require('./750g/provider.cjs')

const providers = [
  marmitonRecipeProvider,
  jowRecipeProvider,
  recipe750gProvider,
]

function listRecipeProviders() {
  return providers
}

function getRecipeProvider(source) {
  return providers.find((provider) => provider.id === source) || null
}

module.exports = {
  getRecipeProvider,
  listRecipeProviders,
}
