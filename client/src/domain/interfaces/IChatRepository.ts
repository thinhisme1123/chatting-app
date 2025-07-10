import type { Conversation } from "../entities/Conversation"
import type { Message } from "../entities/Message"

export interface IChatRepository {
  getConversations(): Promise<Conversation[]>
  getMessages(conversationId: string): Promise<Message[]>
  getLastMessage(user1Id: string, user2Id: string) : Promise<Message>
  sendMessage(conversationId: string, content: string): Promise<Message>
  createConversation(participantIds: string[], isGroup?: boolean, groupName?: string): Promise<Conversation>
}
