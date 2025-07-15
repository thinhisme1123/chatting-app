import { FriendRequestNotification } from "../entities/Notification";

export interface INotificationRepository {
  getAffFriendNotifications(currentUserId: string): Promise<FriendRequestNotification[]>;
}
