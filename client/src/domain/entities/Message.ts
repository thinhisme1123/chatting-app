export interface Message {
  id: string;
  senderId: string;
  conversationId:string;
  fromUserId: string;
  toUserId: string;
  senderName: string;
  content: string;
  isRead: boolean;
  timestamp: Date;
  replyTo?: {
    id: string;
    content: string;
    senderName: string;
  };
}
