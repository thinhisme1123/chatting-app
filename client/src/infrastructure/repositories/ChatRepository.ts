import type { IChatRepository } from "../../domain/repositories/IChatRepository"
import type { Conversation } from "../../domain/entities/Conversation"
import type { Message } from "../../domain/entities/Message"
import axios, { type AxiosInstance } from "axios"

export class ChatRepository implements IChatRepository {
  private apiClient: AxiosInstance

  constructor() {
    this.apiClient = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
      },
    })

    // Add auth token to requests
    this.apiClient.interceptors.request.use((config) => {
      const token = localStorage.getItem("auth_token")
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    })
  }
  async getConversations(): Promise<Conversation[]> {
    const response = await this.apiClient.get("/conversations")
    return response.data
  }

  async getMessages(conversationId: string): Promise<Message[]> {
    const response = await this.apiClient.get(`/conversations/${conversationId}/messages`)
    return response.data
  }

  async getLastMessage(user1Id: string, user2Id: string): Promise<Message> {
    const response = await this.apiClient.get("/messages/last", {
    params: { user1: user1Id, user2: user2Id },
  });

  return response.data.message;
  }

  async sendMessage(conversationId: string, content: string): Promise<Message> {
    const response = await this.apiClient.post(`/conversations/${conversationId}/messages`, {
      content,
      messageType: "text",
    })
    return response.data
  }

  async createConversation(participantIds: string[], isGroup?: boolean, groupName?: string): Promise<Conversation> {
    const response = await this.apiClient.post("/conversations", {
      participantIds,
      isGroup,
      groupName,
    })
    return response.data
  }
}
