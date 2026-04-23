import { getEnv } from "@/shared/utils/env.ts"

export type Theme = "light" | "dark" | "system"

export interface AccentColor {
  id: string
  name: string
  color: string
  isCustom?: boolean
}

export const ACCENT_COLORS: AccentColor[] = [
  { id: "orange", name: "Orange", color: "rgb(223, 89, 27)" },
  { id: "blue", name: "Bleu", color: "rgba(52, 112, 215, 1)" },
  { id: "violet", name: "Violet", color: "rgba(114, 73, 217, 1)" },
  { id: "green", name: "Vert", color: "rgba(72, 152, 101, 1)" },
  { id: "rose", name: "Rose", color: "rgba(219, 86, 126, 1)" },
  { id: "teal", name: "Teal", color: "rgba(48, 156, 161, 1)" },
  { id: "amber", name: "Ambre", color: "rgba(217, 150, 57, 1)" },
  { id: "indigo", name: "Indigo", color: "rgba(82, 86, 210, 1)" },
]

const THEME_KEY = "umami_theme"
const ACCENT_KEY = "umami_accent"
const CUSTOM_ACCENT_KEY = "umami_accent_custom"
const CUSTOM_ACCENT_ID = "custom"
const ENV_ACCENT_COLORS = getEnv("VITE_ACCENT_COLORS").trim()

function getSystemPreference(): "light" | "dark" {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

function parseCssColor(value: string): { r: number; g: number; b: number; a: number } | null {
  if (typeof document === "undefined") return null

  const probe = document.createElement("span")
  probe.style.color = ""
  probe.style.color = value
  if (!probe.style.color) return null

  document.body.appendChild(probe)
  const computed = window.getComputedStyle(probe).color
  document.body.removeChild(probe)

  const match = computed.match(/rgba?\(([^)]+)\)/i)
  if (!match) return null

  const parts = match[1].split(",").map((part) => part.trim())
  const r = Number(parts[0])
  const g = Number(parts[1])
  const b = Number(parts[2])
  const a = parts[3] !== undefined ? Number(parts[3]) : 1

  if ([r, g, b, a].some((part) => Number.isNaN(part))) return null
  return { r, g, b, a }
}

