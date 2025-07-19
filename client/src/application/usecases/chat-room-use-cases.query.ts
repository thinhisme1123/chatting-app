import { ChatRoom } from "@/src/domain/entities/ChatRoom";
import { ChatRoomRepository } from "./../../infrastructure/repositories/chat-room.repository";
import { CreateRoomInput } from "@/src/domain/entities/CreateRoomInput";

export class ChatRoomUseCase {
  constructor(private readonly repo: ChatRoomRepository) {}

  async createRoom(input: CreateRoomInput): Promise<ChatRoom> {
    return this.repo.createRoom(input);
  }

  async getRoomsForUser(userId: string) {
    return this.repo.getRoomsByUser(userId);
  }
}
