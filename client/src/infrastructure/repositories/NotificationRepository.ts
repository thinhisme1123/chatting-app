import { INotificationRepository } from "@/src/domain/interfaces/INotificationRepository";
import { FriendRequestNotification } from "@/src/domain/entities/Notification";
import axios, { AxiosInstance } from "axios";

export class NotificationRepository implements INotificationRepository {
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
