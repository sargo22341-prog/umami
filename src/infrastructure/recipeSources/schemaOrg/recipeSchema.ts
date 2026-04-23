export type SchemaObject = Record<string, unknown>

export interface RecipeInstructionImageMapping {
  stepIndex: number
  imageUrl: string
  instructionText: string
}

export function normalizeSchemaType(value: unknown): string[] {
  if (typeof value === "string") return [value]
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string")
  }
  return []
}

export function isSchemaObject(value: unknown): value is SchemaObject {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

export function absolutizeSchemaUrl(value: string, baseUrl: string): string {
  try {
    return new URL(value, baseUrl).toString()
  } catch {
    return value
  }
}

export function extractSchemaAssetUrl(value: unknown, baseUrl: string): string {
  if (!value) return ""

  if (typeof value === "string") {
    return absolutizeSchemaUrl(value.trim(), baseUrl)
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const nextUrl = extractSchemaAssetUrl(item, baseUrl)
      if (nextUrl) return nextUrl
    }

    return ""
  }

  if (isSchemaObject(value)) {
    return (
      extractSchemaAssetUrl(value.url, baseUrl)
      || extractSchemaAssetUrl(value.contentUrl, baseUrl)
      || extractSchemaAssetUrl(value.thumbnailUrl, baseUrl)
    )
  }

  return ""
}

export function extractSchemaInstructionText(value: unknown): string {
  if (typeof value === "string") return value.trim()
  if (!isSchemaObject(value)) return ""

  const textCandidate = [value.text, value.name, value.title, value.headline]
    .find((item) => typeof item === "string" && item.trim())

  return typeof textCandidate === "string" ? textCandidate.trim() : ""
}

export function findRecipeObject(payload: unknown): SchemaObject | null {
  const queue: unknown[] = Array.isArray(payload) ? [...payload] : [payload]
  const seen = new Set<unknown>()

  while (queue.length > 0) {
    const current = queue.shift()
    if (!isSchemaObject(current) || seen.has(current)) continue
    seen.add(current)

    const types = normalizeSchemaType(current["@type"])
    if (types.includes("Recipe")) {
      return current
    }

    for (const value of Object.values(current)) {
      if (Array.isArray(value)) {
        queue.push(...value)
      } else if (isSchemaObject(value)) {
        queue.push(value)
      }
    }
  }

  return null
}

export function collectInstructionImageMappings(
  instructions: unknown,
  baseUrl: string,
): RecipeInstructionImageMapping[] {
  const mappings: RecipeInstructionImageMapping[] = []
  let stepCounter = 0

  const visit = (node: unknown) => {
    if (Array.isArray(node)) {
      node.forEach(visit)
      return
    }

    if (typeof node === "string") {
      if (node.trim()) {
        stepCounter += 1
      }
      return
    }

    if (!isSchemaObject(node)) return

    const types = normalizeSchemaType(node["@type"])
    if (types.includes("HowToSection")) {
      visit(node.itemListElement ?? node.steps ?? node.recipeInstructions)
      return
    }

    const nestedInstructions = node.itemListElement ?? node.steps
    const looksLikeStep = types.includes("HowToStep")
      || typeof node.text === "string"
      || typeof node.name === "string"
      || typeof node.url === "string"

    if (looksLikeStep) {
      stepCounter += 1
      const imageUrl = extractSchemaAssetUrl(node.image, baseUrl)
      if (imageUrl) {
        mappings.push({
          stepIndex: stepCounter,
          imageUrl,
          instructionText: extractSchemaInstructionText(node),
        })
      }

      if (nestedInstructions) {
        visit(nestedInstructions)
      }
      return
    }

    if (nestedInstructions) {
      visit(nestedInstructions)
    }
  }

  visit(instructions)
  return mappings
}
