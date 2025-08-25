import { User } from "@/src/domain/entities/User";
import type {
  IAuthRepository,
  LoginRequest,
  RegisterRequest,
} from "../../domain/interfaces/IAuthRepository";

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

  async uploadImage(userId: string, file: File): Promise<string> {
    return this.authRepository.uploadImage(userId, file);
  }

  async uploadImageMessage(userId: string, file: File): Promise<string> {
    return this.authRepository.uploadImageMessage(userId, file);
  }
}
