import { io, type Socket } from "socket.io-client"

export class SocketService {
  private socket: Socket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5

  connect(token: string) {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000"

    this.socket = io(socketUrl, {
      auth: { token },
      transports: ["websocket", "polling"],
    })

    this.setupEventListeners()
  }

  private setupEventListeners() {
    if (!this.socket) return

    this.socket.on("connect", () => {
      console.log("✅ Connected to server")
      this.reconnectAttempts = 0
    })

    this.socket.on("disconnect", (reason) => {
      console.log("❌ Disconnected from server:", reason)
    })

    this.socket.on("connect_error", (error) => {
      console.error("Connection error:", error)
      this.handleReconnect()
    })
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      console.log(`Reconnecting... Attempt ${this.reconnectAttempts}`)
      setTimeout(() => {
        this.socket?.connect()
      }, 1000 * this.reconnectAttempts)
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }

  // Join conversation room
  joinConversation(conversationId: string) {
    this.socket?.emit("join_conversation", conversationId)
  }

  // Leave conversation room
  leaveConversation(conversationId: string) {
    this.socket?.emit("leave_conversation", conversationId)
  }

  // Send message
  sendMessage(data: {
    conversationId: string
    content: string
    messageType?: "text" | "image" | "file"
  }) {
    this.socket?.emit("send_message", data)
  }

  // Listen for new messages
  onNewMessage(callback: (message: any) => void) {
    this.socket?.on("new_message", callback)
  }

  // Listen for user status changes
  onUserStatusChange(callback: (data: { userId: string; isOnline: boolean }) => void) {
    this.socket?.on("user_status_change", callback)
  }

  // Listen for typing indicators
  onTyping(callback: (data: { userId: string; conversationId: string; isTyping: boolean }) => void) {
    this.socket?.on("typing", callback)
  }

  // Send typing indicator
  sendTyping(conversationId: string, isTyping: boolean) {
    this.socket?.emit("typing", { conversationId, isTyping })
  }

  // Listen for message read receipts
  onMessageRead(callback: (data: { messageId: string; userId: string }) => void) {
    this.socket?.on("message_read", callback)
  }

  // Remove all listeners
  removeAllListeners() {
    this.socket?.removeAllListeners()
  }
}

export const socketService = new SocketService()
