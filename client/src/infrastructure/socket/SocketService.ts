import { io, type Socket } from "socket.io-client"
import type { Message } from "../../domain/entities/Message"

export class SocketService {
  private socket: Socket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5

  connect(token: string) {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001"

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

  joinConversation(conversationId: string) {
    this.socket?.emit("join_conversation", conversationId)
  }

  leaveConversation(conversationId: string) {
    this.socket?.emit("leave_conversation", conversationId)
  }

  sendMessage(message: Omit<Message, "id" | "timestamp">) {
    this.socket?.emit("send_message", message)
  }

  onNewMessage(callback: (message: Message) => void) {
    this.socket?.on("new_message", callback)
  }

  onUserStatusChange(callback: (userId: string, isOnline: boolean) => void) {
    this.socket?.on("user_status_change", callback)
  }

  removeAllListeners() {
    this.socket?.removeAllListeners()
  }
}
