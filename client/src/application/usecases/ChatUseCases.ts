import type { IChatRepository } from "../../domain/repositories/IChatRepository"

export class ChatUseCases {
  constructor(private chatRepository: IChatRepository) {}

  async getConversations() {
    return await this.chatRepository.getConversations()
  }

  async getMessages(conversationId: string) {
    return await this.chatRepository.getMessages(conversationId)
  }

  async getLastMessage(user1Id: string, user2Id: string) {
    return await this.chatRepository.getLastMessage(user1Id, user2Id)
  }

  async sendMessage(conversationId: string, content: string) {
    return await this.chatRepository.sendMessage(conversationId, content)
  }

  async createConversation(participantIds: string[], isGroup?: boolean, groupName?: string) {
    return await this.chatRepository.createConversation(participantIds, isGroup, groupName)
  }
}
