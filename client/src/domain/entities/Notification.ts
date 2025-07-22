export interface FriendRequestNotification {
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

export interface NewMessageNotification {
  id: string;
  sender: {
    id: string;
    username: string;
    avatar?: string;
  };
  content: string;
  createdAt: string;
  read: boolean;
}

export interface AceptedFriendRequestNotification {
  id: string;
  username: string;
  avatar: string;
  lastSeen: Date;
  createAt: Date;
  read: boolean;
}

export type AppNotification =
  | (FriendRequestNotification & { type: "friend-request" })
  | (NewMessageNotification & { type: "new-message" })
  | (AceptedFriendRequestNotification & { type: "acepted-friend-request" })
