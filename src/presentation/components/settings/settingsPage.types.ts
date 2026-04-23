export type SettingsBatchDetailItem = {
  slug: string
  name: string
  description: string
  statusCode?: number | null
}

export type CalorieTagBatchCounts = {
  processed: number
  total: number
  added: number
  updated: number
  missingCalories: number
  skipped: number
  errors: number
}

export type CalorieSyncStatus =
  | { state: "idle" }
  | ({ state: "running"; currentRecipeName: string | null; lastMessage: string | null } & CalorieTagBatchCounts)
  | ({ state: "done"; currentRecipeName: string | null; lastMessage: string | null } & CalorieTagBatchCounts)
  | ({ state: "error"; message: string; currentRecipeName: string | null; lastMessage: string | null } & CalorieTagBatchCounts)

export type CalorieTagBatchDetails = {
  added: SettingsBatchDetailItem[]
  updated: SettingsBatchDetailItem[]
  missingCalories: SettingsBatchDetailItem[]
  skipped: SettingsBatchDetailItem[]
  errors: SettingsBatchDetailItem[]
}

export type JowVideoBatchCounts = {
  processed: number
  total: number
  jowDetected: number
  imported: number
  skippedExisting: number
  skippedNonJow: number
  skippedNoVideo: number
  errors: number
}

export type JowVideoBatchStatus =
  | { state: "idle" }
  | ({ state: "running"; currentRecipeName: string | null } & JowVideoBatchCounts)
  | ({ state: "done"; currentRecipeName: string | null } & JowVideoBatchCounts)
  | ({ state: "error"; message: string; currentRecipeName: string | null } & JowVideoBatchCounts)

export type IngredientLinkBatchCounts = {
  processed: number
  total: number
  updated: number
  alreadyUpToDate: number
  skippedNoInstructions: number
  skippedNoIngredients: number
  errors: number
}

export type IngredientLinkBatchStatus =
  | { state: "idle" }
  | ({ state: "running"; currentRecipeName: string | null; lastMessage: string | null } & IngredientLinkBatchCounts)
  | ({ state: "done"; currentRecipeName: string | null; lastMessage: string | null } & IngredientLinkBatchCounts)
  | ({ state: "error"; message: string; currentRecipeName: string | null; lastMessage: string | null } & IngredientLinkBatchCounts)

export type IngredientLinkBatchDetails = {
  errors: SettingsBatchDetailItem[]
  skippedNoIngredients: SettingsBatchDetailItem[]
  skippedNoInstructions: SettingsBatchDetailItem[]
}

export type RecipeSourceSyncBatchCounts = {
  processed: number
  total: number
  updated: number
  skippedNoSource: number
  skippedNoChanges: number
  skippedDeclined: number
  errors: number
}

export type RecipeSourceSyncBatchStatus =
  | { state: "idle" }
  | ({ state: "running"; currentRecipeName: string | null; lastMessage: string | null } & RecipeSourceSyncBatchCounts)
  | ({ state: "waitingReview"; currentRecipeName: string | null; lastMessage: string | null } & RecipeSourceSyncBatchCounts)
  | ({ state: "done"; currentRecipeName: string | null; lastMessage: string | null } & RecipeSourceSyncBatchCounts)
  | ({ state: "error"; message: string; currentRecipeName: string | null; lastMessage: string | null } & RecipeSourceSyncBatchCounts)

export type RecipeSourceSyncBatchDetails = {
  updated: SettingsBatchDetailItem[]
  skippedNoSource: SettingsBatchDetailItem[]
  skippedNoChanges: SettingsBatchDetailItem[]
  skippedDeclined: SettingsBatchDetailItem[]
  errors: SettingsBatchDetailItem[]
}
