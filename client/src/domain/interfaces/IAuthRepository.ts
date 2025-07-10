import type { User } from "../entities/User"

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  username: string
  password: string
}

export interface AuthResponse {
  user: User
  token: string
}

export interface IAuthRepository {
  login(request: LoginRequest): Promise<AuthResponse>
  register(request: RegisterRequest): Promise<AuthResponse>
  logout(): Promise<void>
  getCurrentUser(): Promise<User | null>
  getAllUsers(currentUserId: string): Promise<User [] | null>
}
