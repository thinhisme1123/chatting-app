"use client"

import type React from "react"
import { useChat } from "../../contexts/ChatContext"
import type { Conversation } from "../../../domain/entities/Conversation"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

export const ConversationList: React.FC = () => {
  const { conversations, currentConversation, setCurrentConversation } = useChat()

  const getConversationName = (conversation: Conversation) => {
    if (conversation.isGroup) {
      return conversation.groupName || "Nhóm chat"
    }
    return conversation.participants[0]?.username || "Unknown"
  }

  const getConversationAvatar = (conversation: Conversation) => {
    if (conversation.isGroup) {
      return conversation.groupAvatar
    }
    return conversation.participants[0]?.avatar
  }

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold">Cuộc trò chuyện</h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        {conversations.map((conversation) => (
          <Card
            key={conversation.id}
            className={`m-2 cursor-pointer transition-colors ${
              currentConversation?.id === conversation.id ? "bg-blue-50 border-blue-200" : "hover:bg-gray-50"
            }`}
            onClick={() => setCurrentConversation(conversation)}
          >
            <CardContent className="p-3">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Avatar>
                    <AvatarImage src={getConversationAvatar(conversation) || "/placeholder.svg"} />
                    <AvatarFallback>{getConversationName(conversation).charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  {!conversation.isGroup && conversation.participants[0]?.isOnline && (
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium truncate">{getConversationName(conversation)}</h3>
                    {conversation.isGroup && (
                      <Badge variant="secondary" className="text-xs">
                        Nhóm
                      </Badge>
                    )}
                  </div>

                  {conversation.lastMessage && (
                    <p className="text-sm text-gray-500 truncate">{conversation.lastMessage.content}</p>
                  )}

                  <p className="text-xs text-gray-400">
                    {new Date(conversation.updatedAt).toLocaleTimeString("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
