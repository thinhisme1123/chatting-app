import { ChatRoom } from "@/src/domain/entities/ChatRoom";
import { AxiosInstance } from "axios";
import { ApiClient } from "../api/ApiClient";

export class ChatRoomRepository {
  private readonly apiClient: AxiosInstance;

  constructor() {
    this.apiClient = new ApiClient().instance;
  }

  async createRoom(
    name: string,
    ownerId: string,
    members: string[],
    avatarUrl?: string
  ) {
    const res = await this.apiClient.post(
      "/chat/room",
      {
        name,
        ownerId,
        members,
        avatar: avatarUrl,
      },
      { withCredentials: true }
    );

    return res.data;
  }
}
