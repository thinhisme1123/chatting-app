// infrastructure/repositories/FriendRepository.ts
import { IFriendRepository } from "@/src/domain/interfaces/IFriendRepository";
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

    this.apiClient.interceptors.request.use((config) => {
      const token = localStorage.getItem("auth_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  // POST: get users by keyword
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

  // POST: send add friend request
  async sendFriendRequest(fromUserId: string, toUserId: string): Promise<any> {
    const response = await this.apiClient.post(`/friend/request`, {
      fromUserId,
      toUserId,
    });
    return response.data;
  }

  // POST: get friend the user sent
  async getSentFriendRequestIds(currentUserId: string): Promise<string[]> {
    const response = await this.apiClient.post(`/friend/sent`, {
      userId: currentUserId,
    });
    return response.data;
  }

  // POST: update the reponse of the add friend request
  async respondToRequest(
    requestId: string,
    action: "accept" | "reject"
  ): Promise<void> {
    await this.apiClient.post("/friend/respond", { requestId, action });
  }

  // GET: get confirm friend and list ChatPage
  async getConfirmedFriends(currentUserId: string): Promise<User[]> {
    const response = await this.apiClient.post("/friend/list", {
      userId: currentUserId,
    });
    return response.data;
  }

  async searchConfirmedFriends(
    userId: string,
    query: string
  ): Promise<User[]> {
    const response = await this.apiClient.get(`/friend/search`, {
      params: {
        userId,
        query,
      },
    });
    return response.data;
  }
}
