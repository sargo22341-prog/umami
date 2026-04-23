export const DAY_LABELS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"]

export const MEAL_TYPES = [
  {
    key: "breakfast",
    label: "Petit déjeuner",
    mobileLabel: "Petit déjeuner",
    color: "bg-[rgba(255,244,214,0.55)] dark:bg-[rgba(255,244,214,0.08)]",
    borderColor: "border-[rgba(235,204,117,0.45)] dark:border-[rgba(235,204,117,0.22)]",
  },
  {
    key: "lunch",
    label: "Déjeuner",
    mobileLabel: "Déjeuner",
    color: "bg-[rgba(255,233,213,0.58)] dark:bg-[rgba(214,139,93,0.10)]",
    borderColor: "border-[rgba(214,139,93,0.40)] dark:border-[rgba(214,139,93,0.22)]",
  },
  {
    key: "snack",
    label: "Encas",
    mobileLabel: "Encas",
    color: "bg-[rgba(255,244,214,0.55)] dark:bg-[rgba(255,244,214,0.08)]",
    borderColor: "border-[rgba(235,204,117,0.45)] dark:border-[rgba(235,204,117,0.22)]",
  },
  {
    key: "dinner",
    label: "Dîner",
    mobileLabel: "Dîner",
    color: "bg-[rgba(255,233,213,0.58)] dark:bg-[rgba(214,139,93,0.10)]",
    borderColor: "border-[rgba(214,139,93,0.40)] dark:border-[rgba(214,139,93,0.22)]",
  },
] as const

export type MealTypeKey = (typeof MEAL_TYPES)[number]["key"]

export const MEAL_TYPE_ORDER: MealTypeKey[] = ["breakfast", "lunch", "snack", "dinner"]
export const MOBILE_GRID_ROWS = [
  ["breakfast", "snack"],
  ["lunch", "dinner"],
] as const

export const DRAG_THRESHOLD = 8
