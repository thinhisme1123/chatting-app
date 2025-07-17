import { ChatRoomRepository } from './../../infrastructure/repositories/chat-room.repository';

export class ChatRoomUseCase {
  constructor(private readonly repo: ChatRoomRepository) {}

  async createRoom(name: string, ownerId: string, members: string[], avatarUrl?: string) {
  return this.repo.createRoom(name, ownerId, members, avatarUrl);
}
}
