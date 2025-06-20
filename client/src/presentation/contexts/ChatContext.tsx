"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import type { Conversation } from "../../domain/entities/Conversation"
import type { Message } from "../../domain/entities/Message"
import { ChatUseCases } from "../../application/usecases/ChatUseCases"
import { ChatRepository } from "@/src/infrastructure/repositories/ChatRepository"
import { SocketService } from "@/src/infrastructure/socket/SocketService"
import { useAuth } from "./AuthContext"

interface ChatContextType {
  conversations: Conversation[]
  currentConversation: Conversation | null
  messages: Message[]
  setCurrentConversation: (conversation: Conversation | null) => void
  sendMessage: (content: string) => Promise<void>
  loading: boolean
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)

  const { user } = useAuth()
  const chatUseCases = new ChatUseCases(new ChatRepository())
  const socketService = new SocketService()

  useEffect(() => {
    if (user) {
      loadConversations()
      const token = localStorage.getItem("auth_token")
      if (token) {
        socketService.connect(token)
        socketService.onNewMessage(handleNewMessage)
      }
    }

    return () => {
      socketService.disconnect()
    }
  }, [user])

  useEffect(() => {
    if (currentConversation) {
      loadMessages(currentConversation.id)
      socketService.joinConversation(currentConversation.id)
    }
  }, [currentConversation])

  const loadConversations = async () => {
    try {
      setLoading(true)
      const data = await chatUseCases.getConversations()
      setConversations(data)
    } catch (error) {
      console.error("Error loading conversations:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async (conversationId: string) => {
    try {
      const data = await chatUseCases.getMessages(conversationId)
      setMessages(data)
    } catch (error) {
      console.error("Error loading messages:", error)
    }
  }

  const sendMessage = async (content: string) => {
    if (!currentConversation) return

    try {
      const message = await chatUseCases.sendMessage(currentConversation.id, content)
      setMessages((prev) => [...prev, message])
      socketService.sendMessage({
        content,
        senderId: user!.id,
        conversationId: currentConversation.id,
        messageType: "text",
        isRead: false,
        fromUserId: "",
        toUserId: "",
        senderName: ""
      })
    } catch (error) {
      console.error("Error sending message:", error)
    }
  }

  const handleNewMessage = (message: Message) => {
    if (currentConversation && message.conversationId === currentConversation.id) {
      setMessages((prev) => [...prev, message])
    }
  }

  return (
    <ChatContext.Provider
      value={{
        conversations,
        currentConversation,
        messages,
        setCurrentConversation,
        sendMessage,
        loading,
      }}
    >
      {children}
    </ChatContext.Provider>
  )
}

export const useChat = () => {
  const context = useContext(ChatContext)
  if (!context) {
    throw new Error("useChat must be used within ChatProvider")
  }
  return context
}
