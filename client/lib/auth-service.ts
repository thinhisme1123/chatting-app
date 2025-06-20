import { apiClient } from "./api-client"

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  username: string
  password: string
}

export interface User {
  id: string
  email: string
  username: string
  avatar?: string
  isOnline: boolean
  lastSeen: Date
  createdAt: Date
}

export interface AuthResponse {
  user: User
  token: string
}

export class AuthService {
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.instance.post("/auth/login", data)

    // Save token to localStorage
    localStorage.setItem("auth_token", response.data.token)

    return response.data
  }

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await apiClient.instance.post("/auth/register", data)

    // Save token to localStorage
    localStorage.setItem("auth_token", response.data.token)

    return response.data
  }

  async getCurrentUser(): Promise<User> {
    const response = await apiClient.instance.get("/auth/me")
    return response.data
  }

  async logout(): Promise<void> {
    try {
      await apiClient.instance.post("/auth/logout")
    } finally {
      localStorage.removeItem("auth_token")
    }
  }

  async refreshToken(): Promise<AuthResponse> {
    const response = await apiClient.instance.post("/auth/refresh")
    localStorage.setItem("auth_token", response.data.token)
    return response.data
  }
}

export const authService = new AuthService()
