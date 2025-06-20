export interface Message {
  id: string
  content: string
  senderId: string
  conversationId: string
  messageType: "text" | "image" | "file"
  timestamp: Date
  isRead: boolean
}
