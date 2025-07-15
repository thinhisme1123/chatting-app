import { INotificationRepository } from "../../domain/interfaces/INotificationRepository";

export class NotificationUseCases {
  constructor(private readonly repo: INotificationRepository) {}

  async getUserNotifications(currentUserId: string) {
    return this.repo.getAffFriendNotifications(currentUserId);
  }
}
