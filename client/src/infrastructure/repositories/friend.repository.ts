// infrastructure/repositories/FriendRepository.ts
import { User } from "@/src/domain/entities/User";
import { IFriendRepository } from "@/src/domain/interfaces/IFriendRepository";
import { AxiosInstance } from "axios";
import { ApiClient } from "../api/ApiClient";

export class FriendRepository implements IFriendRepository {
  private readonly apiClient: AxiosInstance;

  constructor() {
    this.apiClient = new ApiClient().instance;
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
    const response = await this.apiClient.post(
      "/friend/list",
      {
        userId: currentUserId,
      },
      { withCredentials: true }
    );
    return response.data;
  }

  async searchConfirmedFriends(userId: string, query: string): Promise<User[]> {
    const response = await this.apiClient.get(`/friend/search`, {
      params: {
        userId,
        query,
      },
    });
    return response.data;
  }
}
