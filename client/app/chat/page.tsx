"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Users, Send, Search, Plus, Settings, LogOut, Phone, Video, MoreVertical } from "lucide-react"

// Mock data
const mockChats = [
  {
    id: "1",
    type: "direct",
    name: "Trần Thị B",
    avatar: "/placeholder.svg?height=40&width=40",
    lastMessage: "Chào bạn! Bạn có khỏe không?",
    lastMessageTime: "2 phút",
    unreadCount: 2,
    isOnline: true,
  },
  {
    id: "2",
    type: "direct",
    name: "Lê Văn C",
    avatar: "/placeholder.svg?height=40&width=40",
    lastMessage: "Cảm ơn bạn nhiều!",
    lastMessageTime: "1 giờ",
    unreadCount: 0,
    isOnline: false,
  },
  {
    id: "3",
    type: "room",
    name: "Nhóm Dự án ABC",
    avatar: "/placeholder.svg?height=40&width=40",
    lastMessage: "Nguyễn Văn A: Cuộc họp lúc 2h chiều nhé",
    lastMessageTime: "3 giờ",
    unreadCount: 5,
    memberCount: 8,
  },
]

const mockMessages = [
  {
    id: "1",
    senderId: "2",
    senderName: "Trần Thị B",
    content: "Chào bạn! Bạn có khỏe không?",
    timestamp: new Date(Date.now() - 10 * 60 * 1000),
    isOwn: false,
  },
  {
    id: "2",
    senderId: "1",
    senderName: "Bạn",
    content: "Chào bạn! Mình khỏe, cảm ơn bạn. Bạn thì sao?",
    timestamp: new Date(Date.now() - 8 * 60 * 1000),
    isOwn: true,
  },
]

export default function ChatPage() {
  const [selectedChat, setSelectedChat] = useState(mockChats[0])
  const [messages, setMessages] = useState(mockMessages)
  const [newMessage, setNewMessage] = useState("")

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    const message = {
      id: Date.now().toString(),
      senderId: "1",
      senderName: "Bạn",
      content: newMessage,
      timestamp: new Date(),
      isOwn: true,
    }

    setMessages((prev) => [...prev, message])
    setNewMessage("")
  }

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r flex flex-col">
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Tin nhắn</h2>
            <Button variant="ghost" size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="Tìm kiếm cuộc trò chuyện..." className="pl-10" />
          </div>
        </div>

        {/* Chat list */}
        <ScrollArea className="flex-1">
          <div className="p-2">
            {mockChats.map((chat) => (
              <div
                key={chat.id}
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedChat?.id === chat.id ? "bg-blue-50 border border-blue-200" : "hover:bg-gray-50"
                }`}
                onClick={() => setSelectedChat(chat)}
              >
                <div className="relative">
                  <Avatar>
                    <AvatarImage src={chat.avatar || "/placeholder.svg"} />
                    <AvatarFallback>
                      {chat.type === "room" ? <Users className="h-4 w-4" /> : chat.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  {chat.type === "direct" && chat.isOnline && (
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium truncate">{chat.name}</h3>
                    <span className="text-xs text-gray-500">{chat.lastMessageTime}</span>
                  </div>
                  <p className="text-sm text-gray-600 truncate">{chat.lastMessage}</p>
                  {chat.type === "room" && (
                    <div className="flex items-center gap-1 mt-1">
                      <Users className="h-3 w-3 text-gray-400" />
                      <span className="text-xs text-gray-500">{chat.memberCount} thành viên</span>
                    </div>
                  )}
                </div>

                {chat.unreadCount > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {chat.unreadCount}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* User info */}
        <div className="p-4 border-t">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src="/placeholder.svg?height=40&width=40" />
              <AvatarFallback>A</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h4 className="font-medium">Nguyễn Văn A</h4>
              <p className="text-sm text-green-600">Đang hoạt động</p>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Chat header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={selectedChat.avatar || "/placeholder.svg"} />
              <AvatarFallback>{selectedChat.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold">{selectedChat.name}</h3>
              <p className="text-sm text-gray-600">
                {selectedChat.type === "direct"
                  ? selectedChat.isOnline
                    ? "Đang hoạt động"
                    : "Không hoạt động"
                  : `${selectedChat.memberCount} thành viên`}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="ghost" size="sm">
              <Phone className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Video className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex gap-3 ${message.isOwn ? "flex-row-reverse" : ""}`}>
                {!message.isOwn && (
                  <Avatar className="w-8 h-8">
                    <AvatarImage src="/placeholder.svg?height=32&width=32" />
                    <AvatarFallback>{message.senderName.charAt(0)}</AvatarFallback>
                  </Avatar>
                )}

                <div className={`flex flex-col ${message.isOwn ? "items-end" : "items-start"}`}>
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                      message.isOwn ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                  </div>
                  <span className="text-xs text-gray-500 mt-1">
                    {message.timestamp.toLocaleTimeString("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Message input */}
        <div className="border-t p-4">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Nhập tin nhắn..."
              className="flex-1"
            />
            <Button type="submit" size="icon">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
