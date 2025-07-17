import { type AxiosInstance } from "axios";
import type { Conversation } from "../../domain/entities/Conversation";
import type { Message } from "../../domain/entities/Message";
import type { IChatRepository } from "../../domain/interfaces/IChatRepository";
import { ApiClient } from "../api/ApiClient";

export class ChatRepository implements IChatRepository {
  private readonly apiClient: AxiosInstance;

  constructor() {
    this.apiClient = new ApiClient().instance;
  }

  async getConversations(): Promise<Conversation[]> {
    const response = await this.apiClient.get("/conversations");
    return response.data;
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

  async createConversation(
    participantIds: string[],
    isGroup?: boolean,
    groupName?: string
  ): Promise<Conversation> {
    const response = await this.apiClient.post("/conversations", {
      participantIds,
      isGroup,
      groupName,
    });
    return response.data;
  }
}
