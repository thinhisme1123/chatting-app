// application/usecases/FriendUseCases.ts
import { IFriendRepository } from "@/src/domain/repositories/IFriendRepository";

export class FriendUseCases {
  constructor(private friendRepository: IFriendRepository) {}

  async searchUsers(query: string,currentUserId: string) {
    return await this.friendRepository.searchUsers(query, currentUserId);
  }

  async sendFriendRequest(fromUserId: string, toUserId: string) {
    return await this.friendRepository.sendFriendRequest(fromUserId, toUserId);
  }

  async getSentFriendRequestIds(currentUserId: string) {
    return await this.friendRepository.getSentFriendRequestIds(currentUserId);
  }
}
