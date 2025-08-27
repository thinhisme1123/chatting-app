import { Message } from "@/src/domain/entities/Message";
import type { IChatRepository } from "../../domain/interfaces/IChatRepository";

export class ChatUseCases {
  constructor(private readonly chatRepository: IChatRepository) {}

  async getMessages(conversationId: string) {
    return await this.chatRepository.getMessages(conversationId);
  }

  async getLastMessage(user1Id: string, user2Id: string) {
    return await this.chatRepository.getLastMessage(user1Id, user2Id);
  }

  async sendMessage(conversationId: string, content: string) {
    return await this.chatRepository.sendMessage(conversationId, content);
  }

  async getHistoryMessages(userId: string, selectedUserId: string) {
    return await this.chatRepository.getMessageHistory(userId, selectedUserId);
  }

  async editMessage(id: string, content: string): Promise<Message> {
    return this.chatRepository.editMessage(id, content);
  }

  async deleteMessage(
    id: string,
    isGroup: boolean,
    selectUserId: string
  ) {
    this.chatRepository.deleteMessage(id, isGroup, selectUserId);
  }
}
