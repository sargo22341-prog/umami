'use strict'

const express = require('express')
const { createAssetRoutes } = require('./recipes/routes/assetRoutes.cjs')
const { createRecipeRoutes } = require('./recipes/routes/recipeRoutes.cjs')

const app = express()
const PORT = 3001

app.use(express.json({ limit: '1mb' }))
app.use(['/recipes-search', '/api/recipes-search'], createRecipeRoutes())
app.use(['/recipes-asset', '/api/recipes-asset'], createAssetRoutes())

app.listen(PORT, () => {
  console.log(`[RecipesSearchProxy] Listening on http://127.0.0.1:${PORT}`)
})
