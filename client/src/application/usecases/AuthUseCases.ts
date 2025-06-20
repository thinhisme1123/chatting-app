import { User } from "@/src/domain/entities/User";
import type {
  IAuthRepository,
  LoginRequest,
  RegisterRequest,
} from "../../domain/repositories/IAuthRepository";

export class AuthUseCases {
  constructor(private authRepository: IAuthRepository) {}

  async login(request: LoginRequest) {
    return await this.authRepository.login(request);
  }

  async register(request: RegisterRequest) {
    return await this.authRepository.register(request);
  }

  async logout() {
    return await this.authRepository.logout();
  }

  async getCurrentUser() {
    return await this.authRepository.getCurrentUser();
  }
  async getAllUsers(currentUserId: string): Promise<User[] | null> {
    return this.authRepository.getAllUsers(currentUserId);
  }
}
