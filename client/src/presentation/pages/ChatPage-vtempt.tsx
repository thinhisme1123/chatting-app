"use client"

import type React from "react"
import { ChatWindow } from "../components/chat/ChatWindow"
import { useAuth } from "../contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"

export const ChatPage: React.FC = () => {
  const { user, logout } = useAuth()

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <h1 className="text-xl font-bold text-gray-900">Chat App</h1>
        </div>

        <div className="flex items-center space-x-3">
          <span className="text-sm text-gray-600">Xin chào, {user?.username}</span>
          <Button variant="outline" size="sm" onClick={logout}>
            <LogOut className="w-4 h-4 mr-2" />
            Đăng xuất
          </Button>
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="flex-1 flex overflow-hidden">
        <ChatWindow />
      </div>
    </div>
  )
}
