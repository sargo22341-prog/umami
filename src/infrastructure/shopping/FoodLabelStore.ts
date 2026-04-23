/**
 * Persistent reference: food key → Mealie label ID.
 * Stored in localStorage so it survives page reloads.
 * Keys are normalized via extractFoodKey (lowercase, units stripped).
 */

const STORAGE_KEY = "umami:food_labels"

function load(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") as Record<string, string>
  } catch {
    return {}
  }
}

function save(map: Record<string, string>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
}

export const foodLabelStore = {
  lookup(foodKey: string): string | undefined {
    if (!foodKey) return undefined
    return load()[foodKey]
  },

  set(foodKey: string, labelId: string): void {
    if (!foodKey) return
    const map = load()
    map[foodKey] = labelId
    save(map)
  },

  remove(foodKey: string): void {
    if (!foodKey) return
    const map = load()
    delete map[foodKey]
    save(map)
  },
}
