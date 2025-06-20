export interface User {
  id: string
  email: string
  username: string
  avatar?: string
  isOnline: boolean
  lastSeen: Date
  createdAt: Date
}
