export interface Message {
  id: string;
  fromUserId: string;
  toUserId: string;
  senderName: string;
  content: string;
  timestamp: Date;
}
