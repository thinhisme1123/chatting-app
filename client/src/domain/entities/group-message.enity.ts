// src/domain/entities/group-message.entity.ts

export interface GroupMessage {
  id: string;
  roomId: string;
  fromUserId: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  timestamp: string | Date; // nhận từ BE có thể là string
}
