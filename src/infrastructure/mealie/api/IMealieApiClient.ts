export interface IMealieApiClient {
  get<T>(path: string): Promise<T>
  post<T>(path: string, body: unknown): Promise<T>
  put<T>(path: string, body: unknown): Promise<T>
  patch<T>(path: string, body: unknown): Promise<T>
  delete(path: string): Promise<void>
  uploadImage(slug: string, file: File): Promise<void>
  uploadRecipeAsset(
    slug: string,
    payload: {
      name: string
      icon: string
      extension: string
      file: File
    },
  ): Promise<void>
  uploadUserImage(userId: string, file: File): Promise<void>
}
