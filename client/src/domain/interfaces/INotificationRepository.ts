import { FriendRequestNotification } from "../entities/Notifications";

export interface INotificationRepository {
  getAffFriendNotifications(currentUserId: string): Promise<FriendRequestNotification[]>;
}
