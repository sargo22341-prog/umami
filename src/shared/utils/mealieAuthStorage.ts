const STORAGE_KEYS = {
  MEALIE_URL: 'umami-mealie-url',
  MEALIE_TOKEN: 'umami-mealie-token',
} as const

const MEALIE_AUTH_CHANGED_EVENT = 'mealie-auth-changed'

function notifyMealieAuthChanged(): void {
  window.dispatchEvent(new Event(MEALIE_AUTH_CHANGED_EVENT))
}

export function getStoredMealieUrl(): string | null {
  return localStorage.getItem(STORAGE_KEYS.MEALIE_URL)
}

export function setStoredMealieUrl(url: string): void {
  localStorage.setItem(STORAGE_KEYS.MEALIE_URL, url)
  notifyMealieAuthChanged()
}

export function getStoredMealieToken(): string | null {
  return localStorage.getItem(STORAGE_KEYS.MEALIE_TOKEN)
}

export function setStoredMealieToken(token: string): void {
  localStorage.setItem(STORAGE_KEYS.MEALIE_TOKEN, token)
  notifyMealieAuthChanged()
}

export function clearStoredMealieAuth(): void {
  localStorage.removeItem(STORAGE_KEYS.MEALIE_URL)
  localStorage.removeItem(STORAGE_KEYS.MEALIE_TOKEN)
  notifyMealieAuthChanged()
}

export function subscribeToMealieAuthChanges(listener: () => void): () => void {
  window.addEventListener(MEALIE_AUTH_CHANGED_EVENT, listener)
  window.addEventListener('storage', listener)

  return () => {
    window.removeEventListener(MEALIE_AUTH_CHANGED_EVENT, listener)
    window.removeEventListener('storage', listener)
  }
}
