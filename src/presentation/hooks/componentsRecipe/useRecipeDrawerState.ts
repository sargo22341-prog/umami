import { useEffect, useState } from "react"

export function useRecipeDrawerState() {
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null)
  const [drawerClosing, setDrawerClosing] = useState(false)

  useEffect(() => {
    if (selectedSlug) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }

    return () => {
      document.body.style.overflow = ""
    }
  }, [selectedSlug])

  const closeDrawer = () => {
    setDrawerClosing(true)
    setTimeout(() => {
      setSelectedSlug(null)
      setDrawerClosing(false)
    }, 240)
  }

  const selectSlug = (slug: string) => {
    if (slug === selectedSlug) {
      closeDrawer()
      return
    }

    setSelectedSlug(slug)
    setDrawerClosing(false)
  }

  return {
    selectedSlug,
    drawerClosing,
    closeDrawer,
    selectSlug,
  }
}
