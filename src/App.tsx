import { Suspense, lazy, useEffect, useState, type LazyExoticComponent, type ComponentType } from "react"
import { Routes, Route, Navigate, Outlet } from "react-router-dom"
import { Layout } from "./presentation/components/common/global/Layout.tsx"
import { RouteFallback } from "./presentation/components/common/global/RouteFallback.tsx"
import { getStoredMealieToken, subscribeToMealieAuthChanges } from "./shared/utils/mealieAuthStorage.ts"

function lazyPage<T extends ComponentType<object>>(
  loader: () => Promise<{ default: T }>,
): LazyExoticComponent<T> {
  return lazy(loader)
}

const AuthPage = lazyPage(() =>
  import("./presentation/pages/LoginPage.tsx").then((module) => ({ default: module.AuthPage })),
)
const RecipesPage = lazyPage(() =>
  import("./presentation/pages/RecipesPage.tsx").then((module) => ({ default: module.RecipesPage })),
)
const FavoritesPage = lazyPage(() =>
  import("./presentation/pages/FavoritesPage.tsx").then((module) => ({ default: module.FavoritesPage })),
)
const ExploreRecipesPage = lazyPage(() =>
  import("./presentation/pages/ExploreRecipesPage.tsx").then((module) => ({ default: module.ExploreRecipesPage })),
)
const RecipeAddPage = lazyPage(() =>
  import("./presentation/pages/RecipeAddPage.tsx").then((module) => ({ default: module.RecipeAddPage })),
)
const RecipeDetailPage = lazyPage(() =>
  import("./presentation/pages/RecipeDetailPage.tsx").then((module) => ({ default: module.RecipeDetailPage })),
)
const PlanningPage = lazyPage(() =>
  import("./presentation/pages/planning/PlanningPage.tsx").then((module) => ({ default: module.PlanningPage })),
)
const StatsPage = lazyPage(() =>
  import("./presentation/pages/StatsPage.tsx").then((module) => ({ default: module.StatsPage })),
)
const ShoppingPage = lazyPage(() =>
  import("./presentation/pages/ShoppingPage.tsx").then((module) => ({ default: module.ShoppingPage })),
)
const SettingsPage = lazyPage(() =>
  import("./presentation/pages/SettingsPage.tsx").then((module) => ({ default: module.SettingsPage })),
)
const ToolsManagementPage = lazyPage(() =>
  import("./presentation/pages/Maintenance/ToolsManagementPage.tsx").then((module) => ({ default: module.ToolsManagementPage })),
)
const CategoriesManagementPage = lazyPage(() =>
  import("./presentation/pages/Maintenance/CategoriesManagementPage.tsx").then((module) => ({ default: module.CategoriesManagementPage })),
)
const TagsManagementPage = lazyPage(() =>
  import("./presentation/pages/Maintenance/TagsManagementPage.tsx").then((module) => ({ default: module.TagsManagementPage })),
)
const LabelsManagementPage = lazyPage(() =>
  import("./presentation/pages/Maintenance/LabelsManagementPage.tsx").then((module) => ({ default: module.LabelsManagementPage })),
)
const UnitsManagementPage = lazyPage(() =>
  import("./presentation/pages/Maintenance/UnitsManagementPage.tsx").then((module) => ({ default: module.UnitsManagementPage })),
)
const FoodsManagementPage = lazyPage(() =>
  import("./presentation/pages/Maintenance/FoodsManagementPage.tsx").then((module) => ({ default: module.FoodsManagementPage })),
)
const ProfilePage = lazyPage(() =>
  import("./presentation/pages/ProfilePage.tsx").then((module) => ({ default: module.ProfilePage })),
)

function ProtectedRoute() {
  const [token, setToken] = useState(() => getStoredMealieToken())

  useEffect(() => {
    return subscribeToMealieAuthChanges(() => {
      setToken(getStoredMealieToken())
    })
  }, [])

  if (!token) {
    return <Navigate to="/login" replace />
  }
  return <Outlet />
}

function renderLazyPage(Page: LazyExoticComponent<ComponentType<object>>) {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Page />
    </Suspense>
  )
}

function App() {
  return (
    <Routes>
      <Route path="login" element={renderLazyPage(AuthPage)} />
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route index element={<Navigate to="/recipes" replace />} />
          <Route path="recipes" element={renderLazyPage(RecipesPage)} />
          <Route path="favorites" element={renderLazyPage(FavoritesPage)} />
          <Route path="explore" element={renderLazyPage(ExploreRecipesPage)} />
          <Route path="recipes/new" element={renderLazyPage(RecipeAddPage)} />
          <Route path="recipes/:slug" element={renderLazyPage(RecipeDetailPage)} />
          <Route path="planning" element={renderLazyPage(PlanningPage)} />
          <Route path="stats" element={renderLazyPage(StatsPage)} />
          <Route path="shopping" element={renderLazyPage(ShoppingPage)} />
          <Route path="settings" element={renderLazyPage(SettingsPage)} />
          <Route path="settings/tools" element={renderLazyPage(ToolsManagementPage)} />
          <Route path="settings/categories" element={renderLazyPage(CategoriesManagementPage)} />
          <Route path="settings/tags" element={renderLazyPage(TagsManagementPage)} />
          <Route path="settings/labels" element={renderLazyPage(LabelsManagementPage)} />
          <Route path="settings/units" element={renderLazyPage(UnitsManagementPage)} />
          <Route path="settings/foods" element={renderLazyPage(FoodsManagementPage)} />
          <Route path="profile" element={renderLazyPage(ProfilePage)} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/recipes" replace />} />
    </Routes>
  )
}

export default App
