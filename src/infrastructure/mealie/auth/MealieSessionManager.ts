import { clearStoredMealieAuth } from "@/shared/utils/mealieAuthStorage.ts"

const SESSION_MESSAGE_KEY = "umami-mealie-session-message"
const INVALID_CREDENTIALS_DETAIL = "Could not validate credentials"

export interface MealieErrorPayload {
  detail?: string
}

function normalizeSessionMessage(message?: string | null): string {
  const trimmed = message?.trim()
  if (!trimmed || trimmed === INVALID_CREDENTIALS_DETAIL) {
    return "Votre session Mealie a expire. Reconnectez-vous."
  }
  return trimmed
}

export function isInvalidMealieSession(status: number, payload?: MealieErrorPayload | null): boolean {
  if (status === 401 || status === 403) return true
  return payload?.detail === INVALID_CREDENTIALS_DETAIL
}

export function handleInvalidMealieSession(message?: string): void {
  sessionStorage.setItem(SESSION_MESSAGE_KEY, normalizeSessionMessage(message))
  clearStoredMealieAuth()
}

export function consumeMealieSessionMessage(): string | null {
  const message = sessionStorage.getItem(SESSION_MESSAGE_KEY)
  if (!message) return null
  sessionStorage.removeItem(SESSION_MESSAGE_KEY)
  return message
}
