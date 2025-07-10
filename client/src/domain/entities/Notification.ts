export interface Notification {
  id: string;
  fromUser: {
    id: string;
    username: string;
    email: string;
    avatar?: string;
  };
  createdAt: string;
  read: boolean;
}
