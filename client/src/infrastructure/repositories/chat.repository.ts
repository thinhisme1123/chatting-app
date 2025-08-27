import { type AxiosInstance } from "axios";
import type { Message } from "../../domain/entities/Message";
import type { IChatRepository } from "../../domain/interfaces/IChatRepository";
import { ApiClient } from "../api/ApiClient";
import { socket } from "@/src/sockets/baseSocket";

export class ChatRepository implements IChatRepository {
  private readonly apiClient: AxiosInstance;

  constructor() {
    this.apiClient = new ApiClient().instance;
  }
  async getMessages(conversationId: string): Promise<Message[]> {
    const response = await this.apiClient.get(
      `/conversations/${conversationId}/messages`
    );
    return response.data;
  }

  async getMessageHistory(
    userId: string,
    selectedUserId: string
  ): Promise<Message[]> {
    const response = await this.apiClient.get(
      `/messages/history/${userId}/${selectedUserId}`
    );
    return response.data;
  }

  async getLastMessage(user1Id: string, user2Id: string): Promise<Message> {
    const response = await this.apiClient.get("/messages/last", {
      params: { user1: user1Id, user2: user2Id },
    });

    return response.data.message;
  }

  async sendMessage(conversationId: string, content: string): Promise<Message> {
    const response = await this.apiClient.post(
      `/conversations/${conversationId}/messages`,
      {
        content,
        messageType: "text",
      }
    );
    return response.data;
  }

  async editMessage(messageId: string, content: string): Promise<Message> {
    const response = await this.apiClient.put(`/messages/${messageId}`, {
      content,
    });
    return response.data;
  }

  async deleteMessage(
    messageId: string,
    isGroup: boolean,
    targetId: string
  ): Promise<Message> {
    const response = await this.apiClient.delete(`/messages/delete/${messageId}`, {
      data: { isGroup, targetId },
    });
    return response.data;
  }
}
