import { useState } from "react"

import {
  getAccentColorPickerValue,
  getCustomAccentPreview,
  hasCustomAccentPreview,
} from "@/infrastructure/theme/ThemeService.ts"
import { useTheme } from "hooks/common/useTheme.ts"

export function useSettingsAppearance() {
  const { theme, setTheme, accentColor, setAccentColor, setCustomAccentColor } = useTheme()
  const [accentPickerOpen, setAccentPickerOpen] = useState(false)
  const [pendingAccentHex, setPendingAccentHex] = useState("")

  const customAccentPreview = accentColor.isCustom ? accentColor.color : getCustomAccentPreview()
  const hasCustomPreview = accentColor.isCustom || hasCustomAccentPreview()
  const customAccentHex = getAccentColorPickerValue(
    accentColor.isCustom
      ? accentColor
      : { id: "custom", name: "Couleur perso", color: customAccentPreview, isCustom: true },
  )

  const openAccentPicker = () => {
    setPendingAccentHex(customAccentHex)
    setAccentPickerOpen(true)
  }

  const submitCustomAccentColor = () => {
    setCustomAccentColor(pendingAccentHex)
    setAccentPickerOpen(false)
  }

  return {
    theme,
    setTheme,
    accentColor,
    setAccentColor,
    accentPickerOpen,
    setAccentPickerOpen,
    pendingAccentHex,
    setPendingAccentHex,
    customAccentPreview,
    hasCustomPreview,
    openAccentPicker,
    submitCustomAccentColor,
  }
}
