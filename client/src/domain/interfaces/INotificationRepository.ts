import { Notification } from "../entities/Notification";

export interface INotificationRepository {
  getNotifications(currentUserId: string): Promise<Notification[]>;
}
