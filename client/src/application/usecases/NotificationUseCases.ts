import { INotificationRepository } from "../../domain/interfaces/INotificationRepository";

export class NotificationUseCases {
  constructor(private repo: INotificationRepository) {}

  async getUserNotifications(currentUserId: string) {
    return this.repo.getNotifications(currentUserId);
  }
}
