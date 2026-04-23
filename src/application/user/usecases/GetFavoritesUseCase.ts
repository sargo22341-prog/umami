import type { IUserRecipeRepository } from "@/domain/user/IUserRecipeRepository.ts"
import type { MealieUserRatingsUserRatingOut } from "@/shared/types/mealie/User.ts"

export class GetFavoritesUseCase {
    private userRecipeRepository: IUserRecipeRepository

    constructor(userRecipeRepository: IUserRecipeRepository) {
        this.userRecipeRepository = userRecipeRepository
    }

     async execute(): Promise<MealieUserRatingsUserRatingOut> {
        return this.userRecipeRepository.getFavorites()
    }
    
}