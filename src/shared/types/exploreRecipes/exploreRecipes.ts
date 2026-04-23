export type ExploreImportState =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "ok"; message: string; slug?: string; imageWarning?: string | null }
  | { state: "error"; message: string }
