import type {
  IAuthRepository,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
} from "../../domain/repositories/IAuthRepository";
import type { User } from "../../domain/entities/User";
import axios, { type AxiosInstance } from "axios";

export class AuthRepository implements IAuthRepository {
  private apiClient: AxiosInstance;

  constructor() {
    this.apiClient = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Add auth token to requests
    this.apiClient.interceptors.request.use((config) => {
      const token = localStorage.getItem("auth_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  async login(request: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await this.apiClient.post("/auth/login", request, {
        withCredentials: true, // 🔥 Rất quan trọng để gửi cookie qua
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
