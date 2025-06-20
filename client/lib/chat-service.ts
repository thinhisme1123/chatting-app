import { apiClient } from "./api-client"

export interface Message {
  id: string
  content: string
  senderId: string
  conversationId: string
  messageType: "text" | "image" | "file"
  timestamp: Date
  isRead: boolean
}

export interface Conversation {
  id: string
  participants: Array<{
    id: string
    username: string
    avatar?: string
    isOnline: boolean
  }>
  lastMessage?: Message
  isGroup: boolean
  groupName?: string
  groupAvatar?: string
  createdAt: Date
  updatedAt: Date
}

export interface CreateConversationRequest {
  participantIds: string[]
  isGroup?: boolean
  groupName?: string
}

export interface SendMessageRequest {
  content: string
  messageType?: "text" | "image" | "file"
}

export class ChatService {
  async getConversations(): Promise<Conversation[]> {
    const response = await apiClient.instance.get("/conversations")
    return response.data
  }

  async getConversation(conversationId: string): Promise<Conversation> {
    const response = await apiClient.instance.get(`/conversations/${conversationId}`)
    return response.data
  }

  async createConversation(data: CreateConversationRequest): Promise<Conversation> {
    const response = await apiClient.instance.post("/conversations", data)
    return response.data
  }

  async getMessages(conversationId: string, page = 1, limit = 50): Promise<Message[]> {
    const response = await apiClient.instance.get(`/conversations/${conversationId}/messages`, {
      params: { page, limit },
    })
    return response.data
  }

  async sendMessage(conversationId: string, data: SendMessageRequest): Promise<Message> {
    const response = await apiClient.instance.post(`/conversations/${conversationId}/messages`, data)
    return response.data
  }

  async markMessageAsRead(messageId: string): Promise<void> {
    await apiClient.instance.patch(`/messages/${messageId}/read`)
  }

  async searchUsers(query: string): Promise<Array<{ id: string; username: string; avatar?: string }>> {
    const response = await apiClient.instance.get("/users/search", {
      params: { q: query },
    })
    return response.data
  }

  async uploadFile(file: File): Promise<{ url: string; filename: string }> {
    const formData = new FormData()
    formData.append("file", file)

    const response = await apiClient.instance.post("/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })

    return response.data
  }
}

export const chatService = new ChatService()
