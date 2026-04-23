import type { MealieUserBaseInput, MealieUserOut } from "@/shared/types/mealie/User.ts"
import { mealieApiClient } from "../api/index.ts"

export interface SaveUserProfileInput {
  userId: string
  profile: MealieUserBaseInput
  imageFile?: File | null
}

export class UserRepository {
  async getSelf(): Promise<MealieUserOut> {
    return mealieApiClient.get<MealieUserOut>("/api/users/self")
  }

  async updateById(userId: string, profile: MealieUserBaseInput): Promise<void> {
    await mealieApiClient.put(`/api/users/${userId}`, profile)
  }

  async uploadProfileImage(userId: string, file: File): Promise<void> {
    await mealieApiClient.uploadUserImage(userId, file)
  }

  async saveProfile({ userId, profile, imageFile }: SaveUserProfileInput): Promise<MealieUserOut> {
    await this.updateById(userId, profile)

    if (imageFile) {
      await this.uploadProfileImage(userId, imageFile)
    }

    return this.getSelf()
  }
}
