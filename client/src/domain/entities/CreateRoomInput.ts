export interface CreateRoomInput {
  name: string;
  description: string;
  creatorId: string;
  memberIds: string[];
  avatar?: string;
  theme?: string;
}
