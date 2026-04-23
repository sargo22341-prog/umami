import { UserRepository } from "../user/UserRepository.ts"

export class AuthService {
  private userId: string | null = null
  private readonly userRepository = new UserRepository()

  async getUserId(): Promise<string> {
    if (this.userId) return this.userId

    const res = await this.userRepository.getSelf()

    this.userId = res.id
    return res.id
  }
}
