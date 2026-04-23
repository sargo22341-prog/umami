import { useNavigate } from "react-router-dom"

import { logoutUseCase } from "@/infrastructure/container.ts"
import { getEnv } from "@/shared/utils/env.ts"
import { clearStoredMealieAuth, getStoredMealieToken } from "@/shared/utils/mealieAuthStorage.ts"

export function useSettingsSession() {
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await logoutUseCase.execute()
    } catch {
      // Ignore: local session should always be cleared.
    } finally {
      clearStoredMealieAuth()
      navigate("/login", { replace: true })
    }
  }

  return {
    mealieUrl: getEnv("VITE_MEALIE_URL") || "Non defini",
    hasStoredToken: Boolean(getStoredMealieToken()),
    handleLogout,
  }
}
