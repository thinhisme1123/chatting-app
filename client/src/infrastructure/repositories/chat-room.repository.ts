import { ChatRoom } from "@/src/domain/entities/ChatRoom";
import { CreateRoomInput } from "@/src/domain/entities/CreateRoomInput";
import { AxiosInstance } from "axios";
import { ApiClient } from "../api/ApiClient";
import { GroupMessage } from "@/src/domain/entities/GroupMessage";
import { IChatRoomRepository } from "@/src/domain/interfaces/IChatRoomRepository";

export class ChatRoomRepository implements IChatRoomRepository {
  private readonly apiClient: AxiosInstance;

  constructor() {
    this.apiClient = new ApiClient().instance;
  }

  async createRoom(input: CreateRoomInput): Promise<ChatRoom> {
    const res = await this.apiClient.post("/chatroom/create", input, {
      withCredentials: true,
    });

    return res.data;
  }

  async getRoomsByUser(userId: string): Promise<ChatRoom[]> {
    const res = await this.apiClient.get(`/chatroom/get-room/${userId}`);
    return res.data;
  }

  async getGroupMessages(roomId: string): Promise<GroupMessage[]> {
    const response = await this.apiClient.get(
      `/chatroom/get-group-messages/${roomId}`
    );
    return response.data;
  }

  async getGroupLastMessage(roomId: string): Promise<GroupMessage> {
    const response = await this.apiClient.get(`/messages/room-last-message/${roomId}`);
    return response.data;
  }
}
