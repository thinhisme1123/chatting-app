// application/usecases/FriendUseCases.ts
import { IFriendRepository } from "@/src/domain/interfaces/IFriendRepository";

export class FriendUseCases {
  constructor(private readonly friendRepository: IFriendRepository) {}

  async searchUsers(query: string, currentUserId: string) {
    return await this.friendRepository.searchUsers(query, currentUserId);
  }

  async sendFriendRequest(fromUserId: string, toUserId: string) {
    return await this.friendRepository.sendFriendRequest(fromUserId, toUserId);
  }

  async getSentFriendRequestIds(currentUserId: string) {
    return await this.friendRepository.getSentFriendRequestIds(currentUserId);
  }

  async respondToRequest(
    requestId: string,
    action: "accept" | "reject"
  ): Promise<void> {
    return await this.friendRepository.respondToRequest(requestId, action);
  }

  async getConfirmedFriends(currentUserId: string) {
    return await this.friendRepository.getConfirmedFriends(currentUserId);
  }

  searchConfirmedFriends(userId: string, query: string) {
    return this.friendRepository.searchConfirmedFriends(userId, query);
  }
}
