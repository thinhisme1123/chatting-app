export interface ChatRoom {
  id: string;
  name: string;
  ownerId: string;
  avatar?: string;
  members: { id: string; username: string; avatar?: string }[];
}
