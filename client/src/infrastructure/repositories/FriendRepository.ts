// infrastructure/repositories/FriendRepository.ts
import { IFriendRepository } from "@/src/domain/repositories/IFriendRepository";
import { User } from "@/src/domain/entities/User";
import axios, { AxiosInstance } from "axios";

export class FriendRepository implements IFriendRepository {
  private readonly apiClient: AxiosInstance;

  constructor() {
    this.apiClient = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // ✅ Auto attach token from localStorage
    this.apiClient.interceptors.request.use((config) => {
      const token = localStorage.getItem("auth_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  async searchUsers(query: string, currentUserId: string): Promise<User[]> {
    const response = await this.apiClient.post(
      `/friend/search`,
      {
        query,
        currentUserId,
      },
      {
        withCredentials: true,
      }
    );

    return response.data;
  }

  async sendFriendRequest(fromUserId: string, toUserId: string): Promise<any> {
    const response = await this.apiClient.post(`/friend/request`, {
      fromUserId,
      toUserId,
    });
    return response.data;
  }

  async getSentFriendRequestIds(currentUserId: string): Promise<string[]> {
    const response = await this.apiClient.post(`/friend/sent`, {
      userId: currentUserId,
    });
    return response.data;
  }
}
