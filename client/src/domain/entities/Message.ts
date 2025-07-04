export interface Message {
  id: string;
  senderId: string;
  conversationId:string;
  fromUserId: string;
  toUserId: string;
  senderName: string;
  content: string;
  messageType: string;
  isRead: boolean;
  timestamp: Date;
}
