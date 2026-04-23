export class RecipeSourceError extends Error {
  readonly code: "invalid_url" | "unsupported_source" | "provider_error"

  constructor(
    code: "invalid_url" | "unsupported_source" | "provider_error",
    message: string,
  ) {
    super(message)
    this.name = "RecipeSourceError"
    this.code = code
  }
}
