/**
 * Extracts the core food name from an ingredient note by stripping
 * leading quantities, units, and prepositions.
 *
 * Examples:
 *   "200g de gruyère" → "gruyère"
 *   "1 oignon rouge"  → "oignon rouge"
 *   "2 cuillères à soupe de crème" → "crème"
 *   "sel" → "sel"
 */
export function extractFoodKey(note: string): string {
  let s = note.trim()

  // Strip leading numbers (integers, decimals, fractions like 1/2)
  s = s.replace(/^\d+([.,/]\d+)?\s*/, "")

  // Strip unicode fractions
  s = s.replace(/^[½⅓⅔¼¾⅛⅜⅝⅞]\s*/, "")

  // Strip common units (order: longest first to avoid partial matches)
  const units = [
    "cuillères? à soupe",
    "cuillères? à café",
    "cuillères?",
    "litres?",
    "sachets?",
    "tranches?",
    "feuilles?",
    "gousses?",
    "pincées?",
    "bottes?",
    "verres?",
    "tasses?",
    "bols?",
    "cas",
    "cac",
    "kg",
    "mg",
    "dl",
    "cl",
    "ml",
    "cs",
    "cc",
    "g",
    "l",
  ]
  // L'unité doit être suivie d'un espace ou d'un chiffre pour ne pas croquer le début d'un mot
  const unitPattern = new RegExp(`^(${units.join("|")})s?(?=\\s|\\d|$)\\s*`, "i")
  s = s.replace(unitPattern, "")

  // Strip "de " ou "d'" (préposition) mais pas un "d" seul collé à un mot
  s = s.replace(/^d(?:e\s+|')/i, "")

  return s.trim().toLowerCase()
}

/**
 * Filters and sorts food options by relevance to the query.
 * Prioritizes exact matches, then starts with, then contains.
 */
export function filterAndSortFoodsByRelevance(
  query: string,
  foods: { id: string; name: string }[]
): { id: string; label: string }[] {
  if (!query.trim()) {
    return foods.map(f => ({ id: f.id, label: f.name }))
  }

  const lowerQuery = query.toLowerCase().trim()

  const scored = foods
    .filter(food => food.name.toLowerCase().includes(lowerQuery))
    .map(food => {
      const lowerName = food.name.toLowerCase()
      let score = 0
      if (lowerName === lowerQuery) score = 100
      else if (lowerName.startsWith(lowerQuery)) score = 50
      else if (lowerName.includes(lowerQuery)) score = 25
      return { food, score }
    })
    .sort((a, b) => b.score - a.score)

  return scored.map(s => ({ id: s.food.id, label: s.food.name }))
}
