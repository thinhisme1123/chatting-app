import { FriendRequestNotification } from "@/src/domain/entities/Notifications";
import { INotificationRepository } from "@/src/domain/interfaces/INotificationRepository";
import { AxiosInstance } from "axios";
import { ApiClient } from "../api/ApiClient";

export class NotificationRepository implements INotificationRepository {
  private readonly apiClient: AxiosInstance;

  constructor() {
    this.apiClient = new ApiClient().instance;
  }

  async getAffFriendNotifications(currentUserId: string): Promise<FriendRequestNotification[]> {
    const response = await this.apiClient.post(
      `/friend/pending-requests`,
      {
        currentUserId,
      },
      {
        withCredentials: true,
      }
    );

    return response.data;
  }
}
