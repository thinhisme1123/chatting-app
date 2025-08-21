// src/domain/entities/group-message.entity.ts

export interface GroupMessage {
  id: string;
  roomId: string;
  fromUserId: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  imageUrl?: string;
  timestamp: string | Date; 
  replyTo?: {
    id: string;
    content: string;
    senderName: string;
    imageUrl?: string;
  };
  edited?: boolean;
}