function toRgbaString(color: { r: number; g: number; b: number; a: number }): string {
  return `rgba(${Math.round(color.r)}, ${Math.round(color.g)}, ${Math.round(color.b)}, ${color.a})`
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function makeDarkVariant(color: string): string {
  const parsed = parseCssColor(color)
  if (!parsed) return color

  return toRgbaString({
    r: parsed.r + (255 - parsed.r) * 0.12,
    g: parsed.g + (255 - parsed.g) * 0.12,
    b: parsed.b + (255 - parsed.b) * 0.12,
    a: parsed.a,
  })
}

function toHexColor(color: string): string {
  const parsed = parseCssColor(color)
  if (!parsed) return "#c5673a"

  const toHex = (value: number) => clamp(Math.round(value), 0, 255).toString(16).padStart(2, "0")
  return `#${toHex(parsed.r)}${toHex(parsed.g)}${toHex(parsed.b)}`
}

function normalizeAccentColor(value: string): string | null {
  const parsed = parseCssColor(value)
  return parsed ? toRgbaString(parsed) : null
}

function getPresetAccentById(id: string | null): AccentColor | undefined {
  if (!id) return undefined
  return ACCENT_COLORS.find((color) => color.id === id)
}

function getEnvAccent(): AccentColor {
  const preset = getPresetAccentById(ENV_ACCENT_COLORS)
  if (preset) return preset

  const normalized = normalizeAccentColor(ENV_ACCENT_COLORS)
  if (normalized) {
    return {
      id: CUSTOM_ACCENT_ID,
      name: "Couleur perso",
      color: normalized,
      isCustom: true,
    }
  }

  return ACCENT_COLORS[0]
}

function getStoredCustomAccent(): string | null {
  try {
    return normalizeAccentColor(localStorage.getItem(CUSTOM_ACCENT_KEY) ?? "")
  } catch {
    return null
  }
}

export function getAccentColorPickerValue(color: AccentColor): string {
  return toHexColor(color.color)
}

export function getCustomAccentPreview(): string {
  const storedCustom = getStoredCustomAccent()
  if (storedCustom) return storedCustom

  const envAccent = getEnvAccent()
  if (envAccent.isCustom) return envAccent.color

  return ACCENT_COLORS[0].color
}

export function hasCustomAccentPreview(): boolean {
  if (getStoredCustomAccent()) return true
  return Boolean(getEnvAccent().isCustom)
}

export class ThemeService {
  private _systemMediaQuery: MediaQueryList | null = null
  private _systemHandler: (() => void) | null = null

  getTheme(): Theme {
    const envTheme = getEnv("VITE_THEME")

    const isTheme = (v: unknown): v is Theme =>
      v === "light" || v === "dark" || v === "system"

    try {
      const stored = localStorage.getItem(THEME_KEY)
      if (isTheme(stored)) return stored
    } catch { /* localStorage unavailable */ }

    if (isTheme(envTheme)) {
      return envTheme
    }

    return "system"
  }

  setTheme(theme: Theme): void {
    try {
      localStorage.setItem(THEME_KEY, theme)
    } catch { /* localStorage unavailable */ }

    this.apply()
  }

  getAccentColor(): AccentColor {
    try {
      const storedId = localStorage.getItem(ACCENT_KEY)

      if (storedId === CUSTOM_ACCENT_ID) {
        const customColor = getStoredCustomAccent()
        if (customColor) {
          return {
            id: CUSTOM_ACCENT_ID,
            name: "Couleur perso",
            color: customColor,
            isCustom: true,
          }
        }
      }

      const preset = getPresetAccentById(storedId)
      if (preset) return preset
    } catch { /* localStorage unavailable */ }

    return getEnvAccent()
  }

  setAccentColor(color: AccentColor): void {
    try {
      localStorage.setItem(ACCENT_KEY, color.id)
      if (color.isCustom) {
        localStorage.setItem(CUSTOM_ACCENT_KEY, color.color)
      }
    } catch { /* localStorage unavailable */ }
    this.apply()
  }

  setCustomAccentColor(color: string): AccentColor {
    const normalized = normalizeAccentColor(color) ?? "rgba(197, 103, 58, 1)"
    const accent: AccentColor = {
      id: CUSTOM_ACCENT_ID,
      name: "Couleur perso",
      color: normalized,
      isCustom: true,
    }

    try {
      localStorage.setItem(ACCENT_KEY, CUSTOM_ACCENT_ID)
      localStorage.setItem(CUSTOM_ACCENT_KEY, normalized)
    } catch { /* localStorage unavailable */ }

    this.apply()
    return accent
  }

  apply(): void {
    const theme = this.getTheme()
    const accent = this.getAccentColor()

    const resolved = theme === "system" ? getSystemPreference() : theme
    document.documentElement.classList.toggle("dark", resolved === "dark")

    const primaryColor = resolved === "dark" ? makeDarkVariant(accent.color) : accent.color

    document.documentElement.style.setProperty("--color-primary", primaryColor)
    document.documentElement.style.setProperty("--color-ring", primaryColor)

    this._removeSystemListener()
    if (theme === "system") {
      this._setupSystemListener()
    }
  }

  private _setupSystemListener(): void {
    this._systemMediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    this._systemHandler = () => this.apply()
    this._systemMediaQuery.addEventListener("change", this._systemHandler)
  }

  private _removeSystemListener(): void {
    if (this._systemMediaQuery && this._systemHandler) {
      this._systemMediaQuery.removeEventListener("change", this._systemHandler)
      this._systemMediaQuery = null
      this._systemHandler = null
    }
  }
}

export const themeService = new ThemeService()
