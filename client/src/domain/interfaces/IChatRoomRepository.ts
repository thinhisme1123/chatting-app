// src/domain/interfaces/IChatRoomRepository.ts
import { ChatRoom } from "../entities/ChatRoom";
import { CreateRoomInput } from "../entities/CreateRoomInput";
import { GroupMessage } from "../entities/GroupMessage";

export interface IChatRoomRepository {
  createRoom(input: CreateRoomInput): Promise<ChatRoom>
  getGroupMessages(roomId: string): Promise<GroupMessage[]>;
  getGroupLastMessage(roomId: string): Promise<GroupMessage>;
}
