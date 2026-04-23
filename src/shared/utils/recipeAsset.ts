export interface RecipeAssetUploadPayload {
  name: string
  icon: string
  extension: string
  file: File
}

function getFileExtension(file: File): string {
  const extensionFromName = file.name.split(".").pop()?.trim().toLowerCase()
  if (extensionFromName) return extensionFromName

  if (file.type === "application/json") return "json"
  if (file.type.startsWith("video/")) return file.type.replace("video/", "").toLowerCase()
  return "bin"
}

function getAssetIcon(file: File): string {
  if (file.type === "application/json") return "file-json"
  if (file.type.startsWith("video/")) return "video"
  if (file.type.startsWith("image/")) return "photo"
  return "file"
}

function getAssetName(file: File): string {
  return file.name.replace(/\.[^.]+$/, "") || file.name
}

export function buildRecipeAssetPayload(file: File): RecipeAssetUploadPayload {
  return {
    name: getAssetName(file),
    icon: getAssetIcon(file),
    extension: getFileExtension(file),
    file,
  }
}
