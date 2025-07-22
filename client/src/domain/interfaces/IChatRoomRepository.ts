// src/domain/interfaces/IChatRoomRepository.ts
import { GroupMessage } from "../entities/group-message.enity";

export interface IChatRoomRepository {
  getGroupMessages(roomId: string): Promise<GroupMessage[]>;
}
