import type { Message } from "../entities/Message";

export interface IChatRepository {
  getMessages(conversationId: string): Promise<Message[]>;
  getLastMessage(user1Id: string, user2Id: string): Promise<Message>;
  sendMessage(conversationId: string, content: string): Promise<Message>;
  getMessageHistory(userId: string, selectedUserId: string): Promise<Message[]>;
  editMessage(id: string, content: string): Promise<Message>
  deleteMessage(id: string, isGroup: boolean, selectUserId: string): void
}
