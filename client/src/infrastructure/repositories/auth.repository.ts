import { type AxiosInstance } from "axios";
import type { User } from "../../domain/entities/User";
import type {
  AuthResponse,
  IAuthRepository,
  LoginRequest,
  RegisterRequest,
} from "../../domain/interfaces/IAuthRepository";
import { ApiClient } from "../api/ApiClient";

export class AuthRepository implements IAuthRepository {
  private readonly apiClient: AxiosInstance;

  constructor() {
    this.apiClient = new ApiClient().instance;
  }

  async login(request: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await this.apiClient.post("/auth/login", request, {
        withCredentials: true, // 
      });

      if (response.data.token) {
        localStorage.setItem("auth_token", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user));
      }

      return response.data;
    } catch (err: any) {
      console.error("Login failed:", err.response?.data || err.message);
      throw err;
    }
  }

  async register(request: RegisterRequest): Promise<AuthResponse> {
    console.log(request);
    const response = await this.apiClient.post("/auth/register", request, {
      withCredentials: true,
    });

    // Save token to localStorage
    if (response.data.token) {
      localStorage.setItem("auth_token", response.data.token);
    }

    return response.data;
  }

  async logout(): Promise<void> {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user");
    return Promise.resolve();
  }

  async getCurrentUser(): Promise<User | null> {
    const user = localStorage.getItem("user");
    const token = localStorage.getItem("auth_token");

    if (user && token) {
      return Promise.resolve(JSON.parse(user));
    }

    return Promise.resolve(null);
  }

  async getAllUsers(currentUserId: string): Promise<User[]> {
    const token = localStorage.getItem("auth_token");

    const response = await this.apiClient.get(
      `/auth/users?currentUserId=${currentUserId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  }
}
