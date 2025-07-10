// domain/repositories/IFriendRepository.ts
import { User } from "../entities/User";

export interface IFriendRepository {
  searchUsers(query: string, currentUserId: string): Promise<User[]>;
  sendFriendRequest(fromUserId: string, toUserId: string): Promise<any>;
  getSentFriendRequestIds(currentUserId: string): Promise<string[]>;
}
