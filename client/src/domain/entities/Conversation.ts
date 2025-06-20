import type { User } from "./User"
import type { Message } from "./Message"

export interface Conversation {
  id: string
  participants: User[]
  lastMessage?: Message
  isGroup: boolean
  groupName?: string
  groupAvatar?: string
  createdAt: Date
  updatedAt: Date
}
