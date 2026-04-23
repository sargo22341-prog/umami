import type { IUserRecipeRepository } from "@/domain/user/IUserRecipeRepository.ts"

export class ToggleFavoriteUseCase {
    private userRecipeRepository: IUserRecipeRepository

    constructor(userRecipeRepository: IUserRecipeRepository) {
        this.userRecipeRepository = userRecipeRepository
    }

    async execute(slug: string, isFavorite: boolean): Promise<void> {
        return this.userRecipeRepository.toggleFavorite(slug, isFavorite)
    }
}