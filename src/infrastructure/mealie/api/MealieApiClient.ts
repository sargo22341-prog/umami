import type { IMealieApiClient } from "./IMealieApiClient.ts"
import {
  MealieApiError,
  MealieNotFoundError,
  MealieServerError,
  MealieUnauthorizedError,
} from "@/shared/types/errors.ts"
import { getEnv, isDockerRuntime } from "@/shared/utils/env.ts"
import { getStoredMealieToken } from "@/shared/utils/mealieAuthStorage.ts"
import {
  handleInvalidMealieSession,
  isInvalidMealieSession,
  type MealieErrorPayload,
} from "../auth/MealieSessionManager.ts"

// En dev : /api est proxie par Vite -> VITE_MEALIE_URL (pas de CORS).
// En prod Docker standard : /api est proxie par nginx.
// En prod sans Docker : requete directe vers VITE_MEALIE_URL depuis le navigateur.
function getBaseUrl(): string {
  if (import.meta.env.DEV) return ""
  if (isDockerRuntime()) return ""
  return getEnv("VITE_MEALIE_URL").replace(/\/+$/, "")
}

function getToken(): string {
  const token = getStoredMealieToken()
  if (!token) {
    throw new MealieUnauthorizedError("Authentication required")
  }
  return token
}

function normalizeMealieErrorMessage(message: string): string {
  const normalized = message.trim()

  if (normalized === "Recipe already exists") {
    return "Cette recette existe deja dans Mealie."
  }

  return normalized
}

function extractMessageFromPayload(payload: unknown): string | null {
  if (typeof payload === "string") {
    const normalized = payload.trim()
    return normalized ? normalizeMealieErrorMessage(normalized) : null
  }

  if (!payload || typeof payload !== "object") {
    return null
  }

  if ("message" in payload && typeof payload.message === "string") {
    const normalized = payload.message.trim()
    if (normalized) return normalizeMealieErrorMessage(normalized)
  }

  if ("detail" in payload) {
    return extractMessageFromPayload(payload.detail)
  }

  return null
}

async function readErrorResponse(response: Response): Promise<{
  message: string
  payload: MealieErrorPayload | null
}> {
  const raw = await response.text().catch(() => response.statusText)

  try {
    const payload = JSON.parse(raw) as MealieErrorPayload
    const fallbackMessage = raw.trim() || response.statusText
    return {
      message: extractMessageFromPayload(payload) ?? fallbackMessage,
      payload,
    }
  } catch {
    return {
      message: normalizeMealieErrorMessage(raw.trim() || response.statusText),
      payload: null,
    }
  }
}

function handleUnauthorizedResponse(
  status: number,
  message: string,
  payload: MealieErrorPayload | null,
): never {
  if (isInvalidMealieSession(status, payload)) {
    handleInvalidMealieSession(payload?.detail ?? message)
  }

  throw new MealieUnauthorizedError(payload?.detail ?? message)
}

export class MealieApiClient implements IMealieApiClient {
  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    const url = `${getBaseUrl()}${path}`

    const headers: Record<string, string> = {
      Authorization: `Bearer ${getToken()}`,
      "Content-Type": "application/json",
    }

    const response = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })

    if (!response.ok) {
      const { message, payload } = await readErrorResponse(response)

      if (response.status === 401 || response.status === 403) {
        handleUnauthorizedResponse(response.status, message, payload)
      }
      if (response.status === 404) {
        throw new MealieNotFoundError(message)
      }
      if (response.status >= 500) {
        throw new MealieServerError(message, response.status)
      }
      throw new MealieApiError(message, response.status)
    }

    if (response.status === 204) {
      return undefined as T
    }

    return (await response.json()) as T
  }

  async get<T>(path: string): Promise<T> {
    return this.request<T>("GET", path)
  }

  async post<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>("POST", path, body)
  }

  async put<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>("PUT", path, body)
  }

  async patch<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>("PATCH", path, body)
  }

  async delete(path: string): Promise<void> {
    await this.request<void>("DELETE", path)
  }

  async uploadImage(slug: string, file: File): Promise<void> {
    const formData = new FormData()
    formData.append("image", file)
    formData.append("extension", file.name.split(".").pop() ?? "jpg")
    const url = `${getBaseUrl()}/api/recipes/${slug}/image`
    const response = await fetch(url, {
      method: "PUT",
      headers: { Authorization: `Bearer ${getToken()}` },
      body: formData,
    })
    if (!response.ok) {
      const { message, payload } = await readErrorResponse(response)
      if (response.status === 401 || response.status === 403) {
        handleUnauthorizedResponse(response.status, message, payload)
      }
      throw new MealieApiError(message, response.status)
    }
  }

  async uploadRecipeAsset(
    slug: string,
    payload: {
      name: string
      icon: string
      extension: string
      file: File
    },
  ): Promise<void> {
    const formData = new FormData()
    formData.append("name", payload.name)
    formData.append("icon", payload.icon)
    formData.append("extension", payload.extension)
    formData.append("file", payload.file)

    const url = `${getBaseUrl()}/api/recipes/${slug}/assets`
    const response = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${getToken()}` },
      body: formData,
    })

    if (!response.ok) {
      const { message, payload: errorPayload } = await readErrorResponse(response)
      if (response.status === 401 || response.status === 403) {
        handleUnauthorizedResponse(response.status, message, errorPayload)
      }
      throw new MealieApiError(message, response.status)
    }
  }

  async uploadUserImage(userId: string, file: File): Promise<void> {
    const formData = new FormData()
    formData.append("profile", file)

    const url = `${getBaseUrl()}/api/users/${userId}/image`
    const response = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${getToken()}` },
      body: formData,
    })

    if (!response.ok) {
      const { message, payload } = await readErrorResponse(response)
      if (response.status === 401 || response.status === 403) {
        handleUnauthorizedResponse(response.status, message, payload)
      }
      throw new MealieApiError(message, response.status)
    }
  }
}
