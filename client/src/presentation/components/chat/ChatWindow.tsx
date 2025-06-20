"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { useChat } from "../../contexts/ChatContext"
import { useAuth } from "../../contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Send } from "lucide-react"

export const ChatWindow: React.FC = () => {
  const [newMessage, setNewMessage] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { currentConversation, messages, sendMessage } = useChat()
  const { user } = useAuth()

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    await sendMessage(newMessage)
    setNewMessage("")
  }

  if (!currentConversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900">Chọn một cuộc trò chuyện</h3>
          <p className="text-gray-500">Chọn một cuộc trò chuyện để bắt đầu nhắn tin</p>
        </div>
      </div>
    )
  }

  const getConversationTitle = () => {
    if (currentConversation.isGroup) {
      return currentConversation.groupName || "Nhóm chat"
    }
    return currentConversation.participants.find((p) => p.id !== user?.id)?.username || "Unknown"
  }

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Header */}
      <CardHeader className="border-b border-gray-200">
        <CardTitle className="flex items-center space-x-3">
          <Avatar>
            <AvatarImage
              src={
                currentConversation.isGroup
                  ? currentConversation.groupAvatar
                  : currentConversation.participants[0]?.avatar
              }
            />
            <AvatarFallback>{getConversationTitle().charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold">{getConversationTitle()}</h3>
            {!currentConversation.isGroup && (
              <p className="text-sm text-gray-500">
                {currentConversation.participants[0]?.isOnline ? "Đang hoạt động" : "Không hoạt động"}
              </p>
            )}
          </div>
        </CardTitle>
      </CardHeader>

      {/* Messages */}
      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => {
          const isOwn = message.senderId === user?.id
          const sender = currentConversation.participants.find((p) => p.id === message.senderId)

          return (
            <div key={message.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
              <div
                className={`flex items-end space-x-2 max-w-xs lg:max-w-md ${isOwn ? "flex-row-reverse space-x-reverse" : ""}`}
              >
                {!isOwn && (
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={sender?.avatar || "/placeholder.svg"} />
                    <AvatarFallback className="text-xs">{sender?.username?.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                )}

                <div
                  className={`px-4 py-2 rounded-lg ${isOwn ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-900"}`}
                >
                  {!isOwn && currentConversation.isGroup && (
                    <p className="text-xs font-medium mb-1 opacity-70">{sender?.username}</p>
                  )}
                  <p className="text-sm">{message.content}</p>
                  <p className={`text-xs mt-1 ${isOwn ? "text-blue-100" : "text-gray-500"}`}>
                    {new Date(message.timestamp).toLocaleTimeString("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </CardContent>

      {/* Message Input */}
      <div className="border-t border-gray-200 p-4">
        <form onSubmit={handleSendMessage} className="flex space-x-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Nhập tin nhắn..."
            className="flex-1"
          />
          <Button type="submit" size="icon">
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}
