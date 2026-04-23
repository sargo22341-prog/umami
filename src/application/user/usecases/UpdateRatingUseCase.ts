import type { IUserRecipeRepository } from "@/domain/user/IUserRecipeRepository.ts"

export class UpdateRatingUseCase {
    private userRecipeRepository: IUserRecipeRepository

    constructor(userRecipeRepository: IUserRecipeRepository) {
        this.userRecipeRepository = userRecipeRepository
    }

    async execute(slug: string, rating: number): Promise<void> {
        return this.userRecipeRepository.updateRating(slug, rating)
    }
}